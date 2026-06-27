from django.contrib import admin
from .models import ConversationSession, AIMessage

@admin.register(ConversationSession)
class ConversationSessionAdmin(admin.ModelAdmin):
    list_display = ('session_token', 'channel', 'language', 'message_count', 'started_at')
    list_filter  = ('channel', 'language')
    readonly_fields = ('session_token', 'started_at', 'last_active_at', 'wa_phone_hash')

@admin.register(AIMessage)
class AIMessageAdmin(admin.ModelAdmin):
    list_display   = ('session', 'role', 'created_at')
    list_filter    = ('role',)
    readonly_fields = ('created_at',)
    exclude        = ('content',)
