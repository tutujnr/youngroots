import uuid
from django.db import models
from django.utils import timezone
from rest_framework import serializers, generics, permissions
from rest_framework.views import APIView
from rest_framework.response import Response
from apps.accounts.permissions import IsAdvocateOrAdmin


class ReferralStatus(models.TextChoices):
    PENDING   = 'pending',   'Pending'
    SENT      = 'sent',      'Referral Sent'
    ACCEPTED  = 'accepted',  'Accepted'
    COMPLETED = 'completed', 'Completed'


class Referral(models.Model):
    id           = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    report       = models.ForeignKey('reports.Report', on_delete=models.CASCADE, related_name='referrals')
    service      = models.ForeignKey('locator.Service', on_delete=models.SET_NULL, null=True, related_name='referrals')
    referred_by  = models.ForeignKey('accounts.User', on_delete=models.SET_NULL, null=True, related_name='made_referrals')
    status       = models.CharField(max_length=20, choices=ReferralStatus.choices, default=ReferralStatus.PENDING)
    notes        = models.TextField(blank=True)
    created_at   = models.DateTimeField(auto_now_add=True)
    updated_at   = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-created_at']


class CaseStep(models.Model):
    class StepStatus(models.TextChoices):
        PENDING = 'pending', 'Pending'
        CURRENT = 'current', 'In Progress'
        DONE    = 'done',    'Completed'

    id           = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    report       = models.ForeignKey('reports.Report', on_delete=models.CASCADE, related_name='steps')
    title        = models.CharField(max_length=100)
    description  = models.TextField(blank=True)
    order        = models.PositiveSmallIntegerField(default=0)
    status       = models.CharField(max_length=20, choices=StepStatus.choices, default=StepStatus.PENDING)
    completed_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        ordering = ['order']

    def complete(self):
        self.status = self.StepStatus.DONE
        self.completed_at = timezone.now()
        self.save()


DEFAULT_STEPS = [
    (1, 'Report received', 'Your report has been safely received and encrypted.'),
    (2, 'Advocate assigned', 'A trained advocate has been assigned to your case.'),
    (3, 'Case assessment', 'Your situation is being reviewed.'),
    (4, 'Referral to service', 'You are being connected to support.'),
    (5, 'Follow-up support', 'Your advocate checks in on your progress.'),
    (6, 'Case resolved', 'Your case has been resolved.'),
]


def create_default_steps(report):
    steps = [
        CaseStep(report=report, order=o, title=t, description=d,
                 status='done' if o == 1 else 'current' if o == 2 else 'pending')
        for o, t, d in DEFAULT_STEPS
    ]
    CaseStep.objects.bulk_create(steps)


# ── Serializers ───────────────────────────────────────────────────────────────

class CaseStepSerializer(serializers.ModelSerializer):
    class Meta:
        model = CaseStep
        fields = ['id', 'title', 'description', 'order', 'status', 'completed_at']


class ReferralSerializer(serializers.ModelSerializer):
    service_name = serializers.CharField(source='service.name', read_only=True, default=None)

    class Meta:
        model = Referral
        fields = ['id', 'service', 'service_name', 'status', 'notes', 'created_at']


# ── Views ─────────────────────────────────────────────────────────────────────

class CaseDetailView(APIView):
    permission_classes = [permissions.AllowAny]

    def get(self, request, case_id):
        from apps.reports.models import Report
        try:
            report = Report.objects.prefetch_related('steps', 'referrals__service').get(case_id=case_id.upper())
            steps = list(report.steps.all())
            referrals = list(report.referrals.all())
            done = sum(1 for s in steps if s.status == 'done')
            progress = round((done / len(steps)) * 100) if steps else 0
            return Response({
                'case_id': report.case_id, 'status': report.status, 'urgency': report.urgency,
                'report_type': report.get_report_type_display(), 'submitted_at': report.submitted_at,
                'days_open': report.days_open, 'steps': CaseStepSerializer(steps, many=True).data,
                'referrals': ReferralSerializer(referrals, many=True).data, 'progress_pct': progress,
            })
        except Exception:
            return Response({'error': 'Case not found.'}, status=404)


class CreateReferralView(generics.CreateAPIView):
    serializer_class = ReferralSerializer
    permission_classes = [IsAdvocateOrAdmin]

    def perform_create(self, serializer):
        from apps.reports.models import Report
        report = Report.objects.get(case_id=self.kwargs['case_id'].upper())
        serializer.save(report=report, referred_by=self.request.user)


class UpdateCaseStepView(generics.UpdateAPIView):
    serializer_class = CaseStepSerializer
    permission_classes = [IsAdvocateOrAdmin]
    queryset = CaseStep.objects.all()

    def perform_update(self, serializer):
        step = serializer.save()
        if step.status == 'done':
            step.complete()


from django.urls import path
urlpatterns = [
    path('case/<str:case_id>/', CaseDetailView.as_view(), name='case_detail'),
    path('case/<str:case_id>/referral/', CreateReferralView.as_view(), name='create_referral'),
    path('steps/<uuid:pk>/', UpdateCaseStepView.as_view(), name='update_step'),
]
