from django.urls import path
from rest_framework_simplejwt.views import TokenRefreshView
from . import views

urlpatterns = [
    # Auth
    path('login/',            views.CustomTokenObtainPairView.as_view(), name='token_obtain_pair'),
    path('token/refresh/',    TokenRefreshView.as_view(),                name='token_refresh'),
    path('register/',         views.RegisterView.as_view(),              name='register'),
    path('anonymous/',        views.AnonymousSessionView.as_view(),      name='anonymous_session'),

    # Profile
    path('profile/',          views.UserProfileView.as_view(),           name='user_profile'),

    # Admin
    path('users/',            views.AdminUserListView.as_view(),         name='admin_users'),
    path('users/<uuid:pk>/',  views.AdminUserDetailView.as_view(),       name='admin_user_detail'),
]
