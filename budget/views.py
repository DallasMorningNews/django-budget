# Imports from python.  # NOQA
from datetime import datetime
import hashlib
import json
import time


# Imports from Django.
from django.conf import settings
from django.contrib.auth.mixins import LoginRequiredMixin
from django.contrib.staticfiles.templatetags.staticfiles import static
from django.http import Http404
from django.http import JsonResponse
from django.shortcuts import get_object_or_404
from django.urls import reverse
from django.utils import timezone
from django.views.generic import TemplateView
from django.views.generic import View


# Imports from other dependencies.
from djangorestframework_camel_case.parser import CamelCaseJSONParser
from djangorestframework_camel_case.render import CamelCaseJSONRenderer
import redis
from rest_framework.authentication import SessionAuthentication
from rest_framework.authentication import TokenAuthentication
from rest_framework.permissions import IsAuthenticated
from rest_framework.renderers import BrowsableAPIRenderer
from rest_framework import viewsets
from six.moves.urllib.parse import urlparse
from six.moves.urllib.parse import urlunparse


# Imports from budget.
from budget.filters import ContentPlacementFilter
from budget.filters import HeadlineViewFilter
from budget.filters import ItemViewFilter
from budget.filters import PackageViewFilter
from budget.filters import PrintPublicationViewFilter
from budget.models import ContentPlacement
from budget.models import Headline
from budget.models import HeadlineVote
from budget.models import Item
from budget.models import Package
from budget.models import PrintPublication
from budget.paginators import ItemViewPagination
from budget.serializers import ContentPlacementSerializer
from budget.serializers import HeadlineSerializer
from budget.serializers import HeadlineVoteSerializer
from budget.serializers import ItemSerializer
from budget.serializers import PackageSerializer
from budget.serializers import PrintPublicationSerializer


REDIS_URL = getattr(settings, 'BUDGET_REDIS_URL', '')

REDIS_CONNECTION = redis.from_url(REDIS_URL)

EDITING_MARKER_TIMEOUT = 90  # Ninety seconds (1.5 minutes).


class MainBudgetView(TemplateView):
    """TK."""
    template_name = 'budget/index.html'

    def get_context_data(self, *args, **kwargs):
        context = super(MainBudgetView, self).get_context_data(*args, **kwargs)

        hostURL = self.request.META['HTTP_HOST']
        aliased_origins = getattr(settings, 'BUDGET_ALIASED_ORIGINS', [])

        context.update({
            'budget_name': getattr(settings, 'BUDGET_TOOL_NAME', 'Budget'),
        })

        # Config AJAX URL.
        config_url = reverse('budget:config')
        if hostURL is not None:
            formatted_url = '{}://{}'.format(self.request.scheme, hostURL)

            if formatted_url in aliased_origins:
                root_budget_url = reverse(
                    'budget:main-budget-view',
                    kwargs={'path': ''}
                )
                config_url = config_url.lstrip(root_budget_url)

                if config_url[0] != '/':
                    config_url = '/{}'.format(config_url)

        context.update({
            'config_url': config_url,
        })

        return context


class ExceptionView(View):
    def get(self, request, *args, **kwargs):
        return 1 / 0


