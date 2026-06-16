from django.contrib import admin
from django.contrib.gis.admin import GISModelAdmin
from .models import Service, ServiceReview, Country


@admin.register(Country)
class CountryAdmin(admin.ModelAdmin):
    list_display  = ('code', 'name')
    search_fields = ('name', 'code')


@admin.register(Service)
class ServiceAdmin(GISModelAdmin):
    list_display   = ('name', 'category', 'country', 'region', 'status', 'is_free', 'is_youth_friendly', 'created_at')
    list_filter    = ('category', 'status', 'is_free', 'is_youth_friendly', 'country')
    search_fields  = ('name', 'description', 'region', 'address')
    readonly_fields = ('created_at', 'updated_at', 'verified_at')
    ordering       = ('name',)
    actions        = ['mark_active', 'mark_inactive']

    def mark_active(self, request, queryset):
        queryset.update(status='active')
    mark_active.short_description = 'Mark selected services as Active'

    def mark_inactive(self, request, queryset):
        queryset.update(status='inactive')
    mark_inactive.short_description = 'Mark selected services as Inactive'


@admin.register(ServiceReview)
class ServiceReviewAdmin(admin.ModelAdmin):
    list_display  = ('service', 'rating', 'is_anonymous', 'created_at')
    list_filter   = ('rating', 'is_anonymous')
    readonly_fields = ('created_at',)
