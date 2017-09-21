# Imports from python.  # NOQA
import os
import warnings


# Imports from other dependencies.
import dj_database_url


"""
Django settings for storybase.

Generated by 'django-admin startproject' using Django 1.11.4.

For more information on this file, see
https://docs.djangoproject.com/en/1.11/topics/settings/

For the full list of settings and their values, see
https://docs.djangoproject.com/en/1.11/ref/settings/
"""


# Build paths inside the project like this: os.path.join(BASE_DIR, ...)
BASE_DIR = os.path.dirname(os.path.abspath(__file__))

DEBUG_MODE = os.environ.get('DEBUG_MODE', 'off') == 'on'

SECRET_KEY = os.environ.get('SECRET_KEY', 'secret-key')


# Quick-start development settings.
SITE_ID = 1

DEBUG = DEBUG_MODE

ROOT_URLCONF = 'storybase.urls'

WSGI_APPLICATION = 'storybase.wsgi.application'

MANAGERS = (
    ('Allan James Vestal', 'ajvestal@bayareanewsgroup.com'),
)

ADMINS = MANAGERS


# Honor the 'X-Forwarded-Proto' header for request.is_secure()
SECURE_PROXY_SSL_HEADER = ('HTTP_X_FORWARDED_PROTO', 'https')


# Allow all host headers
ALLOWED_HOSTS = ['*']


# Application definition
INSTALLED_APPS = [
    'django.contrib.admin',
    'django.contrib.auth',
    'django.contrib.contenttypes',
    'django.contrib.sessions',
    'django.contrib.messages',
    'whitenoise.runserver_nostatic',  # static file handling
    'django.contrib.staticfiles',
    'django.contrib.postgres',
    'django.contrib.humanize',

    # 'storages',
    'social_django',
    'bootstrap3',
    'corsheaders',
    'colorfield',
    'rest_framework',
    'rest_framework.authtoken',
    'rest_framework_swagger',
    'django_filters',
    'debug_toolbar',

    'apiauth',
    'staff',
    'budget',
]

MIDDLEWARE = [
    'django.middleware.security.SecurityMiddleware',
    'django.contrib.sessions.middleware.SessionMiddleware',
    'whitenoise.middleware.WhiteNoiseMiddleware',
    'django.middleware.common.CommonMiddleware',
    'django.middleware.csrf.CsrfViewMiddleware',
    'django.contrib.auth.middleware.AuthenticationMiddleware',
    'debug_toolbar.middleware.DebugToolbarMiddleware',
    'django.contrib.messages.middleware.MessageMiddleware',
    'django.middleware.clickjacking.XFrameOptionsMiddleware',
    'corsheaders.middleware.CorsMiddleware',
    'storybase.middleware.social_auth.FriendlySocialExceptionMiddleware',
]

if DEBUG_MODE:
    MIDDLEWARE = [
        'qinspect.middleware.QueryInspectMiddleware',
    ] + MIDDLEWARE


# Templates
# https://docs.djangoproject.com/en/1.11/ref/settings/#templates
TEMPLATES = [
    {
        'BACKEND': 'django.template.backends.django.DjangoTemplates',
        'DIRS': [os.path.join(BASE_DIR, 'templates')],
        'APP_DIRS': True,
        'OPTIONS': {
            'debug': DEBUG_MODE,
            'context_processors': [
                'django.contrib.auth.context_processors.auth',
                'django.template.context_processors.request',
                'django.contrib.messages.context_processors.messages',
                'social_django.context_processors.backends',
                'django.template.context_processors.media',
                'social_django.context_processors.login_redirect',
            ],
        },
    },
]


# Databases
# https://docs.djangoproject.com/en/1.11/ref/settings/#databases

DATABASES = {
    'default': dj_database_url.config(default=os.environ['DATABASE_URL']),
}


# Password validation
# https://docs.djangoproject.com/en/1.11/ref/settings/#auth-password-validators

AUTH_PASSWORD_VALIDATORS = [
    {
        'NAME': '.'.join([
            'django.contrib.auth.password_validation',
            'UserAttributeSimilarityValidator',
        ])
    },
    {
        'NAME': '.'.join([
            'django.contrib.auth.password_validation',
            'MinimumLengthValidator'
        ]),
    },
    {
        'NAME': '.'.join([
            'django.contrib.auth.password_validation',
            'CommonPasswordValidator'
        ]),
    },
    {
        'NAME': '.'.join([
            'django.contrib.auth.password_validation',
            'NumericPasswordValidator'
        ]),
    },
]


# Internationalization
# https://docs.djangoproject.com/en/1.11/topics/i18n/

LANGUAGE_CODE = 'en-us'

TIME_ZONE = 'America/Los_Angeles'

USE_I18N = True

USE_L10N = True

USE_TZ = True


# Media files & AWS (Amazon connection via django-storages)
# https://docs.djangoproject.com/en/1.11/topics/files/
# https://django-storages.readthedocs.io/en/latest/backends/amazon-S3.html
MEDIA_ROOT = os.path.join(BASE_DIR, 'media')

