"""
YoungRoots — Service Locator
"""
import uuid
from django.db import models
from django.db.models import Avg
from rest_framework import serializers, permissions, filters, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.viewsets import ModelViewSet
from django_filters.rest_framework import DjangoFilterBackend
from apps.accounts.permissions import IsAdminUser


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

    def __str__(self):
        return self.name


class Service(models.Model):
    id              = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    name            = models.CharField(max_length=200)
    category        = models.CharField(max_length=30, choices=ServiceCategory.choices)
    description     = models.TextField()
    short_desc      = models.CharField(max_length=200, blank=True)
    country         = models.ForeignKey(Country, on_delete=models.SET_NULL, null=True)
    region          = models.CharField(max_length=100, blank=True)
    address         = models.TextField(blank=True)
    latitude        = models.FloatField(null=True, blank=True)
    longitude       = models.FloatField(null=True, blank=True)
    phone           = models.CharField(max_length=30, blank=True)
    email           = models.EmailField(blank=True)
    website         = models.URLField(blank=True)
    hotline         = models.CharField(max_length=30, blank=True)
    operating_hours = models.JSONField(default=dict)
    is_free         = models.BooleanField(default=False)
    is_youth_friendly = models.BooleanField(default=True)
    serves_ages     = models.CharField(max_length=50, default='10-24')
    languages       = models.JSONField(default=list)
    services_offered = models.JSONField(default=list)
    status          = models.CharField(max_length=20, choices=ServiceStatus.choices, default=ServiceStatus.PENDING)
    verified_by     = models.ForeignKey('accounts.User', on_delete=models.SET_NULL, null=True, blank=True, related_name='verified_services')
    created_at      = models.DateTimeField(auto_now_add=True)
    updated_at      = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['name']

    def __str__(self):
        return self.name

    def verify(self, admin_user):
        self.status = ServiceStatus.ACTIVE
        self.verified_by = admin_user
        self.save(update_fields=['status', 'verified_by'])


class ServiceReview(models.Model):
    id          = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    service     = models.ForeignKey(Service, on_delete=models.CASCADE, related_name='reviews')
    rating      = models.PositiveSmallIntegerField(choices=[(i, i) for i in range(1, 6)])
    comment     = models.TextField(blank=True, max_length=500)
    created_at  = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-created_at']


# ── Serializers ───────────────────────────────────────────────────────────────

class ServiceReviewSerializer(serializers.ModelSerializer):
    class Meta:
        model = ServiceReview
        fields = ['id', 'rating', 'comment', 'created_at']


class ServiceListSerializer(serializers.ModelSerializer):
    category_display = serializers.CharField(source='get_category_display', read_only=True)
    avg_rating = serializers.FloatField(read_only=True, default=None)

    class Meta:
        model = Service
        fields = ['id', 'name', 'category', 'category_display', 'short_desc', 'region', 'address',
                  'phone', 'hotline', 'is_free', 'is_youth_friendly', 'serves_ages',
                  'operating_hours', 'languages', 'avg_rating', 'latitude', 'longitude']


class ServiceDetailSerializer(serializers.ModelSerializer):
    reviews = ServiceReviewSerializer(many=True, read_only=True)
    category_display = serializers.CharField(source='get_category_display', read_only=True)

    class Meta:
        model = Service
        fields = '__all__'


# ── Views ─────────────────────────────────────────────────────────────────────

class ServiceViewSet(ModelViewSet):
    filter_backends = [DjangoFilterBackend, filters.SearchFilter]
    filterset_fields = ['category', 'country', 'is_free', 'is_youth_friendly', 'status']
    search_fields = ['name', 'description', 'region', 'address']

    def get_queryset(self):
        qs = Service.objects.annotate(avg_rating=Avg('reviews__rating'))
        if not (self.request.user.is_authenticated and getattr(self.request.user, 'is_admin', False)):
            qs = qs.filter(status='active')
        return qs

    def get_serializer_class(self):
        if self.action == 'list':
            return ServiceListSerializer
        return ServiceDetailSerializer

    def get_permissions(self):
        if self.action in ['create', 'update', 'partial_update', 'destroy', 'verify']:
            return [IsAdminUser()]
        return [permissions.AllowAny()]

    @action(detail=True, methods=['post'], permission_classes=[permissions.AllowAny])
    def review(self, request, pk=None):
        service = self.get_object()
        serializer = ServiceReviewSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        serializer.save(service=service)
        return Response(serializer.data, status=status.HTTP_201_CREATED)

    @action(detail=True, methods=['post'], permission_classes=[IsAdminUser])
    def verify(self, request, pk=None):
        service = self.get_object()
        service.verify(request.user)
        return Response({'message': f'{service.name} verified successfully.'})


from django.urls import path, include
from rest_framework.routers import DefaultRouter
router = DefaultRouter()
router.register(r'', ServiceViewSet, basename='service')
urlpatterns = [path('', include(router.urls))]
