# Imports from python.  # NOQA
import os

# Imports from Django.
from django.core.wsgi import get_wsgi_application

# Imports from other dependencies.
import dotenv
from whitenoise.django import DjangoWhiteNoise


"""WSGI config for storybase project.

It exposes the WSGI callable as a module-level variable
named ``application``.

For more information on this file, see
https://docs.djangoproject.com/en/1.11/howto/deployment/wsgi/
"""


os.environ.setdefault("DJANGO_SETTINGS_MODULE", "storybase.settings")

dotenv.read_dotenv(
    os.path.join(
        os.path.dirname(os.path.dirname(__file__)),
        '.env'
    )
)

application = get_wsgi_application()
application = DjangoWhiteNoise(application)
