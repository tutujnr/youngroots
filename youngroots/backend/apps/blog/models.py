"""
YoungRoots — Blog App
"""
import uuid
from django.db import models
from django.utils.text import slugify
from rest_framework import serializers, generics, permissions
from django.urls import path


class BlogPost(models.Model):
    id           = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    title        = models.CharField(max_length=250)
    slug         = models.SlugField(max_length=260, unique=True, blank=True)
    excerpt      = models.TextField(max_length=400)
    body         = models.TextField()
    cover_emoji  = models.CharField(max_length=10, default='📰')
    author_name  = models.CharField(max_length=100, default='YoungRoots Team')
    tags         = models.JSONField(default=list)
    language     = models.CharField(max_length=10, default='en')
    is_published = models.BooleanField(default=True)
    published_at = models.DateTimeField(auto_now_add=True)
    updated_at   = models.DateTimeField(auto_now=True)
    views_count  = models.PositiveIntegerField(default=0)

    class Meta:
        ordering = ['-published_at']

    def save(self, *args, **kwargs):
        if not self.slug:
            self.slug = slugify(self.title)[:260]
        super().save(*args, **kwargs)

    def __str__(self):
        return self.title


class BlogListSerializer(serializers.ModelSerializer):
    class Meta:
        model  = BlogPost
        fields = ['id', 'title', 'slug', 'excerpt', 'cover_emoji', 'author_name',
                  'tags', 'language', 'published_at', 'views_count']


class BlogDetailSerializer(serializers.ModelSerializer):
    class Meta:
        model  = BlogPost
        fields = '__all__'


class BlogListView(generics.ListAPIView):
    serializer_class   = BlogListSerializer
    permission_classes = [permissions.AllowAny]
    search_fields      = ['title', 'excerpt', 'body']
    filterset_fields   = ['language', 'is_published']

    def get_queryset(self):
        return BlogPost.objects.filter(is_published=True)


class BlogDetailView(generics.RetrieveAPIView):
    serializer_class   = BlogDetailSerializer
    permission_classes = [permissions.AllowAny]
    queryset           = BlogPost.objects.filter(is_published=True)
    lookup_field       = 'slug'

    def retrieve(self, request, *args, **kwargs):
        from rest_framework.response import Response
        instance = self.get_object()
        instance.views_count += 1
        instance.save(update_fields=['views_count'])
        return Response(self.get_serializer(instance).data)


class BlogAdminView(generics.ListCreateAPIView):
    from apps.accounts.permissions import IsAdminUser
    serializer_class   = BlogDetailSerializer
    permission_classes = [IsAdminUser]
    queryset           = BlogPost.objects.all()


urlpatterns = [
    path('',                      BlogListView.as_view(),   name='blog_list'),
    path('<slug:slug>/',           BlogDetailView.as_view(), name='blog_detail'),
    path('admin/',                 BlogAdminView.as_view(),  name='blog_admin'),
]
