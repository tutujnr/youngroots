"""
YoungRoots — Accounts Views
"""
from rest_framework import generics, status, permissions
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework_simplejwt.views import TokenObtainPairView
from rest_framework_simplejwt.tokens import RefreshToken
from django_ratelimit.decorators import ratelimit
from django.utils.decorators import method_decorator
from .models import User, AnonymousToken
from .serializers import (
    CustomTokenObtainPairSerializer, UserRegistrationSerializer,
    UserProfileSerializer, AnonymousSessionSerializer, AdminUserSerializer
)
from .permissions import IsAdminUser, IsSuperAdmin


class CustomTokenObtainPairView(TokenObtainPairView):
    serializer_class = CustomTokenObtainPairSerializer


class RegisterView(generics.CreateAPIView):
    """Register a new user with email/password."""
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
    """
    Create an anonymous session — no email or personal data required.
    Returns a token that expires in 24 hours.
    """
    permission_classes = [permissions.AllowAny]

    @method_decorator(ratelimit(key='ip', rate='20/h', method='POST', block=True))
    def post(self, request):
        session_key = getattr(request, 'anon_session_id', '')
        serializer  = AnonymousSessionSerializer()
        result      = serializer.create({'session_key': session_key})
        return Response(result, status=status.HTTP_201_CREATED)


class UserProfileView(generics.RetrieveUpdateAPIView):
    """Get or update the current user's profile."""
    serializer_class   = UserProfileSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_object(self):
        return self.request.user


class AdminUserListView(generics.ListCreateAPIView):
    """Admin: list and create users."""
    serializer_class   = AdminUserSerializer
    permission_classes = [IsAdminUser]
    queryset           = User.objects.all().order_by('-date_joined')
    filterset_fields   = ['role', 'is_active', 'is_anonymous_user']
    search_fields      = ['email', 'display_name']


class AdminUserDetailView(generics.RetrieveUpdateDestroyAPIView):
    """Admin: manage individual user."""
    serializer_class   = AdminUserSerializer
    permission_classes = [IsAdminUser]
    queryset           = User.objects.all()
