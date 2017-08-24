# Imports from Django.  # NOQA
from django.conf.urls import include, url  # NOQA


urlpatterns = [
    url(r'', include('apiauth.urls')),
]
