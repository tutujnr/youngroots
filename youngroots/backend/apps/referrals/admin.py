from django.contrib import admin
from .models import Referral, CaseStep
@admin.register(Referral)
class ReferralAdmin(admin.ModelAdmin):
    list_display = ('report', 'service', 'status', 'created_at')
@admin.register(CaseStep)
class CaseStepAdmin(admin.ModelAdmin):
    list_display = ('report', 'order', 'title', 'status')
