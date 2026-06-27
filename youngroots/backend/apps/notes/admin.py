from django.contrib import admin
from .models import Note
@admin.register(Note)
class NoteAdmin(admin.ModelAdmin):
    list_display = ('title', 'category', 'language', 'is_published', 'views_count', 'created_at')
    list_filter  = ('category', 'language', 'is_published')
    search_fields = ('title', 'body')
