# Imports from Django.  # NOQA
from django.http import Http404
from django.shortcuts import get_object_or_404
from django.views.generic import TemplateView


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
