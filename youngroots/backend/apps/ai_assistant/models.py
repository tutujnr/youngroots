"""
YoungRoots — AI Assistant
Integrates Claude (Anthropic) for anonymous SRHR Q&A.
"""
import uuid
import anthropic
import logging
from django.conf import settings
from django.utils import timezone
from django.db import models

logger = logging.getLogger('apps')

# ── MODELS ────────────────────────────────────────────────────────────────────

class ConversationSession(models.Model):
    """
    Tracks an anonymous AI chat session.
    No personal data is stored — only the session token.
    """
    id              = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    session_token   = models.UUIDField(default=uuid.uuid4, unique=True, db_index=True)
    language        = models.CharField(max_length=10, default='en')
    started_at      = models.DateTimeField(auto_now_add=True)
    last_active_at  = models.DateTimeField(auto_now=True)
    message_count   = models.PositiveIntegerField(default=0)

    # Aggregated topic tags (no raw messages stored long-term)
    topics_detected = models.JSONField(default=list)

    class Meta:
        ordering = ['-started_at']

    def __str__(self):
        return f'Session {str(self.session_token)[:8]}'


class AIMessage(models.Model):
    """
    Individual AI conversation turn. Stored for session continuity only.
    Auto-deleted after 24 hours via Celery task.
    """
    class Role(models.TextChoices):
        USER      = 'user',      'User'
        ASSISTANT = 'assistant', 'Assistant'

    id          = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    session     = models.ForeignKey(ConversationSession, on_delete=models.CASCADE, related_name='messages')
    role        = models.CharField(max_length=15, choices=Role.choices)
    content     = models.TextField()
    created_at  = models.DateTimeField(auto_now_add=True)
    topic_tags  = models.JSONField(default=list)

    class Meta:
        ordering = ['created_at']

    def __str__(self):
        return f'{self.role}: {self.content[:60]}'


# ── AI SERVICE ────────────────────────────────────────────────────────────────

SYSTEM_PROMPT = """You are Yara, a warm, non-judgmental AI sexual and reproductive health and rights (SRHR) guide 
designed specifically for young people in Africa aged 10–24.

Your role:
- Provide accurate, evidence-based sexual and reproductive health information
- Answer questions about contraception, STIs, HIV/AIDS, menstruation, pregnancy, consent, GBV, and rights
- Guide users to appropriate local services when needed
- Support users experiencing mental health challenges related to sexual health
- Respect cultural sensitivities while upholding health rights

Communication style:
- Use simple, clear language (Grade 8 reading level)  
- Be empathetic, non-judgmental, and encouraging
- Keep responses to 3–5 sentences unless more detail is requested
- Use appropriate emojis sparingly to create warmth
- Always validate the user's courage in asking

Safety rules:
- If someone indicates they are in immediate danger, prioritise directing them to emergency services
- If someone mentions self-harm or suicidal ideation, provide crisis resources immediately  
- Never diagnose medical conditions — encourage professional consultation
- Never request personal identifying information
- If asked about something outside SRHR, gently redirect to your area of expertise

Languages: Respond in the same language the user writes in. Supported: English, Swahili, French, Portuguese."""


TOPIC_KEYWORDS = {
    'contraception':  ['contraception', 'condom', 'pill', 'implant', 'iud', 'family planning'],
    'hiv_sti':        ['hiv', 'aids', 'sti', 'std', 'herpes', 'gonorrhoea', 'syphilis', 'testing'],
    'gbv':            ['violence', 'abuse', 'rape', 'assault', 'gbv', 'forced', 'coercion'],
    'mental_health':  ['anxiety', 'depression', 'stress', 'scared', 'worried', 'sad', 'help'],
    'rights':         ['rights', 'law', 'legal', 'refused', 'denied', 'discrimination'],
    'pregnancy':      ['pregnant', 'pregnancy', 'abortion', 'antenatal', 'birth'],
    'relationships':  ['relationship', 'consent', 'partner', 'boyfriend', 'girlfriend'],
}


def detect_topics(text: str) -> list:
    text_lower = text.lower()
    return [topic for topic, keywords in TOPIC_KEYWORDS.items()
            if any(kw in text_lower for kw in keywords)]


def build_conversation_history(session: ConversationSession) -> list:
    """Build the messages list for the API call from the session history."""
    return [
        {'role': msg.role, 'content': msg.content}
        for msg in session.messages.order_by('created_at')[-20:]  # Last 20 turns max
    ]


