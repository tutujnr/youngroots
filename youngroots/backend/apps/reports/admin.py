from django.contrib import admin
from simple_history.admin import SimpleHistoryAdmin
from .models import Report, ReportNote


class ReportNoteInline(admin.TabularInline):
    model  = ReportNote
    extra  = 0
    fields = ('content', 'author', 'is_internal', 'created_at')
    readonly_fields = ('created_at',)


@admin.register(Report)
class ReportAdmin(SimpleHistoryAdmin):
    list_display   = ('case_id', 'report_type', 'urgency', 'status', 'location_area', 'assigned_to', 'submitted_at')
    list_filter    = ('status', 'urgency', 'report_type')
    search_fields  = ('case_id', 'location_area')
    readonly_fields = ('case_id', 'submitted_at', 'updated_at')
    ordering       = ('-submitted_at',)
    inlines        = [ReportNoteInline]
    actions        = ['mark_resolved', 'assign_to_me']

    def mark_resolved(self, request, queryset):
        for report in queryset:
            report.resolve()
    mark_resolved.short_description = 'Mark selected reports as Resolved'


@admin.register(ReportNote)
class ReportNoteAdmin(admin.ModelAdmin):
    list_display  = ('report', 'author', 'is_internal', 'created_at')
    list_filter   = ('is_internal',)
    readonly_fields = ('created_at',)
