from django.contrib import admin
from simple_history.admin import SimpleHistoryAdmin
from .models import Referral, CaseStep


@admin.register(Referral)
class ReferralAdmin(SimpleHistoryAdmin):
    list_display  = ('report', 'service', 'status', 'referred_by', 'follow_up_date', 'created_at')
    list_filter   = ('status',)
    search_fields = ('report__case_id', 'service__name')
    readonly_fields = ('created_at', 'updated_at')


@admin.register(CaseStep)
class CaseStepAdmin(admin.ModelAdmin):
    list_display  = ('report', 'order', 'title', 'status', 'completed_at')
    list_filter   = ('status',)
    ordering      = ('report', 'order')
