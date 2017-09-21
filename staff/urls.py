# Imports from Django.  # NOQA
from django.conf.urls import include, url  # NOQA


# Imports from staff.
from staff.views import admin_views, api_views  # NOQA


app_name = 'staff'


# Admin-site views.
urlpatterns = [
    url(
        r'^$',
        admin_views.Staffers.as_view(),
        name='staffer-list'
    ),
    url(
        r'^create/$',
        admin_views.StafferCreate.as_view(),
        name='staffer-create'
    ),
    # TODO(ajv): Add staffer detail view.
    url(
        r'^(?P<pk>[0-9]+)/$',
        admin_views.StafferDetail.as_view(),
        name='staffer-detail'
    ),
    url(
        r'^(?P<pk>[0-9]+)/edit/$',
        admin_views.StafferUpdate.as_view(),
        name='staffer-edit'
    ),

    # API views.
    url(r'^api/', include(
        [
            url(r'^$', api_views.RootAPIView.as_view(), name='root'),
            url(r'^staff/', include([
                url(
                    r'^$',
                    api_views.StaffList.as_view(),
                    name='staffer-list'
                ),
                url(
                    r'^rescrape/(?P<email>.+)/$',
                    api_views.StaffRescrape.as_view(),
                    name='staffer-rescrape'
                ),
                url(
                    r'^(?P<email>.+)/$',
                    api_views.StaffFetch.as_view(),
                    name='staffer-detail'
                ),
            ])),
            url(r'^hub/', include([
                url(
                    r'^$',
                    api_views.HubList.as_view()
                ),
                url(
                    r'^(?P<slug>.+)/$',
                    api_views.HubFetch.as_view()
                ),
            ])),
            url(r'^vertical/', include([
                url(
                    r'^$',
                    api_views.VerticalList.as_view()
                ),
                url(
                    r'^(?P<slug>.+)/$',
                    api_views.VerticalFetch.as_view()
                ),
            ])),
        ],
        namespace='api'
    )),
]
