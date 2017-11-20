# Imports from Django.  # NOQA
from django.conf.urls import include
from django.conf.urls import url


# Imports from other dependencies.
from rest_framework import routers


# Imports from budget.
from budget.views import ConfigView
from budget.views import ContentPlacementViewSet
from budget.views import ExceptionView
from budget.views import HeadlineViewSet
from budget.views import HeadlineVoteViewSet
from budget.views import ItemViewSet
from budget.views import MainBudgetView
from budget.views import PackageViewSet
from budget.views import PrintPublicationViewSet


app_name = 'budget'


router = routers.DefaultRouter()
router.register(r'packages', PackageViewSet)
router.register(r'items', ItemViewSet)
router.register(r'headlines', HeadlineViewSet)
router.register(r'print-publications', PrintPublicationViewSet)
router.register(r'headline-votes', HeadlineVoteViewSet)
router.register(r'content-placements', ContentPlacementViewSet)


urlpatterns = [
    url(r'^api/', include(router.urls)),

    url(r'^exception/$', ExceptionView.as_view()),

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

    url(r'^config/$', ConfigView.as_view(), name='config'),

    url(r'^(?P<path>.*)$', MainBudgetView.as_view(), name='main-budget-view'),
]
