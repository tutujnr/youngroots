"""
YoungRoots — AYSRHR Notes App
Short educational health notes written for young people.
"""
import uuid
from django.db import models
from rest_framework import serializers, generics, permissions
from rest_framework.views import APIView
from rest_framework.response import Response


class NoteCategory(models.TextChoices):
    CONTRACEPTION = 'contraception', 'Contraception'
    RIGHTS        = 'rights',        'Rights'
    GBV           = 'gbv',           'GBV'
    HIV           = 'hiv',           'HIV / STIs'
    CONSENT       = 'consent',       'Consent'
    MENTAL_HEALTH = 'mental_health', 'Mental Health'
    PREGNANCY     = 'pregnancy',     'Pregnancy'
    RELATIONSHIPS = 'relationships', 'Relationships'


class Note(models.Model):
    id          = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    title       = models.CharField(max_length=200)
    category    = models.CharField(max_length=30, choices=NoteCategory.choices)
    body        = models.TextField()
    summary     = models.CharField(max_length=300, blank=True)
    language    = models.CharField(max_length=10, default='en')
    is_published = models.BooleanField(default=True)
    created_at  = models.DateTimeField(auto_now_add=True)
    updated_at  = models.DateTimeField(auto_now=True)
    views_count = models.PositiveIntegerField(default=0)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return self.title


# ── Serializers ───────────────────────────────────────────────────────────────

class NoteListSerializer(serializers.ModelSerializer):
    category_display = serializers.CharField(source='get_category_display', read_only=True)

    class Meta:
        model  = Note
        fields = ['id', 'title', 'category', 'category_display', 'summary', 'language', 'created_at', 'views_count']


class NoteDetailSerializer(serializers.ModelSerializer):
    category_display = serializers.CharField(source='get_category_display', read_only=True)

    class Meta:
        model  = Note
        fields = '__all__'


# ── Views ─────────────────────────────────────────────────────────────────────

class NoteListView(generics.ListAPIView):
    serializer_class   = NoteListSerializer
    permission_classes = [permissions.AllowAny]
    filterset_fields   = ['category', 'language', 'is_published']
    search_fields      = ['title', 'summary', 'body']

    def get_queryset(self):
        return Note.objects.filter(is_published=True)


class NoteDetailView(generics.RetrieveAPIView):
    serializer_class   = NoteDetailSerializer
    permission_classes = [permissions.AllowAny]
    queryset           = Note.objects.filter(is_published=True)

    def retrieve(self, request, *args, **kwargs):
        instance = self.get_object()
        instance.views_count += 1
        instance.save(update_fields=['views_count'])
        return Response(self.get_serializer(instance).data)


class NoteAdminView(generics.ListCreateAPIView):
    """Admin: manage notes."""
    from apps.accounts.permissions import IsAdminUser
    serializer_class   = NoteDetailSerializer
    permission_classes = [IsAdminUser]
    queryset           = Note.objects.all()


# ── URLs ──────────────────────────────────────────────────────────────────────
from django.urls import path

urlpatterns = [
    path('',            NoteListView.as_view(),    name='note_list'),
    path('<uuid:pk>/',  NoteDetailView.as_view(),  name='note_detail'),
    path('admin/',      NoteAdminView.as_view(),   name='note_admin'),
]
