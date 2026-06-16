"""
YoungRoots — Custom Permissions & Authentication
"""
from rest_framework import permissions, authentication, exceptions
from django.utils import timezone
from .models import AnonymousToken, User


class AnonymousTokenAuthentication(authentication.BaseAuthentication):
    """Authenticate using anonymous session tokens."""
    def authenticate(self, request):
        token_str = request.headers.get('X-Anonymous-Token')
        if not token_str:
            return None
        try:
            token = AnonymousToken.objects.select_related('user').get(token=token_str)
        except AnonymousToken.DoesNotExist:
            raise exceptions.AuthenticationFailed('Invalid anonymous token.')
        if not token.is_valid:
            raise exceptions.AuthenticationFailed('Anonymous token has expired.')
        return (token.user, token)


class IsAdminUser(permissions.BasePermission):
    """Allow access only to admin and super_admin roles."""
    def has_permission(self, request, view):
        return (
            request.user and
            request.user.is_authenticated and
            request.user.role in ['admin', 'super_admin']
        )


class IsSuperAdmin(permissions.BasePermission):
    def has_permission(self, request, view):
        return (
            request.user and
            request.user.is_authenticated and
            request.user.role == 'super_admin'
        )


class IsAdvocateOrAdmin(permissions.BasePermission):
    def has_permission(self, request, view):
        return (
            request.user and
            request.user.is_authenticated and
            request.user.role in ['advocate', 'admin', 'super_admin']
        )


class IsOwnerOrAdmin(permissions.BasePermission):
    """Object-level: owner can access their own data, admins can access all."""
    def has_object_permission(self, request, view, obj):
        if request.user.is_admin:
            return True
        owner = getattr(obj, 'user', None) or getattr(obj, 'submitted_by', None)
        return owner == request.user
