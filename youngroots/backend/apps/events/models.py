"""
YoungRoots — Events App
"""
import uuid
from django.db import models
from rest_framework import serializers, generics, permissions
from django.utils import timezone
from django.urls import path


class EventFormat(models.TextChoices):
    IN_PERSON = 'in_person', 'In Person'
    ONLINE    = 'online',    'Online'
    HYBRID    = 'hybrid',    'Hybrid'


class Event(models.Model):
    id           = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    title        = models.CharField(max_length=250)
    description  = models.TextField()
    event_date   = models.DateTimeField()
    end_date     = models.DateTimeField(null=True, blank=True)
    location     = models.CharField(max_length=300, blank=True)
    location_url = models.URLField(blank=True)
    format       = models.CharField(max_length=20, choices=EventFormat.choices, default=EventFormat.IN_PERSON)
    organiser    = models.CharField(max_length=100, default='YoungRoots')
    registration_url = models.URLField(blank=True)
    is_published = models.BooleanField(default=True)
    created_at   = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['event_date']

    def __str__(self):
        return self.title

    @property
    def is_upcoming(self):
        return self.event_date >= timezone.now()


class EventSerializer(serializers.ModelSerializer):
    is_upcoming     = serializers.BooleanField(read_only=True)
    format_display  = serializers.CharField(source='get_format_display', read_only=True)

    class Meta:
        model  = Event
        fields = '__all__'


class EventListView(generics.ListAPIView):
    serializer_class   = EventSerializer
    permission_classes = [permissions.AllowAny]
    filterset_fields   = ['format', 'is_published']

    def get_queryset(self):
        qs = Event.objects.filter(is_published=True)
        show_past = self.request.query_params.get('past', 'false').lower() == 'true'
        if not show_past:
            qs = qs.filter(event_date__gte=timezone.now())
        return qs


class EventDetailView(generics.RetrieveAPIView):
    serializer_class   = EventSerializer
    permission_classes = [permissions.AllowAny]
    queryset           = Event.objects.filter(is_published=True)


class EventAdminView(generics.ListCreateAPIView):
    from apps.accounts.permissions import IsAdminUser
    serializer_class   = EventSerializer
    permission_classes = [IsAdminUser]
    queryset           = Event.objects.all()


urlpatterns = [
    path('',            EventListView.as_view(),   name='event_list'),
    path('<uuid:pk>/',  EventDetailView.as_view(), name='event_detail'),
    path('admin/',      EventAdminView.as_view(),  name='event_admin'),
]
