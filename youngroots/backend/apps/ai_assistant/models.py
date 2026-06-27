"""
YoungRoots — AI Assistant
Integrates Claude for anonymous SRHR Q&A via Web and WhatsApp.
"""
import uuid, hashlib, logging, requests
import anthropic
from django.conf import settings
from django.db import models
from django.utils import timezone

logger = logging.getLogger('apps')

# ── Models ────────────────────────────────────────────────────────────────────

class ConversationSession(models.Model):
    id             = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    session_token  = models.UUIDField(default=uuid.uuid4, unique=True, db_index=True)
    channel        = models.CharField(max_length=20, default='web',
                                      choices=[('web','Web'),('whatsapp','WhatsApp')])
    language       = models.CharField(max_length=10, default='en')
    started_at     = models.DateTimeField(auto_now_add=True)
    last_active_at = models.DateTimeField(auto_now=True)
    message_count  = models.PositiveIntegerField(default=0)
    topics_detected = models.JSONField(default=list)

    # WhatsApp — store hashed phone number (privacy)
    wa_phone_hash  = models.CharField(max_length=64, blank=True, db_index=True)

    class Meta:
        ordering = ['-started_at']

    @classmethod
    def get_or_create_for_whatsapp(cls, phone_number: str):
        phone_hash = hashlib.sha256(phone_number.encode()).hexdigest()
        session, created = cls.objects.get_or_create(
            wa_phone_hash=phone_hash,
            defaults={'channel': 'whatsapp', 'language': 'en'}
        )
        return session


class AIMessage(models.Model):
    class Role(models.TextChoices):
        USER      = 'user',      'User'
        ASSISTANT = 'assistant', 'Assistant'

    id         = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    session    = models.ForeignKey(ConversationSession, on_delete=models.CASCADE, related_name='messages')
    role       = models.CharField(max_length=15, choices=Role.choices)
    content    = models.TextField()
    created_at = models.DateTimeField(auto_now_add=True)
    topic_tags = models.JSONField(default=list)

    class Meta:
        ordering = ['created_at']


# ── AI Engine ─────────────────────────────────────────────────────────────────

TOPIC_KEYWORDS = {
    'contraception': ['contraception', 'condom', 'pill', 'implant', 'iud', 'family planning', 'morning after'],
    'hiv_sti':       ['hiv', 'aids', 'sti', 'std', 'herpes', 'gonorrhoea', 'testing', 'pep', 'prep'],
    'gbv':           ['violence', 'abuse', 'rape', 'assault', 'gbv', 'forced', 'coercion'],
    'mental_health': ['anxiety', 'depression', 'stress', 'scared', 'worried', 'sad', 'help me'],
    'rights':        ['rights', 'law', 'legal', 'refused', 'denied', 'discrimination'],
    'pregnancy':     ['pregnant', 'pregnancy', 'abortion', 'antenatal', 'birth'],
    'relationships': ['relationship', 'consent', 'partner', 'boyfriend', 'girlfriend'],
}


def detect_topics(text: str) -> list:
    text_lower = text.lower()
    return [topic for topic, kws in TOPIC_KEYWORDS.items() if any(k in text_lower for k in kws)]


def get_ai_response(session: ConversationSession, user_message: str) -> str:
    client = anthropic.Anthropic(api_key=settings.ANTHROPIC_API_KEY)
    history = [
        {'role': m.role, 'content': m.content}
        for m in session.messages.order_by('created_at')[-20:]
    ]
    history.append({'role': 'user', 'content': user_message})
    try:
        response = client.messages.create(
            model=settings.AI_MODEL,
            max_tokens=settings.AI_MAX_TOKENS,
            system=settings.AI_SYSTEM_PROMPT,
            messages=history,
        )
        return response.content[0].text
    except anthropic.RateLimitError:
        logger.warning('Anthropic rate limit hit')
        return ("I'm receiving many questions right now. Please try again in a few minutes. "
                "For urgent help, contact a local health helpline. 💚")
    except Exception as e:
        logger.error(f'Anthropic API error: {e}')
        return "I'm having a technical issue. Please try again shortly. 💚"


def process_chat(session: ConversationSession, user_message: str) -> str:
    """Core chat logic shared by web and WhatsApp channels."""
    topics = detect_topics(user_message)
    AIMessage.objects.create(session=session, role='user', content=user_message, topic_tags=topics)
    ai_response = get_ai_response(session, user_message)
    AIMessage.objects.create(session=session, role='assistant', content=ai_response)
    session.message_count += 2
    existing = set(session.topics_detected)
    existing.update(topics)
    session.topics_detected = list(existing)
    session.save(update_fields=['message_count', 'topics_detected', 'last_active_at'])
    return ai_response


# ── WhatsApp Sending ──────────────────────────────────────────────────────────

def send_whatsapp_message(to_number: str, message: str) -> bool:
    """Send a WhatsApp message via Twilio or Meta Cloud API."""
    provider = getattr(settings, 'WHATSAPP_PROVIDER', 'twilio')
    try:
        if provider == 'twilio':
            return _send_via_twilio(to_number, message)
        else:
            return _send_via_meta(to_number, message)
    except Exception as e:
        logger.error(f'WhatsApp send error ({provider}): {e}')
        return False


