"""
YoungRoots — Advocacy & Data Dashboard
Analytics views using anonymised, aggregated data only.
"""
from django.db.models import Count, Avg, Q
from django.utils import timezone
from datetime import timedelta
from django.core.cache import cache
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import permissions
from apps.accounts.permissions import IsAdvocateOrAdmin


# ── ANALYTICS ENGINE ──────────────────────────────────────────────────────────

def compute_all_metrics():
    """
    Compute all dashboard metrics from anonymised, aggregated data.
    No individual records are exposed.
    """
    from apps.reports.models import Report
    from apps.ai_assistant.models import ConversationSession
    from apps.locator.models import Service

    now        = timezone.now()
    this_month = now.replace(day=1, hour=0, minute=0, second=0, microsecond=0)
    last_month = (this_month - timedelta(days=1)).replace(day=1)

    # ── Report stats ──────────────────────────────────────────────────────────
    all_reports  = Report.objects.all()
    month_rpts   = all_reports.filter(submitted_at__gte=this_month)
    lmonth_rpts  = all_reports.filter(submitted_at__gte=last_month, submitted_at__lt=this_month)
    month_count  = month_rpts.count()
    lmonth_count = lmonth_rpts.count()
    month_change = round(((month_count - lmonth_count) / max(lmonth_count, 1)) * 100, 1)

    # ── Reports by type ───────────────────────────────────────────────────────
    type_breakdown = list(
        all_reports.values('report_type')
        .annotate(count=Count('id'))
        .order_by('-count')
    )

    # ── Reports by urgency ────────────────────────────────────────────────────
    urgency_breakdown = list(
        all_reports.values('urgency')
        .annotate(count=Count('id'))
        .order_by('-count')
    )

    # ── Monthly trend (last 12 months) ────────────────────────────────────────
    monthly_trend = []
    for i in range(11, -1, -1):
        month_start = (now.replace(day=1) - timedelta(days=i * 30)).replace(day=1)
        month_end   = (month_start + timedelta(days=32)).replace(day=1)
        count       = all_reports.filter(submitted_at__gte=month_start, submitted_at__lt=month_end).count()
        monthly_trend.append({
            'month': month_start.strftime('%b %Y'),
            'count': count,
        })

    # ── Resolution stats ──────────────────────────────────────────────────────
    resolved       = all_reports.filter(status='resolved', resolved_at__isnull=False)
    avg_resolution = resolved.annotate(
        days=((timezone.now() - Q(submitted_at=Q(resolved_at))).__class__)
    )
    # Simplified avg days calculation
    if resolved.exists():
        total_days = sum(r.days_open for r in resolved[:100])
        avg_days   = round(total_days / min(resolved.count(), 100), 1)
    else:
        avg_days = 0

    referral_count   = all_reports.filter(referrals__isnull=False).distinct().count()
    referral_rate    = round((referral_count / max(all_reports.count(), 1)) * 100, 1)

    # ── Service gaps ──────────────────────────────────────────────────────────
    service_gap_areas = list(
        all_reports.values('location_area')
        .annotate(count=Count('id'))
        .filter(count__gt=3, location_area__gt='')
        .order_by('-count')[:10]
    )

    # ── AI assistant stats ────────────────────────────────────────────────────
    ai_sessions    = ConversationSession.objects.all()
    topic_counts   = {}
    for session in ai_sessions:
        for topic in session.topics_detected:
            topic_counts[topic] = topic_counts.get(topic, 0) + 1
    top_ai_topics  = sorted(topic_counts.items(), key=lambda x: x[1], reverse=True)[:8]

    # ── Service stats ─────────────────────────────────────────────────────────
    service_by_type = list(
        Service.objects.filter(status='active').values('category')
        .annotate(count=Count('id'))
        .order_by('-count')
    )
    flagged_gaps    = all_reports.filter(report_type='access_denied').values('location_area').distinct().count()

    return {
        'generated_at':       now.isoformat(),
        'reports': {
            'total':          all_reports.count(),
            'this_month':     month_count,
            'month_change':   month_change,
            'by_type':        type_breakdown,
            'by_urgency':     urgency_breakdown,
            'monthly_trend':  monthly_trend,
        },
        'cases': {
            'avg_resolution_days': avg_days,
            'referral_rate_pct':   referral_rate,
            'service_gap_areas':   service_gap_areas,
            'flagged_gap_areas':   flagged_gaps,
        },
        'ai_assistant': {
            'total_sessions': ai_sessions.count(),
            'top_topics':     [{'topic': t, 'count': c} for t, c in top_ai_topics],
        },
        'services': {
            'by_type': service_by_type,
            'total_active': Service.objects.filter(status='active').count(),
        },
    }


# ── VIEWS ─────────────────────────────────────────────────────────────────────

class DashboardMetricsView(APIView):
    """
    Returns aggregated, anonymised metrics for the advocacy dashboard.
    Uses Redis cache — refreshed every hour.
    """
    permission_classes = [IsAdvocateOrAdmin]
    CACHE_KEY          = 'dashboard_metrics'
    CACHE_TTL          = 60 * 60  # 1 hour

    def get(self, request):
        force_refresh = request.query_params.get('refresh') == 'true'
        if not force_refresh:
            cached = cache.get(self.CACHE_KEY)
            if cached:
                return Response(cached)
        metrics = compute_all_metrics()
        cache.set(self.CACHE_KEY, metrics, timeout=self.CACHE_TTL)
        return Response(metrics)


class PublicSummaryView(APIView):
    """Limited public-facing summary stats (for landing page)."""
    permission_classes = [permissions.AllowAny]

    def get(self, request):
        from apps.locator.models import Service
        from apps.reports.models import Report
        return Response({
            'services_listed': Service.objects.filter(status='active').count(),
            'cases_resolved':  Report.objects.filter(status='resolved').count(),
            'reports_total':   Report.objects.count(),
        })
