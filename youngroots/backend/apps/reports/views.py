"""
YoungRoots — Reports Serializers & Views
"""
from rest_framework import serializers, generics, status, permissions
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.throttling import ScopedRateThrottle
from django_ratelimit.decorators import ratelimit
from django.utils.decorators import method_decorator
from django.utils import timezone
from apps.accounts.permissions import IsAdminUser, IsAdvocateOrAdmin
from .models import Report, ReportNote, ReportType, UrgencyLevel


# ── SERIALIZERS ───────────────────────────────────────────────────────────────

class ReportSubmitSerializer(serializers.ModelSerializer):
    """For anonymous report submission — no auth required."""
    class Meta:
        model  = Report
        fields = ['report_type', 'description', 'location_area', 'urgency', 'support_needed']

    def validate_description(self, value):
        if len(value.strip()) < 30:
            raise serializers.ValidationError('Please provide more detail (at least 30 characters).')
        return value


class ReportPublicSerializer(serializers.ModelSerializer):
    """What an anonymous user can see about their own report."""
    status_display  = serializers.CharField(source='get_status_display', read_only=True)
    urgency_display = serializers.CharField(source='get_urgency_display', read_only=True)
    type_display    = serializers.CharField(source='get_report_type_display', read_only=True)
    days_open       = serializers.IntegerField(read_only=True)

    class Meta:
        model  = Report
        fields = ['case_id', 'report_type', 'type_display', 'status', 'status_display',
                  'urgency', 'urgency_display', 'location_area', 'support_needed',
                  'submitted_at', 'updated_at', 'days_open']


class ReportNoteSerializer(serializers.ModelSerializer):
    author_name = serializers.CharField(source='author.display_name', read_only=True)

    class Meta:
        model  = ReportNote
        fields = ['id', 'content', 'author_name', 'created_at', 'is_internal']
        read_only_fields = ['id', 'created_at', 'author_name']


class AdminReportSerializer(serializers.ModelSerializer):
    """Full report detail for advocates/admins."""
    notes           = ReportNoteSerializer(many=True, read_only=True)
    assigned_to_name = serializers.CharField(source='assigned_to.display_name', read_only=True, default=None)
    status_display  = serializers.CharField(source='get_status_display', read_only=True)
    days_open       = serializers.IntegerField(read_only=True)

    class Meta:
        model  = Report
        fields = '__all__'


# ── VIEWS ─────────────────────────────────────────────────────────────────────

class SubmitReportView(APIView):
    """
    Submit an anonymous report. No authentication required.
    Rate-limited to prevent abuse.
    """
    permission_classes = [permissions.AllowAny]
    throttle_scope     = 'report_submit'

    @method_decorator(ratelimit(key='ip', rate='10/h', method='POST', block=True))
    def post(self, request):
        serializer = ReportSubmitSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        report = serializer.save()

        # Trigger urgent notification task if crisis
        if report.is_crisis:
            from .tasks import notify_crisis_report
            notify_crisis_report.delay(str(report.id))

        return Response({
            'message':    'Your report has been received securely.',
            'case_id':    report.case_id,
            'status':     report.status,
            'urgency':    report.urgency,
        }, status=status.HTTP_201_CREATED)


class CaseLookupView(APIView):
    """Look up a report by case ID — no auth required."""
    permission_classes = [permissions.AllowAny]

    def get(self, request, case_id):
        try:
            report     = Report.objects.get(case_id=case_id.upper())
            serializer = ReportPublicSerializer(report)
            return Response(serializer.data)
        except Report.DoesNotExist:
            return Response({'error': 'Case not found. Check your case ID and try again.'}, status=404)


class AdminReportListView(generics.ListAPIView):
    """Advocates/admins: list all reports."""
    serializer_class   = AdminReportSerializer
    permission_classes = [IsAdvocateOrAdmin]
    filterset_fields   = ['status', 'urgency', 'report_type']
    search_fields      = ['case_id', 'location_area']
    ordering_fields    = ['submitted_at', 'urgency', 'status']

    def get_queryset(self):
        qs = Report.objects.all()
        # Advocates see only their assigned reports
        if self.request.user.role == 'advocate':
            qs = qs.filter(assigned_to=self.request.user)
        return qs


class AdminReportDetailView(generics.RetrieveUpdateAPIView):
    """Advocates/admins: view and update a report."""
    serializer_class   = AdminReportSerializer
    permission_classes = [IsAdvocateOrAdmin]
    queryset           = Report.objects.all()

    def perform_update(self, serializer):
        report = serializer.save()
        if report.status == 'resolved' and not report.resolved_at:
            report.resolved_at = timezone.now()
            report.save(update_fields=['resolved_at'])


class AddReportNoteView(generics.CreateAPIView):
    """Add an internal note to a report."""
    serializer_class   = ReportNoteSerializer
    permission_classes = [IsAdvocateOrAdmin]

    def perform_create(self, serializer):
        report = Report.objects.get(pk=self.kwargs['report_id'])
        serializer.save(report=report, author=self.request.user)
