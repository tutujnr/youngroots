"""
YoungRoots — Celery Configuration
"""
import os
from celery import Celery
from celery.schedules import crontab

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'youngroots.settings')

app = Celery('youngroots')
app.config_from_object('django.conf:settings', namespace='CELERY')
app.autodiscover_tasks()

# ── Periodic tasks (Celery Beat) ──────────────────────────────────────────────
app.conf.beat_schedule = {
    # Auto-assign unassigned reports every 30 minutes
    'auto-assign-reports': {
        'task':     'apps.reports.tasks.auto_assign_reports',
        'schedule': crontab(minute='*/30'),
    },
    # Purge AI messages nightly at 2am
    'purge-ai-messages': {
        'task':     'apps.reports.tasks.purge_old_ai_messages',
        'schedule': crontab(hour=2, minute=0),
    },
    # Regenerate dashboard snapshot every Sunday at midnight
    'weekly-dashboard-snapshot': {
        'task':     'apps.reports.tasks.generate_weekly_dashboard_snapshot',
        'schedule': crontab(hour=0, minute=0, day_of_week='sunday'),
    },
}
