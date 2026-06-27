from django.contrib import admin
from .models import BlogPost
@admin.register(BlogPost)
class BlogPostAdmin(admin.ModelAdmin):
    list_display = ('title', 'author_name', 'is_published', 'views_count', 'published_at')
    list_filter  = ('is_published', 'language')
    search_fields = ('title', 'body')
    prepopulated_fields = {'slug': ('title',)}
