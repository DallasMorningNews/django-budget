# Imports from python.  # NOQA
from datetime import datetime
from datetime import timedelta
import json


# Imports from Django.
from django.contrib.auth.models import User
# from django.test import override_settings
from django.test import TestCase
from django.urls import reverse
from django.utils.timezone import make_aware


# Imports from other dependencies.
from rest_framework.test import APIClient


# Imports from budget.
from budget.models import Change
# from budget.models import Headline
# from budget.models import HeadlineVote
from budget.models import Item
from budget.models import Package
from budget.models import PrintPublication
from budget.models import PrintSection
from budget.tests.utils import budget_db
from budget.tests.utils import get_timestamp_for_date
from budget.tests.utils import item_factory
from budget.tests.utils import package_factory
from budget.tests.utils import separate_db
from budget.tests.utils import staff_factory
from budget.tests.utils import tz

__all__ = [
    'CommonAPITestCase',
    'HeadlinesAPITestCase',
    'ItemsAPITestCase',
    'PackagesAPITestCase',
    'PrintPublicationAPITestCase',
    'AuditTrailApiMixinTestCase',
]


PACKAGES_API_ENDPOINT = '/api/packages/'
PUBLICATION_API_ENDPOINT = '/api/print-publications/'
ITEMS_API_ENDPOINT = reverse('budget:item-list')


class AuthedApiTestMixin(TestCase):
    """Mixin to simulate API request client.

    Store an authed API request client on the instance, which we can
    later use to test our API.
    """
    def setUp(self):
        super(AuthedApiTestMixin, self).setUp()
        user = User.objects.create_user('user')
        self.client = APIClient()
        self.client.force_authenticate(user=user)


