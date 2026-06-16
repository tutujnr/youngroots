from django.contrib import admin
from .models import ConversationSession, AIMessage


@admin.register(ConversationSession)
class ConversationSessionAdmin(admin.ModelAdmin):
    list_display   = ('session_token', 'language', 'message_count', 'started_at', 'last_active_at')
    list_filter    = ('language',)
    readonly_fields = ('session_token', 'started_at', 'last_active_at')
    search_fields  = ('session_token',)
    # Do NOT show raw messages in admin to protect user privacy


@admin.register(AIMessage)
class AIMessageAdmin(admin.ModelAdmin):
    list_display   = ('session', 'role', 'created_at')
    list_filter    = ('role',)
    readonly_fields = ('created_at',)
    # Message content hidden from list view for privacy
    exclude        = ('content',)
