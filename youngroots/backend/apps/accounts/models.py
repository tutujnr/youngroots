import uuid
from django.contrib.auth.models import AbstractBaseUser, BaseUserManager, PermissionsMixin
from django.db import models
from django.utils import timezone


class UserRole(models.TextChoices):
    YOUTH       = 'youth',       'Youth User'
    ADVOCATE    = 'advocate',    'Advocate'
    ADMIN       = 'admin',       'Administrator'
    SUPER_ADMIN = 'super_admin', 'Super Administrator'


class UserManager(BaseUserManager):
    def create_user(self, email=None, password=None, **extra_fields):
        extra_fields.setdefault('role', UserRole.YOUTH)
        if email:
            email = self.normalize_email(email)
        user = self.model(email=email, **extra_fields)
        if password:
            user.set_password(password)
        else:
            user.set_unusable_password()
        user.save(using=self._db)
        return user

    def create_superuser(self, email, password, **extra_fields):
        extra_fields['role'] = UserRole.SUPER_ADMIN
        extra_fields['is_staff'] = True
        extra_fields['is_superuser'] = True
        return self.create_user(email, password, **extra_fields)

    def create_anonymous_user(self):
        anon_id = uuid.uuid4().hex[:12]
        user = self.model(display_name=f'Anon-{anon_id}', role=UserRole.YOUTH, is_anonymous_user=True)
        user.set_unusable_password()
        user.save(using=self._db)
        return user


class User(AbstractBaseUser, PermissionsMixin):
    id                 = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    email              = models.EmailField(unique=True, null=True, blank=True)
    display_name       = models.CharField(max_length=100, blank=True)
    role               = models.CharField(max_length=20, choices=UserRole.choices, default=UserRole.YOUTH)
    is_anonymous_user  = models.BooleanField(default=False)
    preferred_language = models.CharField(max_length=10, default='en')
    is_active          = models.BooleanField(default=True)
    is_staff           = models.BooleanField(default=False)
    date_joined        = models.DateTimeField(default=timezone.now)
    last_login         = models.DateTimeField(null=True, blank=True)

    objects = UserManager()
    USERNAME_FIELD  = 'email'
    REQUIRED_FIELDS = []

    class Meta:
        verbose_name = 'User'
        ordering = ['-date_joined']

    def __str__(self):
        return self.email or self.display_name or f'User {str(self.id)[:8]}'

    @property
    def is_admin(self):
        return self.role in [UserRole.ADMIN, UserRole.SUPER_ADMIN]

    @property
    def is_advocate(self):
        return self.role in [UserRole.ADVOCATE, UserRole.ADMIN, UserRole.SUPER_ADMIN]

    def can_manage_users(self):
        return self.role in [UserRole.ADMIN, UserRole.SUPER_ADMIN]

    def can_assign_role(self, target_role):
        """Super admin can assign any role. Admin can assign advocate only."""
        if self.role == UserRole.SUPER_ADMIN:
            return True
        if self.role == UserRole.ADMIN:
            return target_role in [UserRole.ADVOCATE, UserRole.YOUTH]
        return False


class AnonymousToken(models.Model):
    token       = models.UUIDField(default=uuid.uuid4, unique=True, db_index=True)
    user        = models.OneToOneField(User, on_delete=models.CASCADE, related_name='anon_token')
    created_at  = models.DateTimeField(auto_now_add=True)
    expires_at  = models.DateTimeField()
    session_key = models.CharField(max_length=64, blank=True)

    @property
    def is_valid(self):
        return timezone.now() < self.expires_at

    def __str__(self):
        return f'AnonToken for {self.user}'
