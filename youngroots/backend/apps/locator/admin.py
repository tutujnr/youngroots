from django.contrib import admin
from .models import Service, ServiceReview, Country

@admin.register(Country)
class CountryAdmin(admin.ModelAdmin):
    list_display = ('code', 'name')

@admin.register(Service)
class ServiceAdmin(admin.ModelAdmin):
    list_display = ('name', 'category', 'country', 'region', 'status', 'is_free')
    list_filter = ('category', 'status', 'is_free')
    search_fields = ('name', 'description', 'region')
    actions = ['mark_active']
    def mark_active(self, request, queryset):
        queryset.update(status='active')

@admin.register(ServiceReview)
class ServiceReviewAdmin(admin.ModelAdmin):
    list_display = ('service', 'rating', 'created_at')
