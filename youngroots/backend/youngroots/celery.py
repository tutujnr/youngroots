import os
from celery import Celery
from celery.schedules import crontab
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'youngroots.settings')
app = Celery('youngroots')
app.config_from_object('django.conf:settings', namespace='CELERY')
app.autodiscover_tasks()
app.conf.beat_schedule = {
    'auto-assign-reports': {'task': 'apps.reports.tasks.auto_assign_reports', 'schedule': crontab(minute='*/30')},
    'purge-ai-messages':   {'task': 'apps.reports.tasks.purge_old_ai_messages', 'schedule': crontab(hour=2, minute=0)},
}