MEDIA_DIRECTORY = '/media/'

try:
    AWS_ACCESS_KEY_ID = os.environ['AWS_ACCESS_KEY_ID']

    AWS_SECRET_ACCESS_KEY = os.environ['AWS_SECRET_ACCESS_KEY']

    AWS_STORAGE_BUCKET_NAME = os.environ['AWS_STORAGE_BUCKET_NAME']

    AWS_S3_CALLING_FORMAT = 'boto.s3.connection.OrdinaryCallingFormat'

    AWS_S3_FILE_OVERWRITE = False

    AWS_S3_SECURE_URLS = False

    AWS_QUERYSTRING_AUTH = False

    AWS_S3_CALLING_FORMAT = 'boto.s3.connection.OrdinaryCallingFormat'

    DEFAULT_FILE_STORAGE = 'storybase.s3utils.MediaRootS3BotoStorage'

    MEDIA_URL = 'https://%s.s3.amazonaws.com%s' % (
        AWS_STORAGE_BUCKET_NAME,
        MEDIA_DIRECTORY,
    )
except KeyError:
    DEFAULT_FILE_STORAGE = 'django.core.files.storage.FileSystemStorage'

    MEDIA_URL = MEDIA_DIRECTORY


# Static files (CSS, JavaScript, Images), served via WhiteNoise
# https://docs.djangoproject.com/en/1.11/howto/static-files/
# http://whitenoise.evans.io/en/stable/django.html
STATIC_ROOT = os.path.join(BASE_DIR, 'staticfiles')

STATIC_URL = '/static/'

STATICFILES_DIRS = (
    os.path.join(BASE_DIR, 'static'),
)

STATICFILES_FINDERS = (
    'django.contrib.staticfiles.finders.FileSystemFinder',
    'django.contrib.staticfiles.finders.AppDirectoriesFinder'
)

STATICFILES_STORAGE = 'whitenoise.storage.CompressedManifestStaticFilesStorage'


def add_cloudfront_headers(headers, path, url):
    if not DEBUG:
        headers['Cache-Control'] = 'public, s-maxage=31536000, max-age=86400'


WHITENOISE_ADD_HEADERS_FUNCTION = add_cloudfront_headers


# CORS headers
#
CORS_ORIGIN_ALLOW_ALL = True  # For now

CORS_ALLOW_CREDENTIALS = True  # To allow API session auth on AJAX requests


# Django REST framework
# https://django-rest-framework.readthedocs.io/en/latest/#installation
REST_FRAMEWORK = {
    'DEFAULT_PERMISSION_CLASSES': ('rest_framework.permissions.AllowAny',),
    'DEFAULT_FILTER_BACKENDS': ('rest_framework.filters.DjangoFilterBackend',),
    'PAGE_SIZE': 100
}


# Django REST Swagger (Automatic API docs)
# https://django-rest-swagger.readthedocs.io/en/latest/settings.html
SWAGGER_SETTINGS = {
    'doc_expansion': 'list',
    'is_authenticated': True
}


# Django Debug Toolbar
# https://django-debug-toolbar.readthedocs.io/en/1.4/installation.html
if DEBUG_MODE:
    DEBUG_TOOLBAR_PATCH_SETTINGS = False

    DEBUG_TOOLBAR_CONFIG = {
        'SHOW_TOOLBAR_CALLBACK': lambda r: r.user.is_superuser
    }


# Django Query Inspector
# https://github.com/dobarkod/django-queryinspect#quickstart
QUERY_INSPECT_ENABLED = DEBUG_MODE

QUERY_INSPECT_LOG_QUERIES = True


# Email
# https://docs.djangoproject.com/en/1.9/topics/email/
try:
    MAILGUN_ACCESS_KEY = os.environ['MAILGUN_API_KEY']

    MAILGUN_SERVER_NAME = os.environ['MAILGUN_DOMAIN']

    EMAIL_BACKEND = 'django_mailgun.MailgunBackend'
except KeyError:
    EMAIL_BACKEND = 'django.core.mail.backends.console.EmailBackend'


# Slack integration
# https://github.com/os/slacker
SLACK_TOKEN = os.environ.get('SLACK_TOKEN')

SLACK_USERNAME = ""

SLACK_ICON_URL = ""


