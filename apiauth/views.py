# Imports from python.  # NOQA
import urllib


# Imports from Django.
from django.conf import settings
from django.contrib.auth.decorators import login_required
from django.contrib.auth import logout
from django.contrib.auth.models import User
from django.http import HttpResponseBadRequest, HttpResponseForbidden  # NOQA
from django.shortcuts import redirect
from django.urls import reverse_lazy
from django.views.decorators.http import require_GET
from django.views.generic import RedirectView, TemplateView  # NOQA


# Imports from apiauth.
from apiauth.serializers import UserSerializer


# Imports from other dependencies.
from djangorestframework_camel_case.parser import CamelCaseJSONParser
from djangorestframework_camel_case.render import CamelCaseJSONRenderer
from rest_framework.authentication import (  # NOQA
    SessionAuthentication,
    TokenAuthentication
)
from rest_framework.permissions import IsAuthenticated
from rest_framework.renderers import BrowsableAPIRenderer
from rest_framework.response import Response
from rest_framework.status import HTTP_403_FORBIDDEN
from rest_framework.views import APIView
from rest_framework import viewsets


class CamelCasedAPIViewMixin(object):
    renderer_classes = (BrowsableAPIRenderer, CamelCaseJSONRenderer,)
    parser_classes = (CamelCaseJSONParser,)


class UserViewSet(CamelCasedAPIViewMixin, viewsets.ReadOnlyModelViewSet):
    authentication_classes = (SessionAuthentication,
                              TokenAuthentication,)
    permission_classes = (IsAuthenticated,)
    queryset = User.objects.all()
    serializer_class = UserSerializer


class AuthenticatedUserView(CamelCasedAPIViewMixin, APIView):
    def get(self, request, format=None):
        if request.user.is_authenticated:
            serialized = UserSerializer(
                request.user, context={'request': request})
            return Response(serialized.data)

        login_url = request.build_absolute_uri(settings.LOGIN_URL)
        if 'HTTP_REFERER' in request.META:
            login_redirect_url = '%s?next=%s?%s' % (
                login_url,
                reverse_lazy('external-redirect'),
                urllib.parse.urlencode({
                    'to': request.META['HTTP_REFERER']
                })
            )
        else:
            login_redirect_url = None

        return Response({
            'detail': 'Login required',
            'login_url': login_url,
            'login_redirect_url': login_redirect_url
        }, status=HTTP_403_FORBIDDEN)


class AuthErrorView(TemplateView):
    template_name = 'auth/auth-error.html'


class LogoutView(RedirectView):
    """A view that logs the user out and redirects to the homepage."""
    permanent = False
    query_string = True
    pattern_name = 'home'

    def get_redirect_url(self, *args, **kwargs):
        """Log the user out and redirect them to the target url."""
        if self.request.user.is_authenticated():
            logout(self.request)
        return super(LogoutView, self).get_redirect_url(*args, **kwargs)


@login_required
@require_GET
def external_redirect(request):
    """Redirects users to an external URL (which Django auth disallows).

    Uses the next= URL param, which Django does not allow to point to a
    URL not on the current site. This lets us send someone from an
    external app to this service for login, then forward them back to
    their original page/site on success.
    """
    if 'to' not in request.GET:
        return HttpResponseBadRequest('to parameter is required.')

    parsed_url = urllib.parse.urlparse(request.GET['to'])

    whitelist = getattr(settings, 'APIAUTH_WHITELIST', [])

    if parsed_url.netloc not in whitelist:
        return HttpResponseForbidden(
            ' '.join([
                'Add "{}" to the APIAUTH_WHITELIST',
                'to use it as a redirect.'
            ]).format(
                parsed_url.netloc
            )
        )

    return redirect(urllib.parse.urlunparse(parsed_url))