class ConfigView(View):
    def get(self, request, *args, **kwargs):
        originURL = request.GET.get('origin')
        aliased_origins = getattr(settings, 'BUDGET_ALIASED_ORIGINS', [])

        empty_admin_case = [['', 'test@example.com']]
        django_admins = getattr(settings, 'ADMINS', empty_admin_case)
        default_admin_email = django_admins[0][1]

        actual_admin_email = getattr(
            settings,
            'BUDGET_ADMIN_EMAIL',
            default_admin_email
        )

        api_bases = {
            'auth': reverse('apiauth:api-root'),
            'budget': reverse('budget:api-root'),
            'staff': reverse('editorial_staff:api:v1:root'),
        }

        explicit_api_bases = getattr(settings, 'BUDGET_API_CONFIGS', {})

        for key, val in explicit_api_bases.items():
            if callable(val):
                raw_value = val(reverse)
            else:
                raw_value = val

            api_bases[key] = raw_value

        for k, endpoint_url in api_bases.items():
            if originURL is not None and originURL in aliased_origins:
                endpoint_url_parts = urlparse(endpoint_url)

                aliased_url = getattr(settings, 'BUDGET_ALIASED_API_URL', '')
                aliased_url_parts = urlparse(aliased_url)

                final_url = urlunparse(endpoint_url_parts._replace(
                    scheme=aliased_url_parts.scheme,
                    netloc=aliased_url_parts.netloc,
                    path=endpoint_url_parts.path.replace('//', '/')
                ))

                api_bases[k] = final_url

        if originURL is not None and originURL in aliased_origins:
            root_url = None
        else:
            root_url = reverse('budget:main-budget-view', kwargs={'path': ''})

        if request.user.is_authenticated():
            # Use user ID as unique-per-user part of hash.
            unique_user_id = request.user.username
        else:
            # Use user IP address (or HTTP_X_FORWARDED_FOR header, if set) as
            # unique-per-user part of hash.
            x_forwarded_for = request.META.get('HTTP_X_FORWARDED_FOR')

            if x_forwarded_for:
                unique_user_id = x_forwarded_for.split(',')[0]
            else:
                unique_user_id = request.META.get('REMOTE_ADDR')

        unique_pageload_id = hashlib.sha1(
            json.dumps({
                'time_accessed': time.mktime(timezone.now().timetuple()),
                'user': unique_user_id,
            }, sort_keys=True).encode('utf-8')
        ).hexdigest()

        pkg_params = {'package_id': 0}
        editing_url = reverse('budget:user-editing-package', kwargs=pkg_params)
        exited_url = reverse('budget:user-exited-package', kwargs=pkg_params)

        budget_root = reverse('budget:api-root')

        editing_suffix = editing_url.replace(budget_root, '')
        exited_suffix = exited_url.replace(budget_root, '')

        return JsonResponse({
            'adminEmail': actual_admin_email,
            'apiBases': api_bases,
            'branding': {
                'mastheadLogoAltText': getattr(
                    settings,
                    'BUDGET_ORGANIZATION_NAME',
                    'Your organization here'
                ),
                'mastheadLogoURL': static(getattr(
                    settings,
                    'BUDGET_ORGANIZATION_LOGO_PATH',
                    'budget/images/your_name_here.svg'
                )),
                'siteLogoAltText': getattr(
                    settings,
                    'BUDGET_TOOL_NAME',
                    'Budget'
                ),
                'siteLogoURL': static(getattr(
                    settings,
                    'BUDGET_TOOL_LOGO_PATH',
                    'budget/images/budget_logo.svg'
                )),
                'printLogoURL': static(getattr(
                    settings,
                    'BUDGET_PRINT_LOGO_PATH',
                    'budget/images/the-daily.svg'
                )),
            },
            'defaultTimezone': timezone.get_default_timezone_name(),
            'presenceSuffixes': {
                'editing': editing_suffix,
                'exited': exited_suffix,
            },
            'externalURLs': json.dumps(
                getattr(settings, 'BUDGET_EXTERNAL_URLS', {})
            ),
            'imageAssets': {
                'notepad': static('budget/images/notepad.svg'),
                'slackProgress': static('budget/images/slack-in-progress.png'),
            },
            'maxItemsToLoad': getattr(settings, 'BUDGET_API_MAX_ITEMS', 500),
            'pageLoadID': unique_pageload_id,
            'printSlugName': getattr(settings, 'BUDGET_PRINT_SLUG_NAME', None),
            'showHeadlines': getattr(settings, 'BUDGET_SHOW_HEADLINES', False),
            'rootURL': root_url,
        })


##########
# Mixins #
##########

class CsrfExemptSessionAuthentication(SessionAuthentication):
    """A custom auth subclass to disable CSRF on the session auth middleware"""
    def enforce_csrf(self, request):
        return


class SessionAndTokenAuthedViewSet(object):
    """Mixin to add both token and Django session auth to a REST viewset"""
    authentication_classes = (CsrfExemptSessionAuthentication,
                              TokenAuthentication,)
    permission_classes = (IsAuthenticated,)


class CamelCasedViewSet(object):
    renderer_classes = (BrowsableAPIRenderer, CamelCaseJSONRenderer,)
    parser_classes = (CamelCaseJSONParser,)


############
# Viewsets #
############


class PackageViewSet(SessionAndTokenAuthedViewSet, CamelCasedViewSet,
                     viewsets.ModelViewSet):
    serializer_class = PackageSerializer
    filter_class = PackageViewFilter

    queryset = Package.objects.distinct().prefetch_related(
        'additional_content',
        'headline_candidates',
        # 'print_section',
    )

    def get_object(self):
        """Attempt to retrieve the package by multiple means.

        If the PK passed is numeric, try getting the package by its ID.
        Otherwise, use the slug instead.
        """
        queryset = self.get_queryset()
        queryset = self.filter_queryset(queryset)

        try:
            int(self.kwargs.get('pk', ''))
            return get_object_or_404(queryset, **self.kwargs)
        except ValueError:
            try:
                return queryset.get_by_slug(self.kwargs['raw_slug'])
            except Package.DoesNotExist:
                raise Http404


class ItemViewSet(SessionAndTokenAuthedViewSet, CamelCasedViewSet,
                  viewsets.ModelViewSet):
    queryset = Item.objects.select_related(
        'primary_for_package',
        'additional_for_package'
    )
    serializer_class = ItemSerializer
    filter_class = ItemViewFilter
    pagination_class = ItemViewPagination


