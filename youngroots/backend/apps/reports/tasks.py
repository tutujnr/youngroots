"""
YoungRoots — Celery Background Tasks
"""
from celery import shared_task
from django.utils import timezone
from datetime import timedelta
import logging

logger = logging.getLogger('apps')


@shared_task
def notify_crisis_report(report_id: str):
    """
    Immediately notifies on-call advocates when a crisis report is submitted.
    Sends a generic alert without exposing the report content.
    """
    from apps.reports.models import Report
    from apps.accounts.models import User, UserRole
    try:
        report    = Report.objects.get(id=report_id)
        advocates = User.objects.filter(role__in=['advocate', 'admin'], is_active=True)
        logger.warning(
            f'CRISIS REPORT: {report.case_id} | Location area: {report.location_area or "unknown"} | '
            f'Notifying {advocates.count()} advocates'
        )
        # In production: send SMS/email via Twilio/SendGrid
        # for advocate in advocates:
        #     send_sms(advocate.phone, f'Crisis report {report.case_id} requires immediate attention.')
    except Exception as e:
        logger.error(f'Crisis notification failed for report {report_id}: {e}')


@shared_task
def auto_assign_reports():
    """
    Periodically assigns new reports to available advocates.
    Runs every 30 minutes via Celery Beat.
    """
    from apps.reports.models import Report, ReportStatus
    from apps.accounts.models import User, UserRole
    unassigned = Report.objects.filter(status=ReportStatus.NEW, assigned_to__isnull=True)
    advocates  = list(User.objects.filter(role='advocate', is_active=True))
    if not advocates:
        return

    for i, report in enumerate(unassigned):
        advocate = advocates[i % len(advocates)]
        report.assigned_to = advocate
        report.status      = ReportStatus.ASSIGNED
        report.save(update_fields=['assigned_to', 'status'])
        logger.info(f'Report {report.case_id} assigned to {advocate.display_name}')


@shared_task
def purge_old_ai_messages():
    """
    Deletes AI chat messages older than 24 hours.
    Runs nightly to protect user privacy.
    """
    from apps.ai_assistant.models import AIMessage
    cutoff  = timezone.now() - timedelta(hours=24)
    deleted, _ = AIMessage.objects.filter(created_at__lt=cutoff).delete()
    logger.info(f'Purged {deleted} AI messages older than 24 hours')


@shared_task
def generate_weekly_dashboard_snapshot():
    """
    Pre-computes dashboard metrics weekly and caches them.
    Prevents expensive queries on live dashboard views.
    """
    from django.core.cache import cache
    from apps.dashboard.analytics import compute_all_metrics
    metrics = compute_all_metrics()
    cache.set('dashboard_metrics_weekly', metrics, timeout=60*60*24*7)
    logger.info('Weekly dashboard snapshot generated and cached')
