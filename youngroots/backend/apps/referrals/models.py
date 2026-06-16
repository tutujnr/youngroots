"""
YoungRoots — Referrals & Case Support Models and Views
"""
import uuid
from django.db import models
from django.utils import timezone
from simple_history.models import HistoricalRecords
from rest_framework import serializers, generics, status, permissions
from rest_framework.response import Response
from rest_framework.views import APIView
from apps.accounts.permissions import IsAdvocateOrAdmin, IsOwnerOrAdmin


# ── MODELS ────────────────────────────────────────────────────────────────────

class ReferralStatus(models.TextChoices):
    PENDING   = 'pending',   'Pending'
    SENT      = 'sent',      'Referral Sent'
    ACCEPTED  = 'accepted',  'Accepted by Service'
    COMPLETED = 'completed', 'Completed'
    DECLINED  = 'declined',  'Declined'


class Referral(models.Model):
    """
    Connects a report to an appropriate support service.
    """
    id              = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    report          = models.ForeignKey(
        'reports.Report', on_delete=models.CASCADE, related_name='referrals'
    )
    service         = models.ForeignKey(
        'locator.Service', on_delete=models.SET_NULL, null=True, related_name='referrals'
    )
    referred_by     = models.ForeignKey(
        'accounts.User', on_delete=models.SET_NULL, null=True, related_name='made_referrals'
    )
    status          = models.CharField(max_length=20, choices=ReferralStatus.choices, default=ReferralStatus.PENDING)
    notes           = models.TextField(blank=True)
    follow_up_date  = models.DateField(null=True, blank=True)
    created_at      = models.DateTimeField(auto_now_add=True)
    updated_at      = models.DateTimeField(auto_now=True)
    history         = HistoricalRecords()

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return f'Referral: {self.report.case_id} → {self.service}'


class CaseStep(models.Model):
    """
    A guided step in the case resolution pathway.
    """
    class StepStatus(models.TextChoices):
        PENDING  = 'pending',  'Pending'
        CURRENT  = 'current',  'In Progress'
        DONE     = 'done',     'Completed'
        SKIPPED  = 'skipped',  'Skipped'

    id          = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    report      = models.ForeignKey('reports.Report', on_delete=models.CASCADE, related_name='steps')
    title       = models.CharField(max_length=100)
    description = models.TextField(blank=True)
    order       = models.PositiveSmallIntegerField(default=0)
    status      = models.CharField(max_length=20, choices=StepStatus.choices, default=StepStatus.PENDING)
    completed_at = models.DateTimeField(null=True, blank=True)
    completed_by = models.ForeignKey(
        'accounts.User', on_delete=models.SET_NULL, null=True, blank=True
    )

    class Meta:
        ordering = ['order']
        unique_together = ['report', 'order']

    def complete(self, user):
        self.status       = self.StepStatus.DONE
        self.completed_at = timezone.now()
        self.completed_by = user
        self.save()

    def __str__(self):
        return f'{self.report.case_id}: Step {self.order} — {self.title}'


DEFAULT_STEPS = [
    (1, 'Report received',       'Your report has been safely received and encrypted.'),
    (2, 'Advocate assigned',     'A trained advocate has been assigned to your case.'),
    (3, 'Case assessment',       'Your situation is being reviewed to determine the best support.'),
    (4, 'Referral to service',   'You are being connected to an appropriate support service.'),
    (5, 'Follow-up support',     'Your advocate will check in on your progress.'),
    (6, 'Case resolved',         'Your case has been resolved. We are here if you need further support.'),
]


def create_default_steps(report):
    """Create the standard case pathway steps for a new report."""
    steps = [
        CaseStep(report=report, order=order, title=title, description=desc,
                 status=CaseStep.StepStatus.DONE if order == 1 else CaseStep.StepStatus.CURRENT if order == 2 else CaseStep.StepStatus.PENDING)
        for order, title, desc in DEFAULT_STEPS
    ]
    CaseStep.objects.bulk_create(steps)


# ── SERIALIZERS ───────────────────────────────────────────────────────────────

class CaseStepSerializer(serializers.ModelSerializer):
    class Meta:
        model  = CaseStep
        fields = ['id', 'title', 'description', 'order', 'status', 'completed_at']


class ReferralSerializer(serializers.ModelSerializer):
    service_name = serializers.CharField(source='service.name', read_only=True, default=None)
    report_case  = serializers.CharField(source='report.case_id', read_only=True)

    class Meta:
        model  = Referral
        fields = ['id', 'report_case', 'service', 'service_name', 'status',
                  'notes', 'follow_up_date', 'created_at', 'updated_at']
        read_only_fields = ['id', 'created_at', 'updated_at']


class CaseDetailSerializer(serializers.Serializer):
    """Combined view of a case — report + steps + referrals."""
    case_id      = serializers.CharField()
    status       = serializers.CharField()
    urgency      = serializers.CharField()
    report_type  = serializers.CharField()
    submitted_at = serializers.DateTimeField()
    days_open    = serializers.IntegerField()
    steps        = CaseStepSerializer(many=True)
    referrals    = ReferralSerializer(many=True)
    progress_pct = serializers.FloatField()


# ── VIEWS ─────────────────────────────────────────────────────────────────────

class CaseDetailView(APIView):
    """Full case view by case ID — no auth required (uses case ID as access token)."""
    permission_classes = [permissions.AllowAny]

    def get(self, request, case_id):
        from apps.reports.models import Report
        try:
            report    = Report.objects.prefetch_related('steps', 'referrals__service').get(
                case_id=case_id.upper()
            )
            steps     = list(report.steps.all())
            referrals = list(report.referrals.all())
            done_steps = sum(1 for s in steps if s.status == 'done')
            progress   = round((done_steps / len(steps)) * 100) if steps else 0

            return Response({
                'case_id':      report.case_id,
                'status':       report.status,
                'urgency':      report.urgency,
                'report_type':  report.get_report_type_display(),
                'submitted_at': report.submitted_at,
                'days_open':    report.days_open,
                'steps':        CaseStepSerializer(steps, many=True).data,
                'referrals':    ReferralSerializer(referrals, many=True).data,
                'progress_pct': progress,
            })
        except Exception:
            return Response({'error': 'Case not found.'}, status=404)


class CreateReferralView(generics.CreateAPIView):
    """Advocates create referrals for a case."""
    serializer_class   = ReferralSerializer
    permission_classes = [IsAdvocateOrAdmin]

    def perform_create(self, serializer):
        from apps.reports.models import Report
        report = Report.objects.get(case_id=self.kwargs['case_id'].upper())
        serializer.save(report=report, referred_by=self.request.user)


class UpdateCaseStepView(generics.UpdateAPIView):
    """Advocate marks a step as complete."""
    serializer_class   = CaseStepSerializer
    permission_classes = [IsAdvocateOrAdmin]
    queryset           = CaseStep.objects.all()

    def perform_update(self, serializer):
        step = serializer.save()
        if step.status == 'done':
            step.complete(self.request.user)