# @override_settings(ROOT_URLCONF='budget.test_urls')
class CommonAPITestCase(AuthedApiTestMixin, TestCase):
    """Tests for shared (or potentially shareable) logic from our API.

    Includes tests for custom serializers, filters, etc.
    """
    multi_db = separate_db

    @classmethod
    def setUpTestData(cls):
        for _ in range(5):
            package_slug = 'test-package-{}'.format(_)
            item_factory(primary_for=package_factory(slug_key=package_slug))

    def test_invalid_publish_date_filter(self):
        """Verify handling of invalid publish_date filter values.

        When invalid params are passed in the publish_date filter an
        empty queryset should be returned.

        Tests the packages API endoint, but really we're checking all
        endpoints that use our shared parsing/validation decorator
        (budget.filters.daterange_filter_decorator).
        """
        # Run a valid query just to be 1000% sure we're not just getting back
        # empty queries
        query = {'format': 'json', 'publish_date': '2015-05-01,2015-05-02'}
        response = self.client.get(PACKAGES_API_ENDPOINT, data=query)
        self.assertEqual(json.loads(response.content)['count'], 5)

        # Missing date
        query = {'format': 'json', 'publish_date': '2015-05-01'}
        response = self.client.get(PACKAGES_API_ENDPOINT, data=query)
        self.assertEqual(json.loads(response.content)['count'], 0)

        # Invalid date format
        query = {'format': 'json', 'publish_date': 'not-a-date,2015-05-01'}
        response = self.client.get(PACKAGES_API_ENDPOINT, data=query)
        self.assertEqual(json.loads(response.content)['count'], 0)

        # Lower bound greater than upper
        query = {'format': 'json', 'publish_date': '2016-05-01,2015-05-01'}
        response = self.client.get(PACKAGES_API_ENDPOINT, data=query)
        self.assertEqual(json.loads(response.content)['count'], 0)

    def test_publish_date_tz_handling(self):
        """Verify date-query timezone handling.

        Date queries should perform time zone-aware queries in
        local time.
        """
        query = {'format': 'json', 'publish_date': '2015-04-30,2015-05-01'}
        response = self.client.get(PACKAGES_API_ENDPOINT, data=query)
        self.assertEqual(json.loads(response.content)['count'], 0)

        query = {'format': 'json', 'publish_date': '2015-05-02,2015-05-03'}
        response = self.client.get(PACKAGES_API_ENDPOINT, data=query)
        self.assertEqual(json.loads(response.content)['count'], 0)

    def test_read_from_daterange_field(self):
        """Verify range-field serialization behavior.

        Range field should serialize as two ISO-8601 dates in an array.
        """
        package = package_factory(slug_key='test-daterng-read')
        package_url = '%s%s/' % (PACKAGES_API_ENDPOINT, package.pk,)

        response = self.client.get(package_url, data={'format': 'json'})
        json_response = json.loads(response.content)
        expect = [
            get_timestamp_for_date('2015-05-01'),
            get_timestamp_for_date('2015-05-02'),
        ]
        self.assertEqual(json_response['publishDate'], expect)

    def test_write_to_daterange_field(self):
        """Verify parsing and storage of date-range values.

        Valid ISO-8601 dates passed in a range field should be parsed
        and stored.
        """
        package = package_factory(slug_key='test-daterng-write-1')
        package_url = '%s%s/?format=json' % (
            PACKAGES_API_ENDPOINT, package.pk,)

        update = {
            'publishDate': ['2015-05-03T00:00:00Z', '2015-05-04T00:00:00Z']
        }
        response = self.client.patch(package_url, update, format='json')
        self.assertEqual(response.status_code, 200)

        json_response = json.loads(response.content)
        self.assertEqual(json_response['publishDate'], update['publishDate'])

    def test_write_invalid_date_format_to_daterange_field(self):
        """Invalid ISO-8601 dates throw a validation error"""
        package = package_factory(slug_key='test-daterng-write-2')
        package_url = '%s%s/?format=json' % (
            PACKAGES_API_ENDPOINT, package.pk,)

        update = {
            'publishDate': ['not-a-date', '2015-05-04T00:00:00Z']
        }
        response = self.client.patch(package_url, update, format='json')
        self.assertEqual(response.status_code, 400)

        error = {
            'publishDate': [
                ' '.join([
                    'Datetime has wrong format.',
                    'Use one of these formats instead:',
                    'YYYY-MM-DDThh:mm[:ss[.uuuuuu]][+HH:MM|-HH:MM|Z].',
                ])
            ]
        }
        self.assertJSONEqual(response.content, error)

    def test_write_invalid_date_count_to_daterange_field(self):
        """Verify invalid-length arrays fail date-range validation.

        Should raise ValidationError when the date-range value is not
        passed enough date values.
        """
        package = package_factory(slug_key='test-daterng-write-3')
        package_url = '%s%s/?format=json' % (
            PACKAGES_API_ENDPOINT, package.pk,)

        update = {
            'publishDate': ['2015-05-02T00:00:00Z']
        }
        response = self.client.patch(package_url, update, format='json')
        self.assertEqual(response.status_code, 400)

        error = {
            'publishDate': [
                'Incorrect format. Expected an Array with two items.',
            ]
        }
        self.assertJSONEqual(response.content, error)

    def test_write_invalid_date_bounds_to_daterange_field(self):
        """Verify date-range part ordering behavior.

        Passing a date range where the lower is greater than the upper
        raises an error.
        """
        package = package_factory(slug_key='test-daterng-write-4')
        package_url = '%s%s/?format=json' % (
            PACKAGES_API_ENDPOINT, package.pk,)

        update = {
            'publishDate': [
                get_timestamp_for_date('2015-05-03'),
                get_timestamp_for_date('2015-05-02'),
            ]
        }
        response = self.client.patch(package_url, update, format='json')
        self.assertEqual(response.status_code, 400)

        error = {
            'publishDate': [
                'The upper date bound must be greater than the lower bound.'
                ]
        }
        self.assertJSONEqual(response.content, error)

    def test_empty_json_serializer(self):
        """Verify null-value JSON serialization behavior.

        When serialized with our custom EmptyArrayJsonField, null values
        should be serialized as empty arrays.
        """
        # Don't use our factory, because we need None for authors/editors
        slug_key = 'test-json-serializer'
        item = Item.objects.create(
            slug_key='sluggy-slug',
            type='text',
            budget_line='Budget line',
            primary_for_package=package_factory(slug_key=slug_key)
        )
        item_url = '%s%s/?format=json' % (ITEMS_API_ENDPOINT, item.pk,)
        response = self.client.get(item_url)
        self.assertEqual(response.status_code, 200)
        json_response = json.loads(response.content)
        self.assertEqual(json_response['authors'], [])
        self.assertEqual(json_response['editors'], [])


class HeadlinesAPITestCase(TestCase):
    pass


