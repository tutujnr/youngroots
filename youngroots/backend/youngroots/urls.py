from django.contrib import admin
from django.urls import path, include
from django.conf import settings
from django.conf.urls.static import static
from drf_spectacular.views import SpectacularAPIView, SpectacularSwaggerView

urlpatterns = [
    path('admin/', admin.site.urls),
    # Core modules
    path('api/v1/auth/',       include('apps.accounts.urls')),
    path('api/v1/services/',   include('apps.locator.urls')),
    path('api/v1/ai/',         include('apps.ai_assistant.urls')),
    path('api/v1/reports/',    include('apps.reports.urls')),
    path('api/v1/referrals/',  include('apps.referrals.urls')),
    path('api/v1/dashboard/',  include('apps.dashboard.urls')),
    # New pages
    path('api/v1/notes/',      include('apps.notes.urls')),
    path('api/v1/blog/',       include('apps.blog.urls')),
    path('api/v1/events/',     include('apps.events.urls')),
    path('api/v1/contact/',    include('apps.contact.urls')),
    # API docs
    path('api/schema/', SpectacularAPIView.as_view(), name='schema'),
    path('api/docs/',   SpectacularSwaggerView.as_view(url_name='schema'), name='swagger-ui'),
]

if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
