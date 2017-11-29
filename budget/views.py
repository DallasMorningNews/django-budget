# Imports from python.  # NOQA
import json


# Imports from Django.
from django.conf import settings
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
            'staff': reverse('editorial_staff:api:root'),
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
            'externalURLs': json.dumps(
                getattr(settings, 'BUDGET_EXTERNAL_URLS', {})
            ),
            'imageAssets': {
                'notepad': static('budget/images/notepad.svg'),
                'slackProgress': static('budget/images/slack-in-progress.png'),
            },
            'maxItemsToLoad': getattr(settings, 'BUDGET_API_MAX_ITEMS', 500),
            'printSlugName': getattr(settings, 'BUDGET_PRINT_SLUG_NAME', None),
            'showHeadlines': getattr(settings, 'BUDGET_SHOW_HEADLINES', False),
            'rootURL': root_url
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