# @override_settings(ROOT_URLCONF='budget.test_urls')
class ItemsAPITestCase(AuthedApiTestMixin, TestCase):
    multi_db = separate_db

    @classmethod
    def setUpTestData(cls):
        package_one = package_factory(slug_key='test-items-api-base')
        item_factory(primary_for=package_one)
        item_factory(additional_for=package_one, slug_key='addl1')
        # item_factory(additional_for=package_one)
        for _ in range(5):
            slug_key = 'test-items-api-{}'.format(_)
            item_factory(primary_for=package_factory(slug_key=slug_key))

    def test_query_count(self):
        """Only make two queries to budget DB for an item list view."""
        with self.assertNumQueries(2, using=budget_db):
            self.client.get(ITEMS_API_ENDPOINT, data={'format': 'json'})

    def test_person_filter(self):
        """Person filter should search both author & editor fields."""
        item_factory(
            author='a-person@b.com',
            primary_for=package_factory(slug_key='test-items-api-p1')
        )
        item_factory(
            editor='a-person@b.com',
            primary_for=package_factory(slug_key='test-items-api-p2')
        )
        response = self.client.get(ITEMS_API_ENDPOINT, data={
            'format': 'json',
            'person': 'a-person@b.com'
        })
        self.assertEqual(response.status_code, 200)
        self.assertEqual(json.loads(response.content)['count'], 2)

    def test_author_filter(self):
        """Author field should return items based on author's e-mail."""
        item_factory(
            author='an-author@b.com',
            primary_for=package_factory(slug_key='test-items-api-p3')
        )
        response = self.client.get(ITEMS_API_ENDPOINT, data={
            'format': 'json',
            'author': 'an-author@b.com'
        })
        self.assertEqual(response.status_code, 200)
        self.assertEqual(json.loads(response.content)['count'], 1)

    def test_editor_filter(self):
        """Editor field should return items based on editor's e-mail."""
        item_factory(
            editor='an-editor@b.com',
            primary_for=package_factory(slug_key='test-items-api-p4')
        )

        response = self.client.get(ITEMS_API_ENDPOINT, data={
            'format': 'json',
            'editor': 'an-editor@b.com'
        })

        self.assertEqual(response.status_code, 200)
        self.assertEqual(json.loads(response.content)['count'], 1)

    def test_date_filter(self):
        """Verify publish_date filter behavior.

        Publish date filter should return items based on primary and
        additional package's publish date.
        """
        package = package_factory(
            publish_date_lower=make_aware(datetime(2015, 7, 4)),
            publish_date_upper=make_aware(datetime(2015, 7, 5)),
            slug_key='test-items-api-d1'
        )
        item_factory(primary_for=package)
        item_factory(additional_for=package)
        response = self.client.get(ITEMS_API_ENDPOINT, data={
            'format': 'json',
            'publish_date': '2015-07-04,2015-07-05'
        })
        self.assertEqual(response.status_code, 200)
        self.assertEqual(json.loads(response.content)['count'], 2)