# Python Social Auth - Django
# https://python-social-auth.readthedocs.io/en/latest/
# configuration/settings.html
try:
    SOCIAL_AUTH_GOOGLE_OAUTH2_SECRET = os.environ[
        'GOOGLE_OAUTH2_CLIENT_SECRET'
    ]
    SOCIAL_AUTH_GOOGLE_OAUTH2_KEY = os.environ['GOOGLE_OAUTH2_CLIENT_ID']

    LOGIN_URL = '/login/google-oauth2/'

    SOCIAL_AUTH_LOGIN_ERROR_URL = '/auth/error/'

    SOCIAL_AUTH_LOGIN_REDIRECT_URL = '/auth/api/users/me/'

    AUTHENTICATION_BACKENDS = (
        'social_core.backends.google.GoogleOAuth2',
        'django.contrib.auth.backends.ModelBackend',
    )

    SOCIAL_AUTH_GOOGLE_OAUTH2_WHITELISTED_DOMAINS = [
        'bayareanewsgroup.com',
        'scng.com',
    ]

    SOCIAL_AUTH_GOOGLE_OAUTH2_SCOPE = [
        'https://www.googleapis.com/auth/drive',
        'https://www.googleapis.com/auth/userinfo.profile'
    ]

    SOCIAL_AUTH_USERNAME_IS_FULL_EMAIL = True

    # Allow non-SSL Oauth redirect URLs for cases where SSL isn't easily
    # available (like testing on localhost)
    SOCIAL_AUTH_REDIRECT_IS_HTTPS = not DEBUG_MODE

except KeyError:
    warnings.warn(
        'Google OAuth credentials not supplied. Using built-in Django auth.'
    )

    LOGIN_URL = '/admin/login/'


# API Authentication
# See `apiauth.views.external_redirect`.
APIAUTH_WHITELIST = [
    'storybase.herokuapp.com',
    'api.storyba.se',
    'www.storyba.se',
    'storyba.se',
]

if DEBUG_MODE:
    APIAUTH_WHITELIST.append('storybase.dev')
    APIAUTH_WHITELIST.append('api.storybase.dev:3000')
    APIAUTH_WHITELIST.append('api.storybase.dev:8000')
    APIAUTH_WHITELIST.append('localhost:3000')
    APIAUTH_WHITELIST.append('localhost:8000')


# Budget configuration
# See `budget.views.ConfigView` (docs TK).
BUDGET_ADMIN_EMAIL = 'avestal@bayareanewsgroup.com'

BUDGET_ALIASED_ORIGINS = [
    'https://storyba.se',
    'https://www.storyba.se',
]

BUDGET_ALIASED_API_URL = 'https://api.storyba.se'

BUDGET_API_ROOT_URL = os.environ.get('BUDGET_API_ROOT_URL', '')

BUDGET_EXTERNAL_URLS = {
    # 'addVisualsRequest': ''.join([
    #     'https://sites.google.com/',
    #     'a/dallasnews.com/dmnutilities/add-request',
    # ]),
}

# BUDGET_PRINT_SLUG_NAME = 'NewsGate slug'
BUDGET_PRINT_SLUG_NAME = 'Print publishing slug'

BUDGET_SHOW_HEADLINES = False


# def get_auth_api_url(reverse):
#     return '{}{}'.format(
#         BUDGET_API_ROOT_URL,
#         reverse('apiauth:api-root')
#     )


def get_budget_api_url(reverse):
    return '{}{}'.format(
        BUDGET_API_ROOT_URL,
        reverse('budget:api-root')
    )


def get_staff_api_url(reverse):
    return '{}{}'.format(
        BUDGET_API_ROOT_URL,
        reverse('staff:api-root')
    )


BUDGET_API_CONFIGS = {
    # 'auth': get_auth_api_url,
    'budget': get_budget_api_url,
    'staff': get_staff_api_url,
}

BUDGET_ORGANIZATION_NAME = 'Bay Area News Group'

BUDGET_ORGANIZATION_LOGO_PATH = 'budget/images/bang-logo.png'

BUDGET_TOOL_NAME = 'Storybase'

BUDGET_TOOL_LOGO_PATH = 'budget/images/storybase-wordmark.svg'


# Staff app configuration
# See `staff.views.api_views` (docs TK).
STAFF_DATA_PROVIDER = 'staff.data_providers.SlackProvider'

STAFF_EMAIL_DOMAIN = 'bayareanewsgroup.com'


# # Celery
# # http://docs.celeryproject.org/en/latest/configuration.html
# # http://docs.celeryproject.org/en/latest/django/first-steps-with-django.html
# CELERY_ACCEPT_CONTENT = ['json']
#
# CELERY_TASK_SERIALIZER = 'json'
#
# CELERY_RESULT_SERIALIZER = 'json'
#
# CELERY_RESULT_BACKEND = 'django-db'
#
# try:
#     CELERY_BROKER_URL = os.environ['REDIS_URL']
#
#     CELERY_REDIS_MAX_CONNECTIONS = 5
# except KeyError:
#     CELERY_TASK_ALWAYS_EAGER = True
#
#     CELERY_TASK_EAGER_PROPAGATES = True


BOOTSTRAP3 = {
    'field_renderers': {
        'default': 'bootstrap3.renderers.FieldRenderer',
        'inline': 'bootstrap3.renderers.InlineFieldRenderer',
        'immaterial': 'staff.field_renderers.ImmaterialFieldRenderer',
    },
}