class ContentPlacementViewSet(SessionAndTokenAuthedViewSet, CamelCasedViewSet,
                              viewsets.ModelViewSet):
    serializer_class = ContentPlacementSerializer
    filter_class = ContentPlacementFilter

    queryset = ContentPlacement.objects.distinct()


class HeadlineViewSet(SessionAndTokenAuthedViewSet, CamelCasedViewSet,
                      viewsets.ModelViewSet):
    queryset = Headline.objects.all().order_by('-pk')
    serializer_class = HeadlineSerializer
    filter_class = HeadlineViewFilter


class HeadlineVoteViewSet(SessionAndTokenAuthedViewSet, CamelCasedViewSet,
                          viewsets.ModelViewSet):
    queryset = HeadlineVote.objects.all().order_by('-pk')
    serializer_class = HeadlineVoteSerializer


class PrintPublicationViewSet(SessionAndTokenAuthedViewSet, CamelCasedViewSet,
                              viewsets.ReadOnlyModelViewSet):
    queryset = PrintPublication.objects.all().prefetch_related('sections')
    serializer_class = PrintPublicationSerializer
    filter_class = PrintPublicationViewFilter


########################
# Multi-user warnings. #
########################


# class UserPackageBehaviorMixin(LoginRequiredMixin):
class UserPackageBehaviorMixin(object):
    """TK."""
    def dispatch(self, request, package_id, *args, **kwargs):
        # TODO: Decide whether we care about checking whether the package ID
        # actually exists.
        # If not, this saves us a database query — and takes the response times
        # on local dev down from ~35ms to ~25ms.
        # try:
        #     Package.objects.get(id=package_id)
        # except Package.DoesNotExist:
        #     return JsonResponse({
        #         'status': 404,
        #         'message': 'No package found for ID #{}.'.format(package_id)
        #     })

        if request.user.is_authenticated:
            self.package_id = package_id
            self.user_identifier = self.get_user_identifier()
            self.pageload_id = request.GET.get('pageload', None)

            self.current_visit_key = self.get_current_visit_key()

        return super(
            UserPackageBehaviorMixin,
            self
        ).dispatch(request, *args, **kwargs)

    def get_user_identifier(self):
        if self.request.user.email:
            return self.request.user.email
        return self.request.user.username

    def get_current_visit_key(self):
        return 'p={}--u={}--l={}'.format(
            self.package_id,
            self.user_identifier,
            self.pageload_id
        )


class UserEditingPackageUpdateView(UserPackageBehaviorMixin, View):
    def get(self, request, *args, **kwargs):
        # Get the current time.
        # We'll use this for the key value, as well as for the expiration time.
        current_timestamp = int(time.mktime(datetime.now().timetuple()))

        # Calculate new expiration.
        new_expiration_timestamp = current_timestamp + EDITING_MARKER_TIMEOUT

        response_object = {
            'status': 200,
            'current_key': self.current_visit_key,
        }

        # Get or create package key with current timestamp as value.
        old_timestamp_raw = REDIS_CONNECTION.getset(
            self.current_visit_key,
            current_timestamp
        )

        # Set (or increment) the time this key will expire.
        REDIS_CONNECTION.expireat(
            self.current_visit_key,
            new_expiration_timestamp
        )

        if old_timestamp_raw is not None:
            old_timestamp = int(old_timestamp_raw.decode('utf-8'))

            response_object['created'] = False
            response_object[
                'action_message'
            ] = 'Extended active status by {} seconds.'.format(
                current_timestamp - old_timestamp
            )
        else:
            response_object['created'] = True
            response_object[
                'action_message'
            ] = 'New active status until {}.'.format(
                new_expiration_timestamp
            )

        matching_keys = REDIS_CONNECTION.scan(
            match='p={}--*'.format(self.package_id)
        )[1]

        other_active_sessions = [
            key.decode('utf-8') for key in matching_keys
            if key.decode('utf-8') != self.current_visit_key
        ]

        other_active_session_users = list(set([
            key.split('--')[1].split('=')[1] for key in other_active_sessions
        ]))

        response_object['current_user_has_duplicate_sessions'] = (
            self.user_identifier in other_active_session_users
        )

        other_active_users = [
            user_str for user_str in other_active_session_users
            if user_str != self.user_identifier
        ]

        response_object['other_active_users'] = other_active_users

        return JsonResponse(response_object)


class UserExitedPackageUpdateView(UserPackageBehaviorMixin, View):
    def get(self, request, *args, **kwargs):
        # Remove the key.
        REDIS_CONNECTION.delete(self.current_visit_key)

        # Get the same key as was generated above, then delete it.
        return JsonResponse({
            'status': 204,
            'message': 'Successfully deleted key',
            'deleted_key': self.current_visit_key,
        })


# The following code deletes all active editing records for package #114:
# r.delete(*[_.decode('utf-8') for _ in r.scan(match='p=114--*')[1]])
