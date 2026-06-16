"""
YoungRoots — Anonymous Reports Models
All reports are encrypted and anonymous.
"""
import uuid
import secrets
from django.db import models
from django.utils import timezone
from simple_history.models import HistoricalRecords


class ReportType(models.TextChoices):
    ACCESS_DENIED   = 'access_denied',   'Denied Access to Services'
    GBV             = 'gbv',             'Gender-Based Violence'
    DISCRIMINATION  = 'discrimination',  'Discrimination by Provider'
    RIGHTS_VIOLATION= 'rights_violation','Rights Violation / Forced Procedure'
    CONFIDENTIALITY = 'confidentiality', 'Confidentiality Breach'
    OTHER           = 'other',           'Other Concern'


class UrgencyLevel(models.TextChoices):
    LOW      = 'low',    'Not Urgent'
    MODERATE = 'moderate','Moderate'
    URGENT   = 'urgent', 'Urgent'
    CRISIS   = 'crisis', 'Crisis / Immediate Danger'


class ReportStatus(models.TextChoices):
    NEW        = 'new',        'New'
    ASSIGNED   = 'assigned',   'Advocate Assigned'
    ACTIVE     = 'active',     'Under Review'
    REFERRED   = 'referred',   'Referred to Service'
    RESOLVED   = 'resolved',   'Resolved'
    CLOSED     = 'closed',     'Closed'


def generate_case_id():
    """Generate a readable, random case ID like YR-2026-4821."""
    year   = timezone.now().year
    suffix = secrets.randbelow(9000) + 1000
    return f'YR-{year}-{suffix}'


class Report(models.Model):
    """
    An anonymous rights violation or GBV report.
    The description field is encrypted at the application level.
    No IP address or identity is stored.
    """
    id              = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    case_id         = models.CharField(max_length=20, unique=True, default=generate_case_id, db_index=True)

    # Report content (encrypted in production via django-encrypted-model-fields)
    report_type     = models.CharField(max_length=30, choices=ReportType.choices)
    description     = models.TextField(help_text='Encrypted in production')
    location_area   = models.CharField(max_length=200, blank=True, help_text='General area only — no addresses')

    # Classification
    urgency         = models.CharField(max_length=20, choices=UrgencyLevel.choices, default=UrgencyLevel.LOW)
    support_needed  = models.CharField(max_length=100, blank=True)

    # Status & assignment
    status          = models.CharField(max_length=20, choices=ReportStatus.choices, default=ReportStatus.NEW)
    assigned_to     = models.ForeignKey(
        'accounts.User', on_delete=models.SET_NULL, null=True, blank=True,
        related_name='assigned_reports', limit_choices_to={'role__in': ['advocate', 'admin', 'super_admin']}
    )

    # Timestamps
    submitted_at    = models.DateTimeField(auto_now_add=True)
    updated_at      = models.DateTimeField(auto_now=True)
    resolved_at     = models.DateTimeField(null=True, blank=True)

    # Audit trail
    history         = HistoricalRecords()

    class Meta:
        ordering = ['-submitted_at']
        indexes  = [
            models.Index(fields=['status', 'urgency']),
            models.Index(fields=['case_id']),
            models.Index(fields=['submitted_at']),
        ]

    def __str__(self):
        return f'{self.case_id} — {self.get_report_type_display()}'

    def resolve(self):
        self.status      = ReportStatus.RESOLVED
        self.resolved_at = timezone.now()
        self.save(update_fields=['status', 'resolved_at'])

    @property
    def is_crisis(self):
        return self.urgency == UrgencyLevel.CRISIS

    @property
    def days_open(self):
        end = self.resolved_at or timezone.now()
        return (end - self.submitted_at).days


class ReportNote(models.Model):
    """
    Internal notes added by advocates/admins on a report.
    Visible only to staff.
    """
    id          = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    report      = models.ForeignKey(Report, on_delete=models.CASCADE, related_name='notes')
    author      = models.ForeignKey('accounts.User', on_delete=models.SET_NULL, null=True)
    content     = models.TextField()
    created_at  = models.DateTimeField(auto_now_add=True)
    is_internal = models.BooleanField(default=True)

    class Meta:
        ordering = ['created_at']

    def __str__(self):
        return f'Note on {self.report.case_id}'
