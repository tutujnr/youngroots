from django.urls import path
from .models import ChatView, ServiceRecommendationView

urlpatterns = [
    path('chat/',           ChatView.as_view(),                  name='ai_chat'),
    path('recommend/',      ServiceRecommendationView.as_view(), name='ai_recommend'),
]
