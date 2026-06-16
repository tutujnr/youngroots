from django.contrib import admin
from django.contrib.auth.admin import UserAdmin as BaseUserAdmin
from .models import User, AnonymousToken


@admin.register(User)
class UserAdmin(BaseUserAdmin):
    list_display  = ('email', 'display_name', 'role', 'is_active', 'is_anonymous_user', 'date_joined')
    list_filter   = ('role', 'is_active', 'is_anonymous_user')
    search_fields = ('email', 'display_name')
    ordering      = ('-date_joined',)

    fieldsets = (
        (None,           {'fields': ('email', 'password')}),
        ('Profile',      {'fields': ('display_name', 'preferred_language')}),
        ('Permissions',  {'fields': ('role', 'is_active', 'is_staff', 'is_superuser', 'is_anonymous_user')}),
        ('Dates',        {'fields': ('date_joined', 'last_login')}),
    )
    add_fieldsets = (
        (None, {'classes': ('wide',), 'fields': ('email', 'display_name', 'role', 'password1', 'password2')}),
    )


@admin.register(AnonymousToken)
class AnonymousTokenAdmin(admin.ModelAdmin):
    list_display = ('token', 'user', 'created_at', 'expires_at')
    readonly_fields = ('token', 'created_at')
