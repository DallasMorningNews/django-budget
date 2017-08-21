# Imports from Django.  # NOQA
from django.conf.urls import url, include  # NOQA


# Imports from apiauth.
from apiauth.views import (  # NOQA
    AuthenticatedUserView,
    external_redirect,
    UserViewSet
)


# Imports from other dependencies.
from rest_framework import routers


router = routers.DefaultRouter()
router.register(r'users', UserViewSet)


urlpatterns = [
    url(r'^api/users/me/', AuthenticatedUserView.as_view()),
    url(r'^api/', include(router.urls)),
    url(r'^redirect/', external_redirect, name='external-redirect')
]
