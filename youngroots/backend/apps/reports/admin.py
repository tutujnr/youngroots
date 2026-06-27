from django.contrib import admin
from .models import Report, ReportNote

class ReportNoteInline(admin.TabularInline):
    model = ReportNote
    extra = 0

@admin.register(Report)
class ReportAdmin(admin.ModelAdmin):
    list_display = ('case_id', 'report_type', 'urgency', 'status', 'assigned_to', 'submitted_at')
    list_filter = ('status', 'urgency', 'report_type')
    inlines = [ReportNoteInline]
