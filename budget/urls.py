# Imports from Django.  # NOQA
from django.conf.urls import url, include  # NOQA


# Imports from budget.
from budget.views import (  # NOQA
    HeadlineViewSet,
    HeadlineVoteViewSet,
    ItemViewSet,
    PackageViewSet,
    PrintPublicationViewSet
)


# Imports from other dependencies.
from rest_framework import routers


router = routers.DefaultRouter()
router.register(r'packages', PackageViewSet)
router.register(r'items', ItemViewSet)
router.register(r'headlines', HeadlineViewSet)
router.register(r'print-publications', PrintPublicationViewSet)
router.register(r'headline-votes', HeadlineVoteViewSet)


urlpatterns = [
    url(r'^api/', include(router.urls)),
    # Add an extra custom route here because the built-in REST RegEx won't
    # match our slugs because of the double-dots
    url(r'^api/packages/(?P<pk>[\d]+)/$', PackageViewSet.as_view({
        'get': 'retrieve',
        'put': 'update',
        'patch': 'partial_update',
        'delete': 'destroy'
    })),
    url(r'^api/packages/(?P<raw_slug>[-\w.]+)/$', PackageViewSet.as_view({
        'get': 'retrieve',
        'put': 'update',
        'patch': 'partial_update',
        'delete': 'destroy'
    })),
]
