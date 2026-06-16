"""
YoungRoots — Accounts Models
Custom User model with role-based access control.
"""
import uuid
from django.contrib.auth.models import AbstractBaseUser, BaseUserManager, PermissionsMixin
from django.db import models
from django.utils import timezone


class UserRole(models.TextChoices):
    YOUTH       = 'youth',      'Youth User'
    ADVOCATE    = 'advocate',   'Advocate'
    ADMIN       = 'admin',      'Administrator'
    SUPER_ADMIN = 'super_admin','Super Administrator'


class UserManager(BaseUserManager):
    def create_user(self, email=None, password=None, **extra_fields):
        extra_fields.setdefault('role', UserRole.YOUTH)
        if email:
            email = self.normalize_email(email)
        user = self.model(email=email, **extra_fields)
        if password:
            user.set_password(password)
        user.save(using=self._db)
        return user

    def create_superuser(self, email, password, **extra_fields):
        extra_fields['role'] = UserRole.SUPER_ADMIN
        extra_fields['is_staff'] = True
        extra_fields['is_superuser'] = True
        return self.create_user(email, password, **extra_fields)

    def create_anonymous_user(self):
        """Create a fully anonymous account with no identifying info."""
        anon_id = uuid.uuid4().hex[:12]
        user = self.model(
            display_name=f'Anon-{anon_id}',
            role=UserRole.YOUTH,
            is_anonymous_user=True,
        )
        user.set_unusable_password()
        user.save(using=self._db)
        return user


class User(AbstractBaseUser, PermissionsMixin):
    """
    Custom user model. Email is optional — anonymous users have none.
    All sensitive fields are nullable to support fully anonymous users.
    """
    id              = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    email           = models.EmailField(unique=True, null=True, blank=True)
    display_name    = models.CharField(max_length=100, blank=True)
    role            = models.CharField(max_length=20, choices=UserRole.choices, default=UserRole.YOUTH)
    is_anonymous_user = models.BooleanField(default=False)
    preferred_language = models.CharField(max_length=10, default='en')

    # Account state
    is_active       = models.BooleanField(default=True)
    is_staff        = models.BooleanField(default=False)
    date_joined     = models.DateTimeField(default=timezone.now)
    last_login      = models.DateTimeField(null=True, blank=True)

    objects = UserManager()

    USERNAME_FIELD  = 'email'
    REQUIRED_FIELDS = []

    class Meta:
        verbose_name = 'User'
        verbose_name_plural = 'Users'
        ordering = ['-date_joined']

    def __str__(self):
        return self.email or self.display_name or f'User {str(self.id)[:8]}'

    @property
    def is_admin(self):
        return self.role in [UserRole.ADMIN, UserRole.SUPER_ADMIN]

    @property
    def is_advocate(self):
        return self.role in [UserRole.ADVOCATE, UserRole.ADMIN, UserRole.SUPER_ADMIN]

    def get_permissions_list(self):
        perms = {
            UserRole.YOUTH:       ['view_own_cases', 'submit_reports', 'use_ai'],
            UserRole.ADVOCATE:    ['view_assigned_cases', 'manage_referrals', 'view_dashboard'],
            UserRole.ADMIN:       ['manage_services', 'manage_users', 'view_all_cases', 'full_dashboard'],
            UserRole.SUPER_ADMIN: ['full_access'],
        }
        return perms.get(self.role, [])


class AnonymousToken(models.Model):
    """
    Allows anonymous users to authenticate via a one-time token
    tied to a session rather than an identity.
    """
    token       = models.UUIDField(default=uuid.uuid4, unique=True, db_index=True)
    user        = models.OneToOneField(User, on_delete=models.CASCADE, related_name='anon_token')
    created_at  = models.DateTimeField(auto_now_add=True)
    expires_at  = models.DateTimeField()
    session_key = models.CharField(max_length=64, blank=True)

    def __str__(self):
        return f'AnonToken for {self.user}'

    @property
    def is_valid(self):
        return timezone.now() < self.expires_at
