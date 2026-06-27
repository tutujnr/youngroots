"""
YoungRoots Platform — Django Settings (v2)
Includes: WhatsApp webhook, notes/blog/events/contact apps,
          role-based admin user management.
"""
import os
from pathlib import Path
from datetime import timedelta
import environ

BASE_DIR = Path(__file__).resolve().parent.parent
env = environ.Env(DEBUG=(bool, False))
environ.Env.read_env(BASE_DIR / '.env')

SECRET_KEY = env('SECRET_KEY', default='change-me-in-production-please-use-strong-secret')
DEBUG = env('DEBUG', default=False)
ALLOWED_HOSTS = env.list('ALLOWED_HOSTS', default=['localhost', '127.0.0.1'])

DJANGO_APPS = [
    'django.contrib.admin',
    'django.contrib.auth',
    'django.contrib.contenttypes',
    'django.contrib.sessions',
    'django.contrib.messages',
    'django.contrib.staticfiles',
]

THIRD_PARTY_APPS = [
    'rest_framework',
    'rest_framework_simplejwt',
    'rest_framework_simplejwt.token_blacklist',
    'corsheaders',
    'django_filters',
    'drf_spectacular',
    'simple_history',
]

LOCAL_APPS = [
    'apps.accounts',
    'apps.locator',
    'apps.ai_assistant',
    'apps.reports',
    'apps.referrals',
    'apps.dashboard',
    # New apps
    'apps.notes',
    'apps.blog',
    'apps.events',
    'apps.contact',
]

INSTALLED_APPS = DJANGO_APPS + THIRD_PARTY_APPS + LOCAL_APPS

MIDDLEWARE = [
    'django.middleware.security.SecurityMiddleware',
    'whitenoise.middleware.WhiteNoiseMiddleware',
    'corsheaders.middleware.CorsMiddleware',
    'django.contrib.sessions.middleware.SessionMiddleware',
    'django.middleware.common.CommonMiddleware',
    'django.middleware.csrf.CsrfViewMiddleware',
    'django.contrib.auth.middleware.AuthenticationMiddleware',
    'django.contrib.messages.middleware.MessageMiddleware',
    'django.middleware.clickjacking.XFrameOptionsMiddleware',
    'simple_history.middleware.HistoryRequestMiddleware',
    'youngroots.middleware.AnonymousSessionMiddleware',
]

ROOT_URLCONF = 'youngroots.urls'
AUTH_USER_MODEL = 'accounts.User'
WSGI_APPLICATION = 'youngroots.wsgi.application'

TEMPLATES = [{
    'BACKEND': 'django.template.backends.django.DjangoTemplates',
    'DIRS': [BASE_DIR / 'templates'],
    'APP_DIRS': True,
    'OPTIONS': {'context_processors': [
        'django.template.context_processors.debug',
        'django.template.context_processors.request',
        'django.contrib.auth.context_processors.auth',
        'django.contrib.messages.context_processors.messages',
    ]},
}]

# ── Database ──────────────────────────────────────────────────────────────────
DATABASES = {
    'default': {
        'ENGINE': 'django.db.backends.postgresql',
        'NAME': env('DB_NAME', default='youngroots_db'),
        'USER': env('DB_USER', default='youngroots_user'),
        'PASSWORD': env('DB_PASSWORD', default=''),
        'HOST': env('DB_HOST', default='localhost'),
        'PORT': env('DB_PORT', default='5432'),
    }
}

# ── Cache / Redis ─────────────────────────────────────────────────────────────
CACHES = {
    'default': {
        'BACKEND': 'django_redis.cache.RedisCache',
        'LOCATION': env('REDIS_URL', default='redis://127.0.0.1:6379/1'),
        'OPTIONS': {'CLIENT_CLASS': 'django_redis.client.DefaultClient'},
    }
}

# ── REST Framework ────────────────────────────────────────────────────────────
REST_FRAMEWORK = {
    'DEFAULT_AUTHENTICATION_CLASSES': [
        'rest_framework_simplejwt.authentication.JWTAuthentication',
        'apps.accounts.authentication.AnonymousTokenAuthentication',
    ],
    'DEFAULT_PERMISSION_CLASSES': ['rest_framework.permissions.IsAuthenticated'],
    'DEFAULT_FILTER_BACKENDS': [
        'django_filters.rest_framework.DjangoFilterBackend',
        'rest_framework.filters.SearchFilter',
        'rest_framework.filters.OrderingFilter',
    ],
    'DEFAULT_PAGINATION_CLASS': 'youngroots.pagination.StandardResultsPagination',
    'PAGE_SIZE': 20,
    'DEFAULT_SCHEMA_CLASS': 'drf_spectacular.openapi.AutoSchema',
    'DEFAULT_THROTTLE_CLASSES': [
        'rest_framework.throttling.AnonRateThrottle',
        'rest_framework.throttling.UserRateThrottle',
    ],
    'DEFAULT_THROTTLE_RATES': {
        'anon': '100/hour',
        'user': '500/hour',
        'ai_chat': '30/hour',
        'report_submit': '10/hour',
        'whatsapp': '200/hour',
    },
}

# ── JWT ───────────────────────────────────────────────────────────────────────
SIMPLE_JWT = {
    'ACCESS_TOKEN_LIFETIME': timedelta(hours=2),
    'REFRESH_TOKEN_LIFETIME': timedelta(days=7),
    'ROTATE_REFRESH_TOKENS': True,
    'BLACKLIST_AFTER_ROTATION': True,
    'ALGORITHM': 'HS256',
    'AUTH_HEADER_TYPES': ('Bearer',),
}

