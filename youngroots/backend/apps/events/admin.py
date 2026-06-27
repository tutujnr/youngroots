from django.contrib import admin
from .models import Event
@admin.register(Event)
class EventAdmin(admin.ModelAdmin):
    list_display = ('title', 'event_date', 'format', 'organiser', 'is_published')
    list_filter  = ('format', 'is_published')
