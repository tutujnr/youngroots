"""
YoungRoots — Service Locator Models
Stores verified youth-friendly SRHR service listings.
"""
import uuid
from django.db import models
from django.contrib.gis.db import models as gis_models
from django.utils import timezone


class ServiceCategory(models.TextChoices):
    CLINIC          = 'clinic',       'Health Clinic'
    HIV_TESTING     = 'hiv',          'HIV Testing'
    GBV_SUPPORT     = 'gbv',          'GBV Support'
    COUNSELLING     = 'counselling',  'Counselling'
    PHARMACY        = 'pharmacy',     'Pharmacy'
    LEGAL_AID       = 'legal',        'Legal Aid'
    MENTAL_HEALTH   = 'mental',       'Mental Health'
    FAMILY_PLANNING = 'family',       'Family Planning'


class ServiceStatus(models.TextChoices):
    ACTIVE   = 'active',   'Active'
    PENDING  = 'pending',  'Pending Review'
    INACTIVE = 'inactive', 'Inactive'


class Country(models.Model):
    code = models.CharField(max_length=3, unique=True)
    name = models.CharField(max_length=100)

    class Meta:
        verbose_name_plural = 'Countries'
        ordering = ['name']

    def __str__(self):
        return self.name


class Service(models.Model):
    """
    A verified youth-friendly SRHR service provider.
    """
    id              = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    name            = models.CharField(max_length=200)
    category        = models.CharField(max_length=30, choices=ServiceCategory.choices)
    description     = models.TextField()
    short_desc      = models.CharField(max_length=200, blank=True)

    # Location
    country         = models.ForeignKey(Country, on_delete=models.SET_NULL, null=True)
    region          = models.CharField(max_length=100, blank=True)
    address         = models.TextField(blank=True)
    location        = gis_models.PointField(null=True, blank=True, srid=4326)

    # Contact
    phone           = models.CharField(max_length=30, blank=True)
    email           = models.EmailField(blank=True)
    website         = models.URLField(blank=True)
    hotline         = models.CharField(max_length=30, blank=True)

    # Operating details
    operating_hours = models.JSONField(default=dict, help_text='{"mon": "8am-6pm", ...}')
    is_free         = models.BooleanField(default=False)
    is_youth_friendly = models.BooleanField(default=True)
    serves_ages     = models.CharField(max_length=50, default='10-24')
    languages       = models.JSONField(default=list)

    # Services offered
    services_offered = models.JSONField(default=list)

    # Admin
    status          = models.CharField(max_length=20, choices=ServiceStatus.choices, default=ServiceStatus.PENDING)
    verified_by     = models.ForeignKey(
        'accounts.User', on_delete=models.SET_NULL, null=True, blank=True, related_name='verified_services'
    )
    verified_at     = models.DateTimeField(null=True, blank=True)
    created_at      = models.DateTimeField(auto_now_add=True)
    updated_at      = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['name']
        indexes = [
            models.Index(fields=['category', 'status']),
            models.Index(fields=['country', 'region']),
        ]

    def __str__(self):
        return f'{self.name} ({self.get_category_display()})'

    def verify(self, admin_user):
        self.status     = ServiceStatus.ACTIVE
        self.verified_by = admin_user
        self.verified_at = timezone.now()
        self.save(update_fields=['status', 'verified_by', 'verified_at'])


class ServiceReview(models.Model):
    """Anonymous youth rating of a service."""
    id          = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    service     = models.ForeignKey(Service, on_delete=models.CASCADE, related_name='reviews')
    rating      = models.PositiveSmallIntegerField(choices=[(i, i) for i in range(1, 6)])
    comment     = models.TextField(blank=True, max_length=500)
    is_anonymous = models.BooleanField(default=True)
    created_at  = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return f'{self.service.name} — {self.rating}★'