# ── CORS ──────────────────────────────────────────────────────────────────────
CORS_ALLOWED_ORIGINS = env.list(
    'CORS_ALLOWED_ORIGINS',
    default=['http://localhost:3000', 'http://127.0.0.1:3000'],
)

from corsheaders.defaults import default_headers
CORS_ALLOW_HEADERS = list(default_headers) + [
    "x-anonymous-token",
]

CORS_ALLOW_CREDENTIALS = True

# ── Static & Media ────────────────────────────────────────────────────────────
STATIC_URL = '/static/'
STATIC_ROOT = BASE_DIR / 'staticfiles'
STATICFILES_STORAGE = 'whitenoise.storage.CompressedManifestStaticFilesStorage'
MEDIA_URL = '/media/'
MEDIA_ROOT = BASE_DIR / 'media'

# ── i18n ──────────────────────────────────────────────────────────────────────
LANGUAGE_CODE = 'en-us'
TIME_ZONE = 'Africa/Nairobi'
USE_I18N = True
USE_TZ = True
DEFAULT_AUTO_FIELD = 'django.db.models.BigAutoField'

# ── Celery ────────────────────────────────────────────────────────────────────
CELERY_BROKER_URL = env('REDIS_URL', default='redis://127.0.0.1:6379/0')
CELERY_RESULT_BACKEND = env('REDIS_URL', default='redis://127.0.0.1:6379/0')
CELERY_ACCEPT_CONTENT = ['json']
CELERY_TASK_SERIALIZER = 'json'
CELERY_TIMEZONE = 'Africa/Nairobi'

# ── Anthropic AI ──────────────────────────────────────────────────────────────
ANTHROPIC_API_KEY = env('ANTHROPIC_API_KEY', default='')
AI_MODEL = 'claude-sonnet-4-20250514'
AI_MAX_TOKENS = 1024

# ── WhatsApp (Twilio / Meta Cloud API) ───────────────────────────────────────
WHATSAPP_PROVIDER = env('WHATSAPP_PROVIDER', default='twilio')  # 'twilio' or 'meta'
# Twilio
TWILIO_ACCOUNT_SID = env('TWILIO_ACCOUNT_SID', default='')
TWILIO_AUTH_TOKEN  = env('TWILIO_AUTH_TOKEN', default='')
TWILIO_WHATSAPP_NUMBER = env('TWILIO_WHATSAPP_NUMBER', default='whatsapp:+14155238886')
# Meta Cloud API
META_WHATSAPP_TOKEN   = env('META_WHATSAPP_TOKEN', default='')
META_PHONE_NUMBER_ID  = env('META_PHONE_NUMBER_ID', default='')
META_VERIFY_TOKEN     = env('META_VERIFY_TOKEN', default='youngroots-verify-token')
WHATSAPP_BOT_NUMBER   = env('WHATSAPP_BOT_NUMBER', default='+254700000927')

# ── Encryption ────────────────────────────────────────────────────────────────
FIELD_ENCRYPTION_KEY = env('FIELD_ENCRYPTION_KEY', default='')

# ── Security ──────────────────────────────────────────────────────────────────
SECURE_BROWSER_XSS_FILTER = False
SECURE_CONTENT_TYPE_NOSNIFF = True
X_FRAME_OPTIONS = 'DENY'
SECURE_HSTS_SECONDS = 31536000 if not DEBUG else 0
SECURE_SSL_REDIRECT = not DEBUG
SESSION_COOKIE_SECURE = not DEBUG
CSRF_COOKIE_SECURE = not DEBUG
SESSION_COOKIE_AGE = 3600
SESSION_EXPIRE_AT_BROWSER_CLOSE = True

# ── Logging ───────────────────────────────────────────────────────────────────
LOGGING = {
    'version': 1,
    'disable_existing_loggers': False,
    'formatters': {'verbose': {'format': '{levelname} {asctime} {module} {message}', 'style': '{'}},
    'handlers': {
        'file': {'level': 'WARNING', 'class': 'logging.FileHandler',
                 'filename': BASE_DIR / 'logs/youngroots.log', 'formatter': 'verbose'},
        'console': {'class': 'logging.StreamHandler'},
    },
    'loggers': {
        'django': {'handlers': ['console', 'file'], 'level': 'WARNING'},
        'apps':   {'handlers': ['console', 'file'], 'level': 'INFO', 'propagate': False},
    },
}

# ── API Docs ──────────────────────────────────────────────────────────────────
SPECTACULAR_SETTINGS = {
    'TITLE': 'YoungRoots AYSRHR API v2',
    'DESCRIPTION': 'Youth-Friendly Sexual & Reproductive Health Platform API — includes WhatsApp chatbot, blog, events, and notes.',
    'VERSION': '2.0.0',
}

AI_SYSTEM_PROMPT = """You are Yara, a warm, non-judgmental AI sexual and reproductive health (SRHR) guide
for young people aged 10-24 in Africa. You provide accurate, youth-friendly information about contraception,
STIs, HIV/AIDS, relationships, gender-based violence, mental health, and reproductive rights.
Be empathetic, supportive, and concise (3-5 sentences). If someone is in crisis, prioritise emergency services.
Never request or store personal identifying information. Respond in the same language the user writes in.
Supported languages: English, Swahili, French, Portuguese."""
