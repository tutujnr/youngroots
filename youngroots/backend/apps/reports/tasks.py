from celery import shared_task
from django.utils import timezone
from datetime import timedelta
import logging
logger = logging.getLogger('apps')

@shared_task
def notify_crisis_report(report_id):
    from .models import Report
    from apps.accounts.models import User
    try:
        report = Report.objects.get(id=report_id)
        advocates = User.objects.filter(role__in=['advocate', 'admin'], is_active=True)
        logger.warning(f'CRISIS REPORT: {report.case_id} | Notifying {advocates.count()} advocates')
    except Exception as e:
        logger.error(f'Crisis notification failed: {e}')

@shared_task
def auto_assign_reports():
    from .models import Report, ReportStatus
    from apps.accounts.models import User
    unassigned = Report.objects.filter(status=ReportStatus.NEW, assigned_to__isnull=True)
    advocates = list(User.objects.filter(role='advocate', is_active=True))
    if not advocates: return
    for i, report in enumerate(unassigned):
        advocate = advocates[i % len(advocates)]
        report.assigned_to = advocate
        report.status = ReportStatus.ASSIGNED
        report.save(update_fields=['assigned_to', 'status'])

@shared_task
def purge_old_ai_messages():
    from apps.ai_assistant.models import AIMessage
    cutoff = timezone.now() - timedelta(hours=24)
    deleted, _ = AIMessage.objects.filter(created_at__lt=cutoff).delete()
    logger.info(f'Purged {deleted} AI messages')
