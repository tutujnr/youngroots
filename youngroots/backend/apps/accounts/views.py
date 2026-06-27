from rest_framework import generics, status, permissions
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework_simplejwt.views import TokenObtainPairView
from rest_framework_simplejwt.tokens import RefreshToken
from django.utils import timezone
from .models import User, AnonymousToken, UserRole
from .serializers import (
    CustomTokenObtainPairSerializer, UserRegistrationSerializer,
    UserProfileSerializer, AnonymousSessionSerializer,
    AdminUserListSerializer, AdminCreateUserSerializer, AdminUpdateUserSerializer,
)
from .permissions import IsAdminUser, IsSuperAdmin, IsAdvocateOrAdmin, CanManageUsers


class CustomTokenObtainPairView(TokenObtainPairView):
    serializer_class = CustomTokenObtainPairSerializer


class RegisterView(generics.CreateAPIView):
    permission_classes = [permissions.AllowAny]
    serializer_class   = UserRegistrationSerializer

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = serializer.save()
        refresh = RefreshToken.for_user(user)
        return Response({
            'message': 'Account created successfully.',
            'access':  str(refresh.access_token),
            'refresh': str(refresh),
            'user':    UserProfileSerializer(user).data,
        }, status=status.HTTP_201_CREATED)


class AnonymousSessionView(APIView):
    permission_classes = [permissions.AllowAny]

    def post(self, request):
        session_key = getattr(request, 'anon_session_id', '')
        serializer  = AnonymousSessionSerializer()
        result      = serializer.create({'session_key': session_key})
        return Response(result, status=status.HTTP_201_CREATED)


class UserProfileView(generics.RetrieveUpdateAPIView):
    serializer_class   = UserProfileSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_object(self):
        return self.request.user


# ── Admin User Management ─────────────────────────────────────────────────────

class AdminUserListCreateView(generics.ListCreateAPIView):
    """
    GET  /api/v1/auth/users/       - List all users (admin+)
    POST /api/v1/auth/users/       - Create admin/advocate (admin+)
    """
    permission_classes = [CanManageUsers]
    filterset_fields   = ['role', 'is_active', 'is_anonymous_user']
    search_fields      = ['email', 'display_name']

    def get_queryset(self):
        qs = User.objects.all().order_by('-date_joined')
        # Advocates can see only non-admin users
        if self.request.user.role == UserRole.ADMIN:
            qs = qs.exclude(role=UserRole.SUPER_ADMIN)
        return qs

    def get_serializer_class(self):
        if self.request.method == 'POST':
            return AdminCreateUserSerializer
        return AdminUserListSerializer

    def get_serializer_context(self):
        ctx = super().get_serializer_context()
        ctx['request'] = self.request
        return ctx

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data, context={'request': request})
        serializer.is_valid(raise_exception=True)
        user = serializer.save()
        return Response({
            'message': f'User {user.display_name or user.email} created with role {user.role}.',
            'user': AdminUserListSerializer(user).data,
        }, status=status.HTTP_201_CREATED)


class AdminUserDetailView(generics.RetrieveUpdateDestroyAPIView):
    """
    GET    /api/v1/auth/users/<id>/  - Get user detail
    PATCH  /api/v1/auth/users/<id>/  - Update role / active status
    DELETE /api/v1/auth/users/<id>/  - Deactivate user (super admin only)
    """
    permission_classes = [CanManageUsers]

    def get_queryset(self):
        if self.request.user.role == UserRole.SUPER_ADMIN:
            return User.objects.all()
        return User.objects.exclude(role__in=[UserRole.ADMIN, UserRole.SUPER_ADMIN])

    def get_serializer_class(self):
        if self.request.method in ['PUT', 'PATCH']:
            return AdminUpdateUserSerializer
        return AdminUserListSerializer

    def get_serializer_context(self):
        ctx = super().get_serializer_context()
        ctx['request'] = self.request
        return ctx

    def destroy(self, request, *args, **kwargs):
        """Soft-delete: deactivate instead of hard delete."""
        if request.user.role != UserRole.SUPER_ADMIN:
            return Response({'error': 'Only Super Admins can deactivate users.'},
                            status=status.HTTP_403_FORBIDDEN)
        user = self.get_object()
        user.is_active = False
        user.save(update_fields=['is_active'])
        return Response({'message': f'User {user.email} deactivated.'}, status=status.HTTP_200_OK)


class AdvocateDashboardView(APIView):
    """Advocate-specific dashboard: their assigned cases."""
    permission_classes = [IsAdvocateOrAdmin]

    def get(self, request):
        from apps.reports.models import Report
        from apps.referrals.models import Referral
        assigned = Report.objects.filter(assigned_to=request.user)
        referrals = Referral.objects.filter(referred_by=request.user)
        return Response({
            'advocate': {
                'name':             request.user.display_name or request.user.email,
                'role':             request.user.role,
            },
            'stats': {
                'assigned_cases':   assigned.count(),
                'open_cases':       assigned.filter(status__in=['new', 'assigned', 'active']).count(),
                'resolved_cases':   assigned.filter(status='resolved').count(),
                'referrals_made':   referrals.count(),
            },
            'recent_cases': list(
                assigned.order_by('-submitted_at')[:5].values(
                    'case_id', 'report_type', 'status', 'urgency', 'submitted_at'
                )
            ),
        })