def _send_via_twilio(to_number: str, message: str) -> bool:
    from twilio.rest import Client
    client = Client(settings.TWILIO_ACCOUNT_SID, settings.TWILIO_AUTH_TOKEN)
    client.messages.create(
        from_=settings.TWILIO_WHATSAPP_NUMBER,
        to=f'whatsapp:{to_number}',
        body=message,
    )
    return True


def _send_via_meta(to_number: str, message: str) -> bool:
    url = f'https://graph.facebook.com/v19.0/{settings.META_PHONE_NUMBER_ID}/messages'
    headers = {
        'Authorization': f'Bearer {settings.META_WHATSAPP_TOKEN}',
        'Content-Type': 'application/json',
    }
    payload = {
        'messaging_product': 'whatsapp',
        'to': to_number.replace('+', '').replace(' ', ''),
        'type': 'text',
        'text': {'body': message},
    }
    resp = requests.post(url, json=payload, headers=headers, timeout=10)
    return resp.status_code == 200


# ── Serializers ───────────────────────────────────────────────────────────────

from rest_framework import serializers


class ChatMessageSerializer(serializers.Serializer):
    message       = serializers.CharField(max_length=2000)
    session_token = serializers.UUIDField(required=False)
    language      = serializers.ChoiceField(choices=['en', 'sw', 'fr', 'pt', 'am', 'yo'], default='en')


# ── Views ─────────────────────────────────────────────────────────────────────

from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import permissions, status


class ChatView(APIView):
    """Web chat endpoint."""
    permission_classes = [permissions.AllowAny]

    def post(self, request):
        serializer = ChatMessageSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        data          = serializer.validated_data
        user_message  = data['message']
        session_token = data.get('session_token')
        language      = data.get('language', 'en')

        if session_token:
            session, _ = ConversationSession.objects.get_or_create(
                session_token=session_token, defaults={'language': language, 'channel': 'web'}
            )
        else:
            session = ConversationSession.objects.create(language=language, channel='web')

        ai_response = process_chat(session, user_message)
        return Response({
            'session_token':   str(session.session_token),
            'response':        ai_response,
            'topics_detected': detect_topics(user_message),
            'message_count':   session.message_count,
        })


class WhatsAppWebhookView(APIView):
    """
    WhatsApp webhook — handles both verification (GET) and incoming messages (POST).
    Works with Twilio WhatsApp and Meta Cloud API.
    """
    permission_classes = [permissions.AllowAny]

    # ── Meta verification handshake ───────────────────────────────────────────
    def get(self, request):
        mode      = request.query_params.get('hub.mode')
        token     = request.query_params.get('hub.verify_token')
        challenge = request.query_params.get('hub.challenge')
        if mode == 'subscribe' and token == settings.META_VERIFY_TOKEN:
            return Response(int(challenge), status=200)
        return Response({'error': 'Verification failed'}, status=403)

    # ── Incoming messages ─────────────────────────────────────────────────────
    def post(self, request):
        provider = getattr(settings, 'WHATSAPP_PROVIDER', 'twilio')
        try:
            if provider == 'twilio':
                return self._handle_twilio(request)
            else:
                return self._handle_meta(request)
        except Exception as e:
            logger.error(f'WhatsApp webhook error: {e}')
            return Response({'status': 'error'}, status=200)  # Always 200 to stop retries

    def _handle_twilio(self, request):
        from_number  = request.data.get('From', '').replace('whatsapp:', '')
        user_message = request.data.get('Body', '').strip()
        if not user_message or not from_number:
            return Response({'status': 'ignored'}, status=200)
        session     = ConversationSession.get_or_create_for_whatsapp(from_number)
        ai_response = process_chat(session, user_message)
        send_whatsapp_message(from_number, ai_response)
        return Response({'status': 'ok'}, status=200)

    def _handle_meta(self, request):
        data  = request.data
        entry = data.get('entry', [{}])[0]
        change = entry.get('changes', [{}])[0]
        value  = change.get('value', {})
        messages = value.get('messages', [])
        if not messages:
            return Response({'status': 'ignored'}, status=200)
        msg          = messages[0]
        from_number  = msg.get('from', '')
        user_message = msg.get('text', {}).get('body', '').strip()
        if not user_message:
            return Response({'status': 'ignored'}, status=200)
        session     = ConversationSession.get_or_create_for_whatsapp(from_number)
        ai_response = process_chat(session, user_message)
        send_whatsapp_message(from_number, ai_response)
        return Response({'status': 'ok'}, status=200)


class ServiceRecommendationView(APIView):
    permission_classes = [permissions.AllowAny]

    def post(self, request):
        need     = request.data.get('need', '')
        location = request.data.get('location', '')
        if not need:
            return Response({'error': 'Please describe your need.'}, status=400)
        client = anthropic.Anthropic(api_key=settings.ANTHROPIC_API_KEY)
        prompt = (f"A young person in {location or 'Africa'} needs: {need}. "
                  f"Recommend a specific type of SRHR service in 2 sentences.")
        response = client.messages.create(
            model=settings.AI_MODEL, max_tokens=300,
            messages=[{'role': 'user', 'content': prompt}],
            system=settings.AI_SYSTEM_PROMPT,
        )
        return Response({'recommendation': response.content[0].text})