# @override_settings(ROOT_URLCONF='budget.test_urls')
class PackagesAPITestCase(AuthedApiTestMixin, TestCase):
    multi_db = separate_db

    @classmethod
    def setUpTestData(cls):
        # Generate packages on 5 consecutive days, so we can run date-bound
        # filtered queries
        for offset in range(5):
            days_to_add = offset + 1
            lower = tz.localize(datetime(2015, 5, 1)) + timedelta(
                days=days_to_add
            )
            upper = lower + timedelta(days=1)
            package = package_factory(
                publish_date_lower=lower,
                publish_date_upper=upper)
            item_factory(primary_for=package)

    def test_query_count(self):
        """Only make 4 queries to budget DB for a package list view."""
        with self.assertNumQueries(5, using=budget_db):
            self.client.get(PACKAGES_API_ENDPOINT, data={'format': 'json'})

    def test_publish_date_filter(self):
        """Verify publish_date filter behavior.

        A comma-separated publish_date param should perform a range
        query on publish_date.
        """
        # We create one package per day in the setup, so number of days in
        # the range should equal number of packages
        query = {'format': 'json', 'publish_date': '2015-05-02,2015-05-03'}
        response = self.client.get(PACKAGES_API_ENDPOINT, data=query)
        self.assertEqual(json.loads(response.content)['count'], 1)

        query['publish_date'] = '2015-05-02,2015-05-05'
        response = self.client.get(PACKAGES_API_ENDPOINT, data=query)
        self.assertEqual(json.loads(response.content)['count'], 3)

    def test_get_by_slug(self):
        """The package detail view should allow GETing by slug"""
        package = package_factory(slug_key='test-pkg-api-gbs')

        url = '%s%s/' % (PACKAGES_API_ENDPOINT, package.full_slug)
        response = self.client.get(url, data={'format': 'json'})
        self.assertEqual(response.status_code, 200)

        json_response = json.loads(response.content)
        self.assertEqual(json_response['id'], package.id)

    def test_get_by_id(self):
        """Verify package API get-by-ID behavior.

        This is the traditional GET behavior for API detail views.
        """
        package = package_factory(slug_key='test-pkg-api-gbid')

        url = '%s%s/' % (PACKAGES_API_ENDPOINT, package.pk)
        response = self.client.get(url, data={'format': 'json'})
        self.assertEqual(response.status_code, 200)

        json_response = json.loads(response.content)
        self.assertEqual(json_response['id'], package.id)

    def test_sort_by_publish_date(self):
        """Verify package API 'publish_date' sorting behavior.

        When this sort option is specified, the API should sort first by
        a package's upper bound, then by the precision of its range.
        """
        # We already have four packages in the database, each of which are one
        # day long. We need to add two more here with > 1 day duration to test
        # the range precision sorting.
        package_factory(
            publish_date_lower=tz.localize(datetime(2015, 5, 2)),
            publish_date_upper=tz.localize(datetime(2015, 5, 5)),
            slug_key='test-pkg-api-sbpd1'
        )
        package_factory(
            publish_date_lower=tz.localize(datetime(2015, 5, 3)),
            publish_date_upper=tz.localize(datetime(2015, 5, 5)),
            slug_key='test-pkg-api-sbpd2'
        )

        response = self.client.get(PACKAGES_API_ENDPOINT, data={
            'format': 'json', 'ordering': 'publish_date'})

        # Get the publish dates of the returned packages and make sure they
        # align with what we expect
        returned_dates = [
            x['publishDate'] for x in json.loads(response.content)['results']
        ]
        expected_dates = [
            [
                get_timestamp_for_date('2015-05-06'),
                get_timestamp_for_date('2015-05-07'),
            ],
            [
                get_timestamp_for_date('2015-05-05'),
                get_timestamp_for_date('2015-05-06'),
            ],
            [
                get_timestamp_for_date('2015-05-04'),
                get_timestamp_for_date('2015-05-05'),
            ],
            [
                get_timestamp_for_date('2015-05-03'),
                get_timestamp_for_date('2015-05-05'),
            ],
            [
                get_timestamp_for_date('2015-05-02'),
                get_timestamp_for_date('2015-05-05'),
            ],
            [
                get_timestamp_for_date('2015-05-03'),
                get_timestamp_for_date('2015-05-04'),
            ],
            [
                get_timestamp_for_date('2015-05-02'),
                get_timestamp_for_date('2015-05-03'),
            ]
        ]
        self.assertListEqual(returned_dates, expected_dates)

    def test_default_sort(self):
        """By default, packages API should order by 'publish_date'."""
        # Add additional packages with > 1 day duration to test range precision
        package_factory(
            publish_date_lower=datetime(2015, 5, 1),
            publish_date_upper=datetime(2015, 5, 4),
            slug_key='test-pkg-api-dst1'
        )
        package_factory(
            publish_date_lower=datetime(2015, 5, 2),
            publish_date_upper=datetime(2015, 5, 4),
            slug_key='test-pkg-api-dst2'
        )

        response_with_sort = self.client.get(
            PACKAGES_API_ENDPOINT,
            data={
                'format': 'json',
                'ordering': 'publish_date',
            }
        )
        response_no_sort = self.client.get(
            PACKAGES_API_ENDPOINT,
            data={'format': 'json'}
        )

        ids_with_sort = ','.join([
            str(_['id'])
            for _ in json.loads(response_with_sort.content)['results']
        ])

        ids_no_sort = ','.join([
            str(_['id'])
            for _ in json.loads(response_no_sort.content)['results']
        ])

        self.assertEqual(ids_with_sort, ids_no_sort)

    def test_searches_budget_lines(self):
        """Verify search query behavior.

        Searches should find packages based on both primary & additional
        content budget lines.
        """
        package = package_factory(slug_key='test-pkg-api-bg-line')
        item_factory(primary_for=package, budget_line='abcdefghij')
        item_factory(additional_for=package, budget_line='klmnopqrst')

        response = self.client.get(PACKAGES_API_ENDPOINT, data={
            'format': 'json',
            'search': 'abcdefghij'
        })
        json_response = json.loads(response.content)
        self.assertEqual(json_response['count'], 1)
        self.assertEqual(json_response['results'][0]['id'], package.pk)

        response = self.client.get(PACKAGES_API_ENDPOINT, data={
            'format': 'json',
            'search': 'klmnopqrst'
        })
        json_response = json.loads(response.content)
        self.assertEqual(json_response['count'], 1)
        self.assertEqual(json_response['results'][0]['id'], package.pk)

    def test_searches_slugs(self):
        """Verify search query behavior.

        Searches should find packages based on both primary & additional
        content slugs.
        """
        package = package_factory(slug_key='test-pkg-api-slugs')
        item_factory(primary_for=package)
        additional_item = item_factory(
            additional_for=package,
            slug_key='klmnopqrst'
        )

        response = self.client.get(PACKAGES_API_ENDPOINT, data={
            'format': 'json',
            'search': package.full_slug
        })
        json_response = json.loads(response.content)
        self.assertEqual(json_response['count'], 1)
        self.assertEqual(json_response['results'][0]['id'], package.pk)

        response = self.client.get(PACKAGES_API_ENDPOINT, data={
            'format': 'json',
            'search': additional_item.full_slug
        })
        json_response = json.loads(response.content)
        self.assertEqual(json_response['count'], 1)
        self.assertEqual(json_response['results'][0]['id'], package.pk)

    def test_searches_slug_keys(self):
        """Verify search query behavior.

        Searches should find packages based on both primary & additional
        content slug keys.
        """
        package = package_factory(slug_key='test-pkg-api-ssk')
        item_factory(primary_for=package)
        item_factory(additional_for=package, slug_key='klmnopqrst')

        response = self.client.get(PACKAGES_API_ENDPOINT, data={
            'format': 'json',
            'search': 'test-pkg-api-ssk'
        })
        json_response = json.loads(response.content)
        self.assertEqual(json_response['count'], 1)
        self.assertEqual(json_response['results'][0]['id'], package.pk)

        response = self.client.get(PACKAGES_API_ENDPOINT, data={
            'format': 'json',
            'search': 'klmnopqrst'
        })
        json_response = json.loads(response.content)
        self.assertEqual(json_response['count'], 1)
        self.assertEqual(json_response['results'][0]['id'], package.pk)

    def test_person_filter_on_primary_author(self):
        """Verify person filter behavior.

        Such filtering should return packages whose primary
        content has an 'author' whose email matches the search term.
        """
        package_with_primary = package_factory(slug_key='test-pkg-api-pfopa')
        item_factory(primary_for=package_with_primary, author='author@a.co')

        # Test matches on primary content author
        response = self.client.get(PACKAGES_API_ENDPOINT, data={
            'format': 'json',
            'person': 'author@a.co'
        })
        json_response = json.loads(response.content)
        self.assertEqual(json_response['count'], 1)
        self.assertEqual(json_response['results'][0]['id'],
                         package_with_primary.pk)

    def test_person_filter_on_primary_editor(self):
        """Verify person filter behavior.

        Such filtering should return packages whose primary
        content has an 'editor' whose email matches the search term.
        """
        package_with_primary = package_factory(slug_key='test-pkg-api-pfope')
        item_factory(primary_for=package_with_primary, editor='editor@a.co')

        response = self.client.get(PACKAGES_API_ENDPOINT, data={
            'format': 'json',
            'person': 'editor@a.co'
        })
        json_response = json.loads(response.content)
        self.assertEqual(json_response['count'], 1)
        self.assertEqual(json_response['results'][0]['id'],
                         package_with_primary.pk)

    def test_person_filter_on_additional_author(self):
        """Verify person filter behavior.

        Such filtering should return packages whose additional
        content has an 'author' whose email matches the search term.
        """
        package_with_additional = package_factory(
            slug_key='test-pkg-api-pfoaa'
        )
        item_factory(primary_for=package_with_additional)
        item_factory(additional_for=package_with_additional,
                     author='author@b.co')

        response = self.client.get(PACKAGES_API_ENDPOINT, data={
            'format': 'json',
            'person': 'author@b.co'
        })
        json_response = json.loads(response.content)
        self.assertEqual(json_response['count'], 1)
        self.assertEqual(json_response['results'][0]['id'],
                         package_with_additional.pk)

    def test_person_filter_on_additional_editor(self):
        """Verify person filter behavior.

        Such filtering should return packages whose additional
        content has an 'editor' whose email matches the search term.
        """
        package_with_additional = package_factory(
            slug_key='test-pkg-api-pfoae'
        )
        item_factory(primary_for=package_with_additional)
        item_factory(additional_for=package_with_additional,
                     editor='editor@b.co')

        response = self.client.get(PACKAGES_API_ENDPOINT, data={
            'format': 'json',
            'person': 'editor@b.co'
        })
        json_response = json.loads(response.content)
        self.assertEqual(json_response['count'], 1)
        self.assertEqual(json_response['results'][0]['id'],
                         package_with_additional.pk)

    def test_has_primary_filter_on(self):
        """Verify has_primary filter behavior.

        Such filtering should exclude packages that don't have primary
        content items when the search value is 1.
        """
        package = package_factory(slug_key='test-pkg-api-hpf-on')
        response = self.client.get(PACKAGES_API_ENDPOINT, {
            'format': 'json',
            'has_primary': '0'
        })
        json_response = json.loads(response.content)
        self.assertEqual(json_response['count'], 1)
        self.assertEqual(json_response['results'][0]['id'], package.pk)

    def test_has_primary_filter_off(self):
        """Verify has_primary filter behavior.

        Such filtering should only include packages without primary
        content items when the search value is 0.
        """
        package_factory(slug_key='test-pkg-api-hpf-off')
        response = self.client.get(PACKAGES_API_ENDPOINT, {
            'format': 'json',
            'has_primary': '1'
        })
        json_response = json.loads(response.content)
        # Should only return the 5 items setup in setUpTestData
        self.assertEqual(json_response['count'], 5)

    def test_has_primary_filter_invalid(self):
        """Verify has_primary filter behavior.

        Such filtering should return an empty queryset when passed an
        invalid value.
        """
        package_factory(slug_key='test-pkg-api-hpf-inv')
        response = self.client.get(PACKAGES_API_ENDPOINT, {
            'format': 'json',
            'has_primary': 'x'
        })
        json_response = json.loads(response.content)
        self.assertEqual(json_response['count'], 0)


