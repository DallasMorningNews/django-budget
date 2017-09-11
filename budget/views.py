# Imports from Django.  # NOQA
from django.conf import settings
from django.contrib.staticfiles.templatetags.staticfiles import static
from django.http import Http404, JsonResponse  # NOQA
from django.shortcuts import get_object_or_404
from django.urls import reverse
from django.utils import timezone
from django.views.generic import TemplateView, View  # NOQA


# Imports from budget.
from budget.models import (  # NOQA
    Item,
    Headline,
    HeadlineVote,
    Package,
    PrintPublication
)
from budget.filters import (  # NOQA
    ItemViewFilter,
    PackageViewFilter,
    HeadlineViewFilter,
    PrintPublicationViewFilter
)
from budget.serializers import (  # NOQA
    HeadlineSerializer,
    HeadlineVoteSerializer,
    ItemSerializer,
    PackageSerializer,
    PrintPublicationSerializer
)


# Imports from other dependencies.
from djangorestframework_camel_case.parser import CamelCaseJSONParser
from djangorestframework_camel_case.render import CamelCaseJSONRenderer
from rest_framework.authentication import (  # NOQA
    SessionAuthentication,
    TokenAuthentication
)
from rest_framework.permissions import IsAuthenticated
from rest_framework.renderers import BrowsableAPIRenderer
from rest_framework import viewsets


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

        if hostURL is not None and hostURL in aliased_origins:
            aliased = 'y'
        else:
            aliased = 'n'

        context.update({
            'aliased': aliased,
        })
        return context


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
            'staff': reverse('staff:api-root'),
        }

        explicit_api_bases = getattr(settings, 'BUDGET_API_CONFIGS', {})

        for key, val in explicit_api_bases.items():
            if callable(val):
                raw_value = val(reverse)
            else:
                raw_value = val

            if originURL is not None and originURL in aliased_origins:
                pass
            else:
                raw_value = '{}{}'.format(
                    getattr(settings, 'BUDGET_ALIASED_API_URL', ''),
                    raw_value
                )

            api_bases[key] = raw_value

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
        'additional_content', 'headline_candidates', 'print_section',)

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
