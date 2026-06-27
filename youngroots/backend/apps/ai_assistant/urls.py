from django.urls import path
from .models import ChatView, WhatsAppWebhookView, ServiceRecommendationView

urlpatterns = [
    path('chat/',      ChatView.as_view(),                 name='ai_chat'),
    path('whatsapp/',  WhatsAppWebhookView.as_view(),      name='whatsapp_webhook'),
    path('recommend/', ServiceRecommendationView.as_view(), name='ai_recommend'),
]