def get_ai_response(session: ConversationSession, user_message: str) -> str:
    """
    Call Claude API with full conversation context and return the AI response.
    """
    client = anthropic.Anthropic(api_key=settings.ANTHROPIC_API_KEY)

    # Build history + new message
    history = build_conversation_history(session)
    history.append({'role': 'user', 'content': user_message})

    try:
        response = client.messages.create(
            model=settings.AI_MODEL,
            max_tokens=settings.AI_MAX_TOKENS,
            system=SYSTEM_PROMPT,
            messages=history,
        )
        return response.content[0].text
    except anthropic.RateLimitError:
        logger.warning('Anthropic rate limit hit')
        return ("I'm receiving many questions right now. Please try again in a few minutes. "
                "For urgent matters, contact your local health helpline. 💚")
    except anthropic.APIError as e:
        logger.error(f'Anthropic API error: {e}')
        return ("I'm having technical difficulties. Please try again shortly. "
                "Remember: if you need urgent help, reach out to a local service directly.")


# ── SERIALIZERS ───────────────────────────────────────────────────────────────

from rest_framework import serializers


class ChatMessageSerializer(serializers.Serializer):
    message         = serializers.CharField(max_length=2000)
    session_token   = serializers.UUIDField(required=False)
    language        = serializers.ChoiceField(
        choices=['en', 'sw', 'fr', 'pt', 'am', 'yo'], default='en'
    )


class ChatResponseSerializer(serializers.Serializer):
    session_token   = serializers.UUIDField()
    response        = serializers.CharField()
    topics_detected = serializers.ListField(child=serializers.CharField())
    message_count   = serializers.IntegerField()


class ConversationSessionSerializer(serializers.ModelSerializer):
    class Meta:
        model  = ConversationSession
        fields = ['session_token', 'language', 'started_at', 'last_active_at',
                  'message_count', 'topics_detected']


# ── VIEWS ─────────────────────────────────────────────────────────────────────

from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import permissions, status
from rest_framework.throttling import ScopedRateThrottle
from django_ratelimit.decorators import ratelimit
from django.utils.decorators import method_decorator


class ChatView(APIView):
    """
    Anonymous AI chat endpoint.
    Accepts a user message and returns Yara's response.
    """
    permission_classes = [permissions.AllowAny]
    throttle_scope     = 'ai_chat'

    @method_decorator(ratelimit(key='ip', rate='30/h', method='POST', block=True))
    def post(self, request):
        serializer = ChatMessageSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        data          = serializer.validated_data
        user_message  = data['message']
        session_token = data.get('session_token')
        language      = data.get('language', 'en')

        # Get or create session
        if session_token:
            session, _ = ConversationSession.objects.get_or_create(
                session_token=session_token,
                defaults={'language': language}
            )
        else:
            session = ConversationSession.objects.create(language=language)

        # Detect topics for analytics (no PII)
        topics = detect_topics(user_message)

        # Store user message
        AIMessage.objects.create(
            session=session, role='user', content=user_message, topic_tags=topics
        )

        # Get AI response
        ai_response = get_ai_response(session, user_message)

        # Store AI response
        AIMessage.objects.create(
            session=session, role='assistant', content=ai_response
        )

        # Update session stats
        session.message_count += 2
        existing_topics = set(session.topics_detected)
        existing_topics.update(topics)
        session.topics_detected = list(existing_topics)
        session.save(update_fields=['message_count', 'topics_detected', 'last_active_at'])

        return Response({
            'session_token':   str(session.session_token),
            'response':        ai_response,
            'topics_detected': topics,
            'message_count':   session.message_count,
        })


class ServiceRecommendationView(APIView):
    """Ask AI to recommend services based on a described need."""
    permission_classes = [permissions.AllowAny]

    def post(self, request):
        need     = request.data.get('need', '')
        location = request.data.get('location', '')
        if not need:
            return Response({'error': 'Please describe your need.'}, status=400)

        client = anthropic.Anthropic(api_key=settings.ANTHROPIC_API_KEY)
        prompt = (
            f"A young person in {location or 'Africa'} needs: {need}. "
            f"What type of SRHR service should they look for? "
            f"Give a brief, actionable recommendation in 2-3 sentences. Be specific about service type."
        )
        response = client.messages.create(
            model=settings.AI_MODEL,
            max_tokens=300,
            messages=[{'role': 'user', 'content': prompt}],
            system=SYSTEM_PROMPT,
        )
        return Response({'recommendation': response.content[0].text})
