from django.urls import path
from .analytics import DashboardMetricsView, PublicSummaryView

urlpatterns = [
    path('metrics/',  DashboardMetricsView.as_view(), name='dashboard_metrics'),
    path('summary/',  PublicSummaryView.as_view(),    name='public_summary'),
]
