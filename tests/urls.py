# Imports from Django.  # NOQA
from django.conf.urls import include
from django.conf.urls import url


urlpatterns = [
    url(r'', include('budget.urls')),
]