# @override_settings(ROOT_URLCONF='budget.test_urls')
class PrintPublicationAPITestCase(AuthedApiTestMixin, TestCase):
    multi_db = separate_db

    @classmethod
    def setUpTestData(cls):
        """Shared constructor behavior.

        Create multiple publications with multiple sections each, so
        that we can spot unnecessary queries on ForeignKey fields.
        """
        tdmn = PrintPublication.objects.create(name='The Dallas Morning News')
        PrintSection.objects.create(name='News', publication=tdmn)
        PrintSection.objects.create(name='Sports', publication=tdmn)
        PrintSection.objects.create(name='Inactive', publication=tdmn,
                                    is_active=False)
        al_dia = PrintPublication.objects.create(name='Al Dia')
        PrintSection.objects.create(name='News', publication=al_dia)
        PrintSection.objects.create(name='Sports', publication=al_dia)

    def test_query_count(self):
        """Verify prefetching behavior precludes additional queries.

        Extra queries shouldn't occur for foreign-keyed fields because
        the view should pre-fetch
        """
        with self.assertNumQueries(3, using=budget_db):
            self.client.get(PUBLICATION_API_ENDPOINT, data={'format': 'json'})

    def test_publication_active_filter(self):
        """Verify publication_active filter behavior.

        Such filtering should exclude/include publications based on
        their is_active value.
        """
        inactive = PrintPublication.objects.create(name='Inactive',
                                                   is_active=False)

        # We alredy have two active pubs from setUpTestData, so make sure they
        # show here
        response = self.client.get(PUBLICATION_API_ENDPOINT, {
            'format': 'json',
            'publication_active': '1'
        })
        json_response = json.loads(response.content)
        self.assertEqual(json_response['count'], 2)

        response = self.client.get(PUBLICATION_API_ENDPOINT, {
            'format': 'json',
            'publication_active': '0'
        })
        json_response = json.loads(response.content)
        self.assertEqual(json_response['count'], 1)
        self.assertEqual(json_response['results'][0]['id'], inactive.pk)


