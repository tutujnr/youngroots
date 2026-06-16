"""
YoungRoots — Service Locator Serializers & Views
"""
# ── serializers.py ────────────────────────────────────────────────────────────
from rest_framework import serializers
from .models import Service, ServiceReview, Country


class ServiceReviewSerializer(serializers.ModelSerializer):
    class Meta:
        model  = ServiceReview
        fields = ['id', 'rating', 'comment', 'created_at']
        read_only_fields = ['id', 'created_at']


class ServiceListSerializer(serializers.ModelSerializer):
    category_display = serializers.CharField(source='get_category_display', read_only=True)
    avg_rating       = serializers.FloatField(read_only=True, default=None)
    distance_km      = serializers.FloatField(read_only=True, default=None)

    class Meta:
        model  = Service
        fields = [
            'id', 'name', 'category', 'category_display', 'short_desc',
            'region', 'address', 'phone', 'hotline', 'is_free',
            'is_youth_friendly', 'serves_ages', 'operating_hours',
            'languages', 'avg_rating', 'distance_km',
        ]


class ServiceDetailSerializer(serializers.ModelSerializer):
    reviews          = ServiceReviewSerializer(many=True, read_only=True)
    category_display = serializers.CharField(source='get_category_display', read_only=True)
    avg_rating       = serializers.SerializerMethodField()

    class Meta:
        model  = Service
        fields = [
            'id', 'name', 'category', 'category_display', 'description',
            'country', 'region', 'address', 'phone', 'email', 'website', 'hotline',
            'operating_hours', 'is_free', 'is_youth_friendly', 'serves_ages',
            'languages', 'services_offered', 'status', 'avg_rating', 'reviews',
            'created_at', 'updated_at',
        ]

    def get_avg_rating(self, obj):
        reviews = obj.reviews.all()
        if not reviews.exists():
            return None
        return round(sum(r.rating for r in reviews) / reviews.count(), 1)


class ServiceAdminSerializer(ServiceDetailSerializer):
    """Extended serializer for admin management."""
    class Meta(ServiceDetailSerializer.Meta):
        fields = ServiceDetailSerializer.Meta.fields + ['verified_by', 'verified_at']


# ── views.py ──────────────────────────────────────────────────────────────────
from rest_framework import generics, status, permissions, filters
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.viewsets import ModelViewSet
from django_filters.rest_framework import DjangoFilterBackend
from django.contrib.gis.geos import Point
from django.contrib.gis.db.models.functions import Distance
from django.db.models import Avg
from apps.accounts.permissions import IsAdminUser, IsAdvocateOrAdmin


class ServiceViewSet(ModelViewSet):
    """
    CRUD for SRHR service listings.
    Public read, admin write.
    """
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['category', 'country', 'is_free', 'is_youth_friendly', 'status']
    search_fields    = ['name', 'description', 'region', 'address']
    ordering_fields  = ['name', 'created_at']

    def get_queryset(self):
        qs = Service.objects.annotate(avg_rating=Avg('reviews__rating'))

        # Filter to active only for non-admins
        if not (self.request.user.is_authenticated and self.request.user.is_admin):
            qs = qs.filter(status='active')

        # Geospatial search: ?lat=X&lng=Y&radius=km
        lat = self.request.query_params.get('lat')
        lng = self.request.query_params.get('lng')
        if lat and lng:
            try:
                user_location = Point(float(lng), float(lat), srid=4326)
                radius_km     = float(self.request.query_params.get('radius', 10))
                qs = qs.filter(
                    location__distance_lte=(user_location, radius_km * 1000)
                ).annotate(distance_km=Distance('location', user_location)).order_by('distance_km')
            except (ValueError, TypeError):
                pass
        return qs

    def get_serializer_class(self):
        if self.action == 'list':
            return ServiceListSerializer
        if self.request.user.is_authenticated and self.request.user.is_admin:
            return ServiceAdminSerializer
        return ServiceDetailSerializer

    def get_permissions(self):
        if self.action in ['create', 'update', 'partial_update', 'destroy']:
            return [IsAdminUser()]
        return [permissions.AllowAny()]

    @action(detail=True, methods=['post'], permission_classes=[permissions.AllowAny])
    def review(self, request, pk=None):
        service    = self.get_object()
        serializer = ServiceReviewSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        serializer.save(service=service)
        return Response(serializer.data, status=status.HTTP_201_CREATED)

    @action(detail=True, methods=['post'], permission_classes=[IsAdminUser])
    def verify(self, request, pk=None):
        service = self.get_object()
        service.verify(request.user)
        return Response({'message': f'{service.name} verified successfully.'})
