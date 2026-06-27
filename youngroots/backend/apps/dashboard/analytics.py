from django.db.models import Count
from django.utils import timezone
from datetime import timedelta
from django.core.cache import cache
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import permissions
from apps.accounts.permissions import IsAdvocateOrAdmin


def compute_all_metrics():
    from apps.reports.models import Report
    from apps.ai_assistant.models import ConversationSession
    from apps.locator.models import Service

    now = timezone.now()
    this_month = now.replace(day=1, hour=0, minute=0, second=0, microsecond=0)
    all_reports = Report.objects.all()
    month_count = all_reports.filter(submitted_at__gte=this_month).count()

    type_breakdown = list(all_reports.values('report_type').annotate(count=Count('id')).order_by('-count'))

    resolved = all_reports.filter(status='resolved', resolved_at__isnull=False)
    avg_days = round(sum(r.days_open for r in resolved[:100]) / min(resolved.count(), 100), 1) if resolved.exists() else 0
    referral_count = all_reports.filter(referrals__isnull=False).distinct().count()
    referral_rate = round((referral_count / max(all_reports.count(), 1)) * 100, 1)

    ai_sessions = ConversationSession.objects.all()
    topic_counts = {}
    for s in ai_sessions:
        for t in s.topics_detected:
            topic_counts[t] = topic_counts.get(t, 0) + 1
    top_topics = sorted(topic_counts.items(), key=lambda x: x[1], reverse=True)[:8]

    whatsapp_sessions = ai_sessions.filter(channel='whatsapp').count()
    web_sessions = ai_sessions.filter(channel='web').count()

    return {
        'generated_at': now.isoformat(),
        'reports': {'total': all_reports.count(), 'this_month': month_count, 'by_type': type_breakdown},
        'cases': {'avg_resolution_days': avg_days, 'referral_rate_pct': referral_rate},
        'ai_assistant': {
            'total_sessions': ai_sessions.count(),
            'web_sessions': web_sessions,
            'whatsapp_sessions': whatsapp_sessions,
            'top_topics': [{'topic': t, 'count': c} for t, c in top_topics],
        },
        'services': {'total_active': Service.objects.filter(status='active').count()},
    }


class DashboardMetricsView(APIView):
    permission_classes = [IsAdvocateOrAdmin]
    CACHE_KEY = 'dashboard_metrics'

    def get(self, request):
        if request.query_params.get('refresh') != 'true':
            cached = cache.get(self.CACHE_KEY)
            if cached:
                return Response(cached)
        metrics = compute_all_metrics()
        cache.set(self.CACHE_KEY, metrics, timeout=3600)
        return Response(metrics)


class PublicSummaryView(APIView):
    permission_classes = [permissions.AllowAny]

    def get(self, request):
        from apps.locator.models import Service
        from apps.reports.models import Report
        return Response({
            'services_listed': Service.objects.filter(status='active').count(),
            'cases_resolved': Report.objects.filter(status='resolved').count(),
            'reports_total': Report.objects.count(),
        })


from django.urls import path
urlpatterns = [
    path('metrics/', DashboardMetricsView.as_view(), name='dashboard_metrics'),
    path('summary/', PublicSummaryView.as_view(), name='public_summary'),
]
