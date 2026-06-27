"""
YoungRoots — Contact App
"""
import uuid
from django.db import models
from rest_framework import serializers, generics, permissions, status
from rest_framework.response import Response
from rest_framework.views import APIView
from django.urls import path


class ContactMessage(models.Model):
    class Status(models.TextChoices):
        NEW      = 'new',      'New'
        REPLIED  = 'replied',  'Replied'
        ARCHIVED = 'archived', 'Archived'

    id         = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    name       = models.CharField(max_length=100, blank=True)
    email      = models.EmailField(blank=True)
    subject    = models.CharField(max_length=200, blank=True)
    message    = models.TextField()
    status     = models.CharField(max_length=20, choices=Status.choices, default=Status.NEW)
    created_at = models.DateTimeField(auto_now_add=True)
    replied_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return f'Contact from {self.name or "Anonymous"} — {self.created_at:%Y-%m-%d}'


class ContactSubmitSerializer(serializers.ModelSerializer):
    class Meta:
        model  = ContactMessage
        fields = ['name', 'email', 'subject', 'message']

    def validate_message(self, value):
        if len(value.strip()) < 10:
            raise serializers.ValidationError('Message is too short.')
        return value


class ContactAdminSerializer(serializers.ModelSerializer):
    class Meta:
        model  = ContactMessage
        fields = '__all__'


class ContactSubmitView(APIView):
    permission_classes = [permissions.AllowAny]

    def post(self, request):
        serializer = ContactSubmitSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response({'message': 'Your message has been received. We will respond within 24 hours.'}, status=status.HTTP_201_CREATED)


class ContactAdminListView(generics.ListAPIView):
    from apps.accounts.permissions import IsAdminUser
    serializer_class   = ContactAdminSerializer
    permission_classes = [IsAdminUser]
    queryset           = ContactMessage.objects.all()
    filterset_fields   = ['status']


urlpatterns = [
    path('',       ContactSubmitView.as_view(),    name='contact_submit'),
    path('admin/', ContactAdminListView.as_view(),  name='contact_admin'),
]
