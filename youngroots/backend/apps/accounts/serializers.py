"""
YoungRoots — Accounts Serializers
"""
from rest_framework import serializers
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer
from django.utils import timezone
from datetime import timedelta
from .models import User, AnonymousToken, UserRole


class CustomTokenObtainPairSerializer(TokenObtainPairSerializer):
    @classmethod
    def get_token(cls, user):
        token = super().get_token(user)
        token['role'] = user.role
        token['display_name'] = user.display_name
        token['is_anonymous'] = user.is_anonymous_user
        return token


class UserRegistrationSerializer(serializers.ModelSerializer):
    password  = serializers.CharField(write_only=True, min_length=10)
    password2 = serializers.CharField(write_only=True)

    class Meta:
        model  = User
        fields = ['email', 'display_name', 'password', 'password2', 'preferred_language']

    def validate(self, data):
        if data['password'] != data['password2']:
            raise serializers.ValidationError({'password': 'Passwords do not match.'})
        return data

    def create(self, validated_data):
        validated_data.pop('password2')
        return User.objects.create_user(**validated_data)


class UserProfileSerializer(serializers.ModelSerializer):
    permissions = serializers.SerializerMethodField()

    class Meta:
        model  = User
        fields = ['id', 'email', 'display_name', 'role', 'preferred_language',
                  'is_anonymous_user', 'date_joined', 'permissions']
        read_only_fields = ['id', 'role', 'date_joined', 'is_anonymous_user']

    def get_permissions(self, obj):
        return obj.get_permissions_list()


class AnonymousSessionSerializer(serializers.Serializer):
    """Returns an anonymous token for non-registered users."""
    token      = serializers.UUIDField(read_only=True)
    expires_at = serializers.DateTimeField(read_only=True)
    user_id    = serializers.UUIDField(read_only=True)

    def create(self, validated_data):
        user  = User.objects.create_anonymous_user()
        token = AnonymousToken.objects.create(
            user=user,
            expires_at=timezone.now() + timedelta(hours=24),
            session_key=validated_data.get('session_key', ''),
        )
        return {'token': token.token, 'expires_at': token.expires_at, 'user_id': user.id}


class AdminUserSerializer(serializers.ModelSerializer):
    class Meta:
        model  = User
        fields = ['id', 'email', 'display_name', 'role', 'is_active',
                  'is_anonymous_user', 'date_joined', 'last_login']

    def validate_role(self, value):
        request = self.context.get('request')
        if request and not request.user.role == 'super_admin':
            if value in ['admin', 'super_admin']:
                raise serializers.ValidationError('Only super admins can assign admin roles.')
        return value
