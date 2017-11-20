# Imports from python.  # NOQA
from datetime import datetime


# Imports from django.
from django.conf import settings
from django.contrib.postgres.search import SearchQuery
from django.contrib.postgres.search import SearchRank
from django.contrib.postgres.search import SearchVector
from django.db.models import F, Func, Q  # NOQA


# Imports from other dependencies.
from django_filters import BaseInFilter
from django_filters import CharFilter
from django_filters import NumberFilter
from django_filters import OrderingFilter
from psycopg2.extras import DateRange
from psycopg2.extras import DateTimeTZRange
import pytz
from rest_framework import filters


# Imports from budget.
from budget.models import ContentPlacement
from budget.models import Headline
from budget.models import Item
from budget.models import Package
from budget.models import PrintPublication
from budget.utils import SLUG_MATCH_RE


tz = pytz.timezone(settings.TIME_ZONE)


def daterange_filter_decorator(time=True):
    """Decorator that handles datetime-filter validation/parsing logic.

    Enforces the existence of an upper and lower bounds, separated by a
    comma in YYYY-MM-DD format. Returns an empty queryset when
    validation or parsing fails.
    """
    def wrap(filter_func):
        def filter_wrapper(self, queryset, field_name, date_range):
            try:
                lower, upper = date_range.split(',')
            except ValueError:
                return queryset.none()

            try:
                lower = tz.localize(datetime.strptime(
                    lower, '%Y-%m-%d'))
                upper = tz.localize(datetime.strptime(
                    upper, '%Y-%m-%d'))
            except ValueError:
                return queryset.none()

            if lower >= upper:
                return queryset.none()

            if time:
                return filter_func(self, queryset, lower, upper)
            else:
                return filter_func(self, queryset, lower.date(), upper.date())
        return filter_wrapper
    return wrap


class NumberInFilter(BaseInFilter, NumberFilter):
    pass


class PackageOrderingFilter(OrderingFilter):
    def filter(self, qs, ordering_list):
        ordering = ordering_list[0]

        if ordering == 'slug':
            qs = qs.annotate(
                publish_date_upper=Func(
                    F('publish_date'), function='UPPER'),
                publish_date_lower=Func(
                    F('publish_date'), function='LOWER')
            )
            qs = qs.annotate(
                publish_date_len=(
                    F('publish_date_upper') - F('publish_date_lower'))
            )

            qs = qs.order_by(
                '-publish_date_upper',
                'publish_date_len',
                'hub__name',
                'slug_key'
            )

        return qs


class PackageViewFilter(filters.FilterSet):
    id__in = NumberInFilter(name='pk', lookup_expr='in')
    publish_date = CharFilter(method='publish_date_filter')
    content_type = CharFilter(method='content_type_filter')
    person = CharFilter(method='person_filter')
    has_primary = CharFilter(method='has_primary_filter')
    hub = CharFilter(name='hub', lookup_expr='iexact')
    vertical = CharFilter(name='vertical', lookup_expr='iexact')
    search = CharFilter(method='search_filter')
    ordering = PackageOrderingFilter(
        choices=(
            ('slug', 'Slug',),
            # We've retained publish_date as an option for backward
            # compatibility, even though it's now the model manager's default
            # now that django-filter no longer allows a default sort:
            # https://github.com/carltongibson/django-filter/pull/472
            ('publish_date', 'Publish date',),
        )
    )

    def search_filter(self, queryset, field_name, search_term):
        """Base condition (non-faceted) search logic.

        If 'search_term' is a slug (as matched by 'SLUG_MATCH_RE'), look
        for a package with that slug and return it.

        Otherwise, use Django's Postgres full-text search integration to
        search the budget line and slug key fields for matches.
        """
        slug_match = SLUG_MATCH_RE.match(search_term)
        if slug_match:
            try:
                matching_package = queryset.get_by_slug(
                    '{hub_name}.{slug_key}.{month}{day}{year}'.format(
                        **slug_match.groupdict()
                    )
                )
                return queryset.filter(id=matching_package.id)
            except Package.DoesNotExist:
                pass

        vector = SearchVector(
            'primary_content__budget_line', weight='A'
        ) + SearchVector(
            'slug_key',
            'additional_content__budget_line',
            weight='B'
        ) + SearchVector(
            'additional_content__slug_key',
            weight='C'
        )

        return queryset.annotate(
            rank=SearchRank(vector, SearchQuery(search_term))
        ).filter(
            rank__gte=0.1
        ).order_by('-rank')

    def has_primary_filter(self, queryset, field_name, on_or_off):
        if on_or_off not in ('1', '0',):
            return queryset.none()

        filter_val = False if on_or_off == '1' else True
        return queryset.filter(primary_content__isnull=filter_val)

    def person_filter(self, queryset, name, person_email):
        return queryset.filter(
            Q(
                primary_content__editors__contains=[
                    {'email': person_email}
                ]
            ) | Q(
                primary_content__authors__contains=[
                    {'email': person_email}
                ]
            ) | Q(
                additional_content__editors__contains=[
                    {'email': person_email}
                ]
            ) | Q(
                additional_content__authors__contains=[
                    {'email': person_email}
                ]
            )
        )

    def content_type_filter(self, queryset, field, content_type):
        return queryset.filter(
            Q(
                primary_content__type=content_type
            ) | Q(
                additional_content__type=content_type
            )
        )

    @daterange_filter_decorator()
    def publish_date_filter(self, queryset, lower, upper):
        return queryset.filter(
            publish_date__overlap=DateTimeTZRange(
                lower=lower,
                upper=upper
            )
        )

    class Meta:  # NOQA
        model = Package
        fields = []
        order_by = (
            'publish_date',
            'slug',
        )


