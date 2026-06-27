from rest_framework import permissions, authentication, exceptions
from django.utils import timezone
from .models import AnonymousToken, UserRole


class AnonymousTokenAuthentication(authentication.BaseAuthentication):
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
    def has_permission(self, request, view):
        return bool(request.user and request.user.is_authenticated and request.user.is_admin)


class IsSuperAdmin(permissions.BasePermission):
    def has_permission(self, request, view):
        return bool(request.user and request.user.is_authenticated and
                    request.user.role == UserRole.SUPER_ADMIN)


class IsAdvocateOrAdmin(permissions.BasePermission):
    def has_permission(self, request, view):
        return bool(request.user and request.user.is_authenticated and request.user.is_advocate)


class CanManageUsers(permissions.BasePermission):
    """Only admin and super_admin can manage users."""
    def has_permission(self, request, view):
        return bool(request.user and request.user.is_authenticated and
                    request.user.can_manage_users())


class IsOwnerOrAdmin(permissions.BasePermission):
    def has_object_permission(self, request, view, obj):
        if request.user.is_admin:
            return True
        owner = getattr(obj, 'user', None) or getattr(obj, 'submitted_by', None)
        return owner == request.user