# @override_settings(ROOT_URLCONF='budget.test_urls')
class AuditTrailApiMixinTestCase(AuthedApiTestMixin, TestCase):
    """Ensure our mixin auto-adds user info & creates Change models."""
    multi_db = separate_db

    @classmethod
    def setUpTestData(cls):
        staff_factory()

    def setUp(self):
        self.creator = User.objects.create_user('user')
        self.client = APIClient()
        self.client.force_authenticate(user=self.creator)

    def test_user_saved_on_package_create(self):
        """Verify user info is stored on package save.

        Packages created via the API should have their created_by
        attribute set to the currently-authed user.
        """
        response = self.client.post(
            '%s?format=json' % PACKAGES_API_ENDPOINT,
            json.dumps({
                'hub': 'hub',
                'publishDate': [
                    get_timestamp_for_date('2016-08-18'),
                    get_timestamp_for_date('2016-08-19'),
                ],
                'slugKey': 'test-audit-usopc'
            }),
            content_type='application/json'
        )

        json_response = json.loads(response.content)
        self.assertEqual(response.status_code, 201)

        package = Package.objects.get(pk=json_response['id'])
        self.assertEqual(package.created_by, self.creator.pk)
        self.assertEqual(package.created_by_user, self.creator)

    def test_change_created_on_package_update(self):
        """Verify creation of Change model instance on package update.

        When a package is updated via the API, a change model should be
        created to reflect this modification.
        """
        package = package_factory(slug_key='test-audit-ccopu')

        response = self.client.patch(
            '%s%s/?format=json' % (PACKAGES_API_ENDPOINT, package.pk,),
            json.dumps({
                'publishedUrl': 'http://example.com/',
            }),
            content_type='application/json'
        )
        self.assertEqual(response.status_code, 200)

        change = Change.objects.get(
            item_id=package.pk,
            item_content_type='package'
        )
        self.assertEqual(change.package, package)
        self.assertEqual(change.by, self.creator.pk)

    def test_user_saved_on_item_create(self):
        """Verify user info is stored on item save.

        Item created via the API should have their created_by attribute
        set to the currently-authed user.
        """
        package = package_factory(slug_key='test-audit-usoic')

        response = self.client.post(
            '%s?format=json' % ITEMS_API_ENDPOINT,
            json.dumps({
                'hub': 'hub',
                'slugKey': 'slug',
                'budgetLine': 'Budget line',
                'authors': [{'name': 'Name'}],
                'primaryForPackage': package.pk
            }),
            content_type='application/json'
        )
        json_response = json.loads(response.content)
        self.assertEqual(response.status_code, 201)

        item = Item.objects.get(pk=json_response['id'])
        self.assertEqual(item.created_by, self.creator.pk)
        self.assertEqual(item.created_by_user, self.creator)

    def test_change_created_on_primary_item_update(self):
        """Verify creation of Change instance on primary item update.

        When a primary content item is updated via the API, a change
        model should be created to reflect this modification.
        """
        package = package_factory(slug_key='test-audit-ccopiu')
        item = item_factory(primary_for=package)

        response = self.client.patch(
            '%s%s/?format=json' % (ITEMS_API_ENDPOINT, item.pk,),
            json.dumps({
                'budgetLine': 'Updated budget line',
            }),
            content_type='application/json'
        )
        self.assertEqual(response.status_code, 200)

        change = Change.objects.get(
            item_id=item.pk,
            item_content_type='item'
        )
        self.assertEqual(change.package, package)
        self.assertEqual(change.by, self.creator.pk)

    def test_change_created_on_addl_item_update(self):
        """Verify creation of Change instance on additional item update.

        When an additional content item is updated via the API, a change
        model should be created to reflect this modification.
        """
        package = package_factory(slug_key='test-audit-ccoaiu')
        item_factory(primary_for=package)
        additional_item = item_factory(additional_for=package)

        response = self.client.patch(
            '%s%s/?format=json' % (ITEMS_API_ENDPOINT, additional_item.pk,),
            json.dumps({
                'budgetLine': 'Updated budget line',
            }),
            content_type='application/json'
        )
        self.assertEqual(response.status_code, 200)

        change = Change.objects.get(
            item_id=additional_item.pk,
            item_content_type='item'
        )
        self.assertEqual(change.package, package)
        self.assertEqual(change.by, self.creator.pk)
