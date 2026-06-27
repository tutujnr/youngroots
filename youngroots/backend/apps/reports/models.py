import uuid, secrets
from django.db import models
from django.utils import timezone
from rest_framework import serializers, generics, status, permissions
from rest_framework.views import APIView
from rest_framework.response import Response
from apps.accounts.permissions import IsAdvocateOrAdmin


class ReportType(models.TextChoices):
    ACCESS_DENIED    = 'access_denied',    'Denied Access to Services'
    GBV              = 'gbv',              'Gender-Based Violence'
    DISCRIMINATION   = 'discrimination',   'Discrimination by Provider'
    RIGHTS_VIOLATION = 'rights_violation', 'Rights Violation / Forced Procedure'
    CONFIDENTIALITY  = 'confidentiality',  'Confidentiality Breach'
    OTHER            = 'other',            'Other Concern'


class UrgencyLevel(models.TextChoices):
    LOW      = 'low',      'Not Urgent'
    MODERATE = 'moderate', 'Moderate'
    URGENT   = 'urgent',   'Urgent'
    CRISIS   = 'crisis',   'Crisis / Immediate Danger'


class ReportStatus(models.TextChoices):
    NEW      = 'new',      'New'
    ASSIGNED = 'assigned', 'Advocate Assigned'
    ACTIVE   = 'active',   'Under Review'
    REFERRED = 'referred', 'Referred to Service'
    RESOLVED = 'resolved', 'Resolved'
    CLOSED   = 'closed',   'Closed'


def generate_case_id():
    return f'YR-{timezone.now().year}-{secrets.randbelow(9000) + 1000}'


class Report(models.Model):
    id             = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    case_id        = models.CharField(max_length=20, unique=True, default=generate_case_id, db_index=True)
    report_type    = models.CharField(max_length=30, choices=ReportType.choices)
    description    = models.TextField()
    location_area  = models.CharField(max_length=200, blank=True)
    urgency        = models.CharField(max_length=20, choices=UrgencyLevel.choices, default=UrgencyLevel.LOW)
    support_needed = models.CharField(max_length=100, blank=True)
    status         = models.CharField(max_length=20, choices=ReportStatus.choices, default=ReportStatus.NEW)
    assigned_to    = models.ForeignKey('accounts.User', on_delete=models.SET_NULL, null=True, blank=True, related_name='assigned_reports')
    submitted_at   = models.DateTimeField(auto_now_add=True)
    updated_at     = models.DateTimeField(auto_now=True)
    resolved_at    = models.DateTimeField(null=True, blank=True)

    class Meta:
        ordering = ['-submitted_at']

    def __str__(self):
        return self.case_id

    def resolve(self):
        self.status = ReportStatus.RESOLVED
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
    id         = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    report     = models.ForeignKey(Report, on_delete=models.CASCADE, related_name='notes')
    author     = models.ForeignKey('accounts.User', on_delete=models.SET_NULL, null=True)
    content    = models.TextField()
    created_at = models.DateTimeField(auto_now_add=True)


# ── Serializers ───────────────────────────────────────────────────────────────

class ReportSubmitSerializer(serializers.ModelSerializer):
    class Meta:
        model = Report
        fields = ['report_type', 'description', 'location_area', 'urgency', 'support_needed']

    def validate_description(self, value):
        if len(value.strip()) < 30:
            raise serializers.ValidationError('Please provide more detail (at least 30 characters).')
        return value


class ReportPublicSerializer(serializers.ModelSerializer):
    status_display = serializers.CharField(source='get_status_display', read_only=True)
    days_open = serializers.IntegerField(read_only=True)

    class Meta:
        model = Report
        fields = ['case_id', 'report_type', 'status', 'status_display', 'urgency',
                  'location_area', 'support_needed', 'submitted_at', 'days_open']


class ReportNoteSerializer(serializers.ModelSerializer):
    class Meta:
        model = ReportNote
        fields = ['id', 'content', 'created_at']


class AdminReportSerializer(serializers.ModelSerializer):
    notes = ReportNoteSerializer(many=True, read_only=True)
    days_open = serializers.IntegerField(read_only=True)

    class Meta:
        model = Report
        fields = '__all__'


# ── Views ─────────────────────────────────────────────────────────────────────

class SubmitReportView(APIView):
    permission_classes = [permissions.AllowAny]

    def post(self, request):
        serializer = ReportSubmitSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        report = serializer.save()
        if report.is_crisis:
            from .tasks import notify_crisis_report
            notify_crisis_report.delay(str(report.id))
        from apps.referrals.models import create_default_steps
        create_default_steps(report)
        return Response({'message': 'Report received securely.', 'case_id': report.case_id,
                         'status': report.status}, status=status.HTTP_201_CREATED)


class CaseLookupView(APIView):
    permission_classes = [permissions.AllowAny]

    def get(self, request, case_id):
        try:
            report = Report.objects.get(case_id=case_id.upper())
            return Response(ReportPublicSerializer(report).data)
        except Report.DoesNotExist:
            return Response({'error': 'Case not found.'}, status=404)


class AdminReportListView(generics.ListAPIView):
    serializer_class = AdminReportSerializer
    permission_classes = [IsAdvocateOrAdmin]
    filterset_fields = ['status', 'urgency', 'report_type']

    def get_queryset(self):
        qs = Report.objects.all()
        if self.request.user.role == 'advocate':
            qs = qs.filter(assigned_to=self.request.user)
        return qs


class AdminReportDetailView(generics.RetrieveUpdateAPIView):
    serializer_class = AdminReportSerializer
    permission_classes = [IsAdvocateOrAdmin]
    queryset = Report.objects.all()


class AddReportNoteView(generics.CreateAPIView):
    serializer_class = ReportNoteSerializer
    permission_classes = [IsAdvocateOrAdmin]

    def perform_create(self, serializer):
        report = Report.objects.get(pk=self.kwargs['report_id'])
        serializer.save(report=report, author=self.request.user)


from django.urls import path
urlpatterns = [
    path('submit/', SubmitReportView.as_view(), name='submit_report'),
    path('lookup/<str:case_id>/', CaseLookupView.as_view(), name='case_lookup'),
    path('admin/', AdminReportListView.as_view(), name='admin_reports'),
    path('admin/<uuid:pk>/', AdminReportDetailView.as_view(), name='admin_report_detail'),
    path('admin/<uuid:report_id>/notes/', AddReportNoteView.as_view(), name='add_report_note'),
]