class ItemViewFilter(filters.FilterSet):
    id__in = NumberInFilter(name='pk', lookup_expr='in')
    person = CharFilter(method='person_filter')
    publish_date = CharFilter(method='publish_date_filter')
    author = CharFilter(method='author_filter')
    editor = CharFilter(method='editor_filter')
    primary_id = NumberFilter(name='primary_for_package__pk')
    additional_id = NumberFilter(name='additional_for_package__pk')

    class Meta:  # NOQA
        model = Item
        fields = []

    """
    We need the below custom filters to traverse into the JSON fields that
    store author/editor information and, in the case of person_filter, to
    allow us to query across both author and editor fields
    """
    def person_filter(self, queryset, field_name, person_email):
        return queryset.filter(
            Q(
                editors__contains=[
                    {'email': person_email}
                ]
            ) | Q(
                authors__contains=[
                    {'email': person_email}
                ]
            )
        )

    def author_filter(self, queryset, field_name, author_email):
        return queryset.filter(authors__contains=[{'email': author_email}])

    def editor_filter(self, queryset, field_name, editor_email):
        return queryset.filter(editors__contains=[{'email': editor_email}])

    """
    To handle date-bound queries, Qs are required to check the publication date
    on any package (primary or additional) connected to our items
    """
    @daterange_filter_decorator()
    def publish_date_filter(self, queryset, lower, upper):
        return queryset.filter(
            Q(primary_for_package__publish_date__overlap=DateTimeTZRange(
                lower=lower, upper=upper)) |
            Q(additional_for_package__publish_date__overlap=DateTimeTZRange(
                lower=lower, upper=upper))
        )


class HeadlineViewFilter(filters.FilterSet):
    id__in = NumberInFilter(name='pk', lookup_expr='in')

    class Meta:  # NOQA
        model = Headline
        fields = []


class PrintPublicationViewFilter(filters.FilterSet):
    publication_active = CharFilter(method='publication_active_filter')

    class Meta:  # NOQA
        model = PrintPublication
        fields = []

    """
    These are implemented as CharFilters because the built-in BooleanFilter
    interprets 3 as True and 2 as False, which is crazy. So these are built
    as custom methods that interpret 1 as True and 0 as False
    """
    def publication_active_filter(self, queryset, field_name, on_or_off):
        if on_or_off not in ('1', '0'):
            return queryset.none()

        filter_val = True if on_or_off == '1' else False
        return queryset.filter(is_active=filter_val)


class ContentPlacementOrderingFilter(OrderingFilter):
    def filter(self, qs, ordering_list):
        ordering = ordering_list[0]

        if ordering == 'run_date':
            qs = qs.annotate(
                run_date_upper=Func(F('run_date'), function='UPPER'),
                run_date_lower=Func(F('run_date'), function='LOWER')
            )
            qs = qs.annotate(
                run_date_len=(F('run_date_upper') - F('run_date_lower'))
            )
            qs = qs.order_by('-run_date_upper', 'run_date_len')

        # elif ordering == 'slug':
        #     qs = qs.annotate(
        #         run_date_upper=Func(F('run_date'), function='UPPER'),
        #         run_date_lower=Func(F('run_date'), function='LOWER')
        #     )
        #     qs = qs.annotate(
        #         run_date_len=(F('run_date_upper') - F('run_date_lower'))
        #     )
        #
        #     qs = qs.order_by(
        #         '-run_date_upper',
        #         'run_date_len',
        #         'package__hub__name',
        #         'package__slug_key'
        #     )

        return qs


class ContentPlacementFilter(filters.FilterSet):
    destination = CharFilter(name='destination__slug', lookup_expr='iexact')
    run_date = CharFilter(method='placement_run_date_filter')
    ordering = ContentPlacementOrderingFilter(
        choices=(
            ('run_date', 'Print run date',),
            ('slug', 'Slug',),
        )
    )

    @daterange_filter_decorator(time=False)
    def placement_run_date_filter(self, queryset, lower, upper):
        return queryset.filter(
            run_date__overlap=DateRange(
                lower=lower,
                upper=upper
            )
        )

    class Meta:  # NOQA
        model = ContentPlacement
        fields = ('package', 'destination',)
