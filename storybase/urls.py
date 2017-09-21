# Imports from Django.  # NOQA
from django.conf.urls import include, url  # NOQA
from django.conf import settings
from django.conf.urls.static import static
from django.contrib import admin


# Imports from other dependencies.
from rest_framework_swagger.views import get_swagger_view


"""Storybase URL Configuration.

The `urlpatterns` list routes URLs to views. For more information please see:
    https://docs.djangoproject.com/en/1.11/topics/http/urls/
Examples:
Function views
    1. Add an import:  from my_app import views
    2. Add a URL to urlpatterns:  url(r'^$', views.home, name='home')
Class-based views
    1. Add an import:  from other_app.views import Home
    2. Add a URL to urlpatterns:  url(r'^$', Home.as_view(), name='home')
Including another URLconf
    1. Import the include() function: from django.conf.urls import url, include
    2. Add a URL to urlpatterns:  url(r'^blog/', include('blog.urls'))
"""


budget_apidocs_view = get_swagger_view(title='API docs')


urlpatterns = [
    url(r'^admin/', admin.site.urls),

    # App includes.
    url(r'^staff/', include('staff.urls')),
    url(r'^budget/', include('budget.urls')),
    url(r'^docs/api/', budget_apidocs_view),
    url(r'^auth/', include('apiauth.urls')),
    # url(r'^core/', include('core.urls')),
    # social
    url('', include('social_django.urls', namespace='social')),
] + static(
    settings.MEDIA_URL,
    document_root=settings.MEDIA_ROOT
)

if settings.DEBUG:
    import debug_toolbar
    urlpatterns += [
        url(r'^__debug__/', include(debug_toolbar.urls)),
    ]
