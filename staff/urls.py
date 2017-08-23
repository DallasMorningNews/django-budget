# Imports from Django.  # NOQA
from django.conf.urls import url
from django.views.generic import TemplateView


# Imports from staff.
from staff.views import (  # NOQA
    VerticalList,
    VerticalFetch,
    HubList,
    HubFetch,
    StaffList,
    StaffFetch,
    StaffCreate,
    StaffUpdate,
    StaffRescrape,
    Staffers
)


urlpatterns = [
    url(
        r'^$',
        TemplateView.as_view(template_name='staff/api-root.html'),
        name='api-root'
    ),
    url(
        r'^admin/staff/$',
        Staffers.as_view(),
        name='staff-staffers'
    ),
    url(
        r'^admin/create/$',
        StaffCreate.as_view(),
        name='staff-create'
    ),
    url(
        r'^admin/staffer/(?P<pk>[0-9]+)/$',
        StaffUpdate.as_view(),
        name='staff-update'
    ),
    url(
        r'^staff/$',
        StaffList.as_view(),
        name='staff-api-staff'
    ),
    url(
        r'^staff/(?P<email>.+)/$',
        StaffFetch.as_view(),
        name='staff-api-staffer'
    ),
    url(
        r'^rescrape/(?P<email>.+)/$',
        StaffRescrape.as_view(),
        name='staff-rescrape'
    ),
    url(
        r'^hub/$',
        HubList.as_view()
    ),
    url(
        r'^hub/(?P<slug>.+)/$',
        HubFetch.as_view()
    ),
    url(
        r'^vertical/$',
        VerticalList.as_view()
    ),
    url(
        r'^vertical/(?P<slug>.+)/$',
        VerticalFetch.as_view()
    ),
]
