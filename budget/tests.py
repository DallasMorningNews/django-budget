# Imports from python.  # NOQA
# from datetime import date
from datetime import datetime
from datetime import timedelta
import json
from unittest import skipUnless


# Imports from Django.
from django.contrib.auth.models import AnonymousUser
from django.contrib.auth.models import User
from django.core.exceptions import ValidationError
from django.db import connections
from django.db.utils import ConnectionDoesNotExist
from django.test import override_settings
from django.test import SimpleTestCase
from django.test import TestCase
from django.utils import timezone
from django.utils.timezone import make_aware


# Imports from other dependencies.
from editorial_staff.models import Hub
from editorial_staff.models import Vertical
# from psycopg2.extras import DateRange
from psycopg2.extras import DateTimeTZRange
from rest_framework.test import APIClient
import six


# Imports from budget.
from budget.models import Change
from budget.models import Headline
from budget.models import HeadlineVote
from budget.models import Item
from budget.models import Package
from budget.models import PrintPublication
from budget.models import PrintSection
from budget.utils import alphacode
from budget.utils import slug_date_to_range
from budget.validators import hub_exists


tz = timezone.get_default_timezone()

# Figure out which database we should use to check query counts
try:
    connections['budget'].cursor()
    separate_db = True
    budget_db = 'budget'
except ConnectionDoesNotExist:
    separate_db = False
    budget_db = 'default'


PACKAGES_API_ENDPOINT = '/api/packages/'
PUBLICATION_API_ENDPOINT = '/api/print-publications/'
ITEMS_API_ENDPOINT = '/api/items/'


###################
# Model factories #
###################


def staff_factory(hub='hub'):
    vertical, created = Vertical.objects.get_or_create(
        slug='vertical',
        name='vertical'
    )

    Hub.objects.get_or_create(
        slug=hub,
        name=hub,
        vertical=vertical
    )


def package_factory(publish_date_lower=tz.localize(datetime(2015, 5, 1)),
                    publish_date_upper=tz.localize(datetime(2015, 5, 2)),
                    print_run_date=None, slug_key='overall-slug'):
    staff_factory()

    return Package.objects.create(
        hub='hub',
        published_url='http://dallasnews.com/story/',
        notes='Notes field',
        publish_date=DateTimeTZRange(lower=publish_date_lower,
                                     upper=publish_date_upper),
        # print_run_date=print_run_date,
        slug_key=slug_key
    )


def item_factory(primary_for=None, additional_for=None, item_type='text',
                 author='a@d.com', editor='e@d.com', slug_key='sluggy-slug',
                 budget_line='Budget line'):
    return Item.objects.create(
        slug_key=slug_key,
        type=item_type,
        editors=[{'email': editor}],
        authors=[{'email': author}],
        budget_line=budget_line,
        primary_for_package=primary_for,
        additional_for_package=additional_for
    )


def get_timestamp_for_date(raw_iso_date):
    return tz.localize(
        datetime.strptime(
            raw_iso_date,
            '%Y-%m-%d'
        )
    ).astimezone(timezone.utc).strftime('%Y-%m-%dT%H:%M:%SZ')


class AuthedApiTestMixin(TestCase):
    """Store an authed API request client on the instance we can use to test
    our API"""
    def setUp(self):
        super(AuthedApiTestMixin, self).setUp()
        user = User.objects.create_user('user')
        self.client = APIClient()
        self.client.force_authenticate(user=user)


###############
# Model tests #
###############


class PrintPublicationTestCase(SimpleTestCase):
    def test_str(self):
        """Should return publication name with (inactive) appended if the pub
        is not active"""
        pub = PrintPublication(name='TDMN', slug='tdmn', priority=1)
        self.assertEqual(str(pub), 'TDMN')

        pub.is_active = False
        self.assertEqual(str(pub), 'TDMN (inactive)')


class PrintSectionTestCase(TestCase):
    multi_db = separate_db

    @classmethod
    def setUpTestData(cls):
        cls.pub = PrintPublication.objects.create(name='TDMN')

    def test_str_active(self):
        """String representation should be section name with pub name"""
        section = PrintSection.objects.create(name='News',
                                              publication=self.pub)
        self.assertEqual(str(section), 'TDMN > News')

    def test_str_section_inactive(self):
        """String representation should show inactive flag when section is
        inactive"""
        section = PrintSection.objects.create(name='News', is_active=False,
                                              publication=self.pub)
        self.assertEqual(str(section), 'TDMN > News (inactive)')

    def test_str_publication_inactive(self):
        """String representation should show inactive flag when publication is
        inactive"""
        self.pub.is_active = False
        section = PrintSection.objects.create(name='News',
                                              publication=self.pub)
        self.assertEqual(str(section), 'TDMN > News (inactive)')


class HeadlineTestCase(TestCase):
    multi_db = separate_db

    def test_str(self):
        """Should return headline's text as string representation"""
        hed = Headline(
            package=package_factory(slug_key='test-hed-str'),
            text='A headline'
        )
        self.assertEqual(str(hed), 'A headline')

    def test_total_votes(self):
        """total_votes() should return latest total for headline votes"""
        hed = Headline.objects.create(
            package=package_factory(slug_key='test-hed-tv'),
            text='A headline'
        )
        for _ in range(5):
            HeadlineVote.objects.create(headline=hed, voter='a%s@b.com' % _)
        self.assertEqual(hed.total_votes(), 5)


class HeadlineVoteTestCase(TestCase):
    multi_db = separate_db

    def test_str(self):
        """Show voter and vote in string representation"""
        hed = Headline(
            package=package_factory(slug_key='test-hedvote-str'),
            text='A headline'
        )
        vote = HeadlineVote(headline=hed, voter='a@b.com')
        self.assertEqual(str(vote), 'a@b.com for A headline')


class PackageTestCase(TestCase):
    multi_db = separate_db

    def test_str(self):
        """Should show generated slug as string representation"""
        slug_key = 'my-test'
        package = package_factory(slug_key=slug_key)
        self.assertEqual(str(package), 'hub.{}.050115'.format(slug_key))

    def test_package_slug_creation(self):
        """Package's 'slug_key' should be reflected in its full_slug
        model property"""
        slug_key = 'test-key-one'
        package = package_factory(slug_key=slug_key)
        self.assertEqual(
            package.full_slug,
            'hub.{}.050115'.format(slug_key)
        )

    def test_publish_date_resolution_inference(self):
        """publish_date_resolution should accurately infer date precision based
        on the publish_date range field"""
        start_date = datetime(2015, 5, 1)

        staff_factory()

        time_resolution = Package.objects.create(
            publish_date=DateTimeTZRange(lower=start_date,
                                         upper=datetime(2015, 5, 1, 0, 1)),
            hub='hub')
        self.assertEqual(time_resolution.publish_date_resolution(), 't')

        day_resolution = Package.objects.create(
            publish_date=DateTimeTZRange(lower=start_date,
                                         upper=datetime(2015, 5, 2)),
            hub='hub')
        self.assertEqual(day_resolution.publish_date_resolution(), 'd')

        week_resolution = Package.objects.create(
            publish_date=DateTimeTZRange(lower=start_date,
                                         upper=datetime(2015, 5, 8)),
            hub='hub')
        self.assertEqual(week_resolution.publish_date_resolution(), 'w')

        month_resolution = Package.objects.create(
            publish_date=DateTimeTZRange(lower=start_date,
                                         upper=datetime(2015, 6, 1)),
            hub='hub')
        self.assertEqual(month_resolution.publish_date_resolution(), 'm')


class ItemTestCase(TestCase):
    multi_db = separate_db

    def test_primary_item_slug(self):
        """Primary item's slug should be equal to the slug of its parent
        package object"""
        package = package_factory(slug_key='test-item-pis')
        primary_item = item_factory(primary_for=package)
        self.assertEqual(primary_item.full_slug, package.full_slug)

    def test_additional_item_slug(self):
        """Additional item's slug should be the concatenation of its parent
        package's slug and the individual item's slug key"""
        slug_key = 'my-test-content'
        package = package_factory(slug_key='test-item-ais')
        additional_item = item_factory(
            additional_for=package,
            slug_key=slug_key
        )
        self.assertEqual(
            additional_item.full_slug,
            '{}.{}'.format(package.full_slug, slug_key)
        )

    def test_duplicate_additional_item_slug(self):
        """If saving multiple additional items to a package, and those items
        have the same slug key, expect an IntegrityError for."""
        slug_key = 'my-test-content'
        package = package_factory(slug_key='test-item-dais')
        item_factory(
            additional_for=package,
            slug_key=slug_key
        )
        self.assertEqual(package.additional_content.count(), 1)
        self.assertEqual(
            package.additional_content.all()[0].slug_key,
            slug_key
        )
        with self.assertRaises(ValidationError):
            next_item = Item(
                slug_key=slug_key,
                type='text',
                editors=[{'email': 'e@d.com'}],
                authors=[{'email': 'a@d.com'}],
                budget_line='Budget line',
                primary_for_package=None,
                additional_for_package=package
            )
            next_item.validate_unique()

    def test_generate_date_slug_no_day(self):
        """If the publish_date doesn't have at least day precision, exclude
        day of month from the date slug"""
        week_resolution = package_factory(
            publish_date_lower=make_aware(datetime(2015, 5, 1)),
            publish_date_upper=make_aware(datetime(2015, 5, 8)),
            slug_key='test-item-gdsnd'
        )
        self.assertEqual(week_resolution.slugified_date, '05--15')

    def test_generate_date_slug_with_day(self):
        """if the publish_date is day-precise or better, generate a date slug
        with MMDDYY"""
        day_resolution = package_factory(
            publish_date_lower=make_aware(datetime(2015, 5, 1)),
            publish_date_upper=make_aware(datetime(2015, 5, 2)),
            slug_key='test-item-gdswd'
        )
        self.assertEqual(day_resolution.slugified_date, '050115')

        time_resolution = package_factory(
            publish_date_lower=make_aware(datetime(2015, 5, 1, 11)),
            publish_date_upper=make_aware(datetime(2015, 5, 2, 11, 1)),
            slug_key='test-item-gdswdat'
        )
        self.assertEqual(time_resolution.slugified_date, '050115')

    def test_primary_or_additional_required(self):
        """Raise a ValidationError if primary or additional aren't set"""
        with six.assertRaisesRegex(
            self,
            ValidationError,
            "Items must be connected to a package"
        ):
            item = Item(slug_key='sluggy-slug', type='text',
                        budget_line='Budget line')
            item.clean()

    def test_primary_and_additional_raise_error(self):
        """Raise a ValidationError if primary and additional are both set"""
        with six.assertRaisesRegex(
            self,
            ValidationError,
            "Items cannot be connected to a package as both"
        ):
            package_one = package_factory(slug_key='test-item-tpaare1')
            package_two = package_factory(slug_key='test-item-tpaare2')
            item = Item(slug_key='sluggy-slug', type='text',
                        budget_line='Budget line',
                        primary_for_package=package_one,
                        additional_for_package=package_two)
            item.clean()


class ChangeTestCase(TestCase):
    multi_db = separate_db

    @classmethod
    def setUpTestData(cls):
        cls.item = item_factory(
            primary_for=package_factory(slug_key='test-change')
        )
        cls.user = User.objects.create_user('user')
        cls.change = Change.objects.create(
            by=cls.user.pk,
            package=cls.item.primary_for_package,
            item_content_type='item',
            item_id=cls.item.pk
        )

    def test_str(self):
        """String method should include user, package and timestamp"""
        self.assertEqual(
            str(self.change),
            'User {} changed {} at {}.'.format(
                self.user.pk,
                str(self.item),
                self.change.at
            )
        )

    def test_item(self):
        """item property should load the change's item instance"""
        self.assertEqual(self.change.item, self.item)

    def test_item_missing(self):
        """If the Item model is missing, item should return None"""
        self.item.delete()
        change = Change.objects.get(pk=self.change.pk)
        self.assertIsNone(change.item)

    def test_item_cache(self):
        """A second call to the item property should load from model's cache"""
        change = Change.objects.get(pk=self.change.pk)

        with self.assertNumQueries(1, using=budget_db):
            change.item

        with self.assertNumQueries(0, using=budget_db):
            change.item

    def test_user(self):
        """user property should load the change's user instance"""
        self.assertEqual(self.change.by_user, self.user)

    def test_user_cache(self):
        """A second call to the user property should load from model's cache"""
        change = Change.objects.get(pk=self.change.pk)

        with self.assertNumQueries(1, using='default'):
            change.by_user

        with self.assertNumQueries(0, using='default'):
            change.by_user

    def test_user_missing(self):
        """If the User model is missing, by_user should return None"""
        self.user.delete()
        change = Change.objects.get(pk=self.change.pk)
        self.assertIsNone(change.by_user)


class ChangeQuerysetTestCase(TestCase):
    multi_db = separate_db

    @classmethod
    def setUpTestData(cls):
        cls.user = User.objects.create_user('user')
        package = package_factory(slug_key='test-cqs')
        item = item_factory(primary_for=package)

        for _ in range(0, 5):
            Change.objects.create(
                by=cls.user.pk,
                package=package,
                item_content_type='package',
                item_id=package.pk
            )
            Change.objects.create(
                by=cls.user.pk,
                package=package,
                item_content_type='item',
                item_id=item.pk
            )

    @skipUnless(separate_db, 'Multiple databases required to test counts')
    def test_query_count(self):
        """Ensure that duplicate queries are eliminated when prefetching users
        and items"""
        # Control tests
        # Expect 21 total queries:
        # - 1 to get Changes
        # - 1x10 to get each related item
        # - 1x10 to get each related user
        with self.assertNumQueries(11, using='budget'), \
                self.assertNumQueries(10, using='default'):
            for _ in Change.objects.all().select_related('package'):
                _.item
                _.by_user

        # Test against both default and budget DBs because we're loading users
        # Expect four total queries:
        # - 1 to budget to get Changes
        # - 1 to budget to get related Items
        # - 1 to budget to get related Packages
        # - 1 to default to get related users
        with self.assertNumQueries(3, using='budget'), \
                self.assertNumQueries(1, using='default'):
            for _ in Change.objects.all().select_related('package').\
                    prefetch_related('by_user', 'item'):
                _.item
                _.by_user

    def test_empty_queryset(self):
        """Our custom queryset should be able to return empty querysets"""
        self.assertEqual(len(Change.objects.filter(by=10000)), 0)

    def test_values_query(self):
        """Our custom queryset should tolearte queries that don't return model
        instances"""
        user_ids = Change.objects.all().values('by')
        expect = [{'by': self.user.pk} for x in range(0, 10)]
        self.assertListEqual(list(user_ids), list(expect))


class CreationTrailTestCase(TestCase):
    """Tests for our abstract base class that adds a created_by and created_at
    fields. All tests use the Package model, but this class is mixed in to
    almost all budget models."""
    multi_db = separate_db

    def test_created_by_user(self):
        """created_by_user should load the user model from the database"""
        user = User.objects.create_user('user')

        package = package_factory(slug_key='test-cr-trl-cbu')
        package.created_by = user.pk
        package.save()

        self.assertEqual(package.created_by_user, user)

    def test_created_by_user_none(self):
        """created_by_user should return AnonymousUser if created_by is None"""
        package = package_factory(slug_key='test-cr-trl-cbun')
        self.assertEqual(package.created_by_user, AnonymousUser)

    def test_created_by_user_missing(self):
        """created_by_user should return None if User doesn't exist"""
        package = package_factory(slug_key='test-cr-trl-cbum')
        package.created_by = 5000
        package.save()

        self.assertEqual(package.created_by_user, None)


##################
# REST API tests #
##################

@override_settings(ROOT_URLCONF='budget.test_urls')
class CommonAPITestCase(AuthedApiTestMixin, TestCase):
    """Tests for shared (or potentially shareable) logic from our API. Includes
    tests for custom serializers, filters, etc."""
    multi_db = separate_db

    @classmethod
    def setUpTestData(cls):
        for _ in range(5):
            package_slug = 'test-package-{}'.format(_)
            item_factory(primary_for=package_factory(slug_key=package_slug))

    def test_invalid_publish_date_filter(self):
        """When invalid params are passed in the publish_date filter an empty
        queryset should be returned. Tests the packages API endoint, but really
        we're checking all endpoints that use our shared parsing/validation
        decorator (budget.filters.daterange_filter_decorator)."""
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
        """Date queries should perform time zone-aware queries in local time"""
        query = {'format': 'json', 'publish_date': '2015-04-30,2015-05-01'}
        response = self.client.get(PACKAGES_API_ENDPOINT, data=query)
        self.assertEqual(json.loads(response.content)['count'], 0)

        query = {'format': 'json', 'publish_date': '2015-05-02,2015-05-03'}
        response = self.client.get(PACKAGES_API_ENDPOINT, data=query)
        self.assertEqual(json.loads(response.content)['count'], 0)

    def test_read_from_daterange_field(self):
        """Range field should serialize as two ISO-8601 dates in an array"""
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
        """Valid ISO-8601 dates passed in a range field should be parsed and
        stored"""
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
            'publishDate': ['Datetime has wrong format. Use one of these \
formats instead: YYYY-MM-DDThh:mm[:ss[.uuuuuu]][+HH:MM|-HH:MM|Z].']
        }
        self.assertJSONEqual(response.content, error)

    def test_write_invalid_date_count_to_daterange_field(self):
        """Passing too few dates to a DateTimeRangeField raises a validation
        error"""
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
        """Passing a date range where the lower is greater than the upper
        raises an error"""
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
            'publishDate': ['The upper date bound must be greater than the \
lower bound.']
        }
        self.assertJSONEqual(response.content, error)

    def test_empty_json_serializer(self):
        """When serialized with our custom EmptyArrayJsonField, nulls should be
        serialized as empty arrays"""
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


@override_settings(ROOT_URLCONF='budget.test_urls')
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
        """Only make two queries to the budget DB for an item list view"""
        with self.assertNumQueries(2, using=budget_db):
            self.client.get(ITEMS_API_ENDPOINT, data={'format': 'json'})

    def test_person_filter(self):
        """The person filter should search both the author and editor fields"""
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
        """The author field should return items based on author's e-mail"""
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
        """The editor field should return items based on editor's e-mail"""
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
        """Publish date filter should return items based on primary/additional
        package's publish date"""
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


@override_settings(ROOT_URLCONF='budget.test_urls')
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
        """Only make four queries to the budget DB for a package list view"""
        with self.assertNumQueries(5, using=budget_db):
            self.client.get(PACKAGES_API_ENDPOINT, data={'format': 'json'})

    def test_publish_date_filter(self):
        """A comma-separated publish_date param should perform a range query on
        publish_date"""
        # We create one package per day in the setup, so number of days in
        # the range should equal number of packages
        query = {'format': 'json', 'publish_date': '2015-05-02,2015-05-03'}
        response = self.client.get(PACKAGES_API_ENDPOINT, data=query)
        self.assertEqual(json.loads(response.content)['count'], 1)

        query['publish_date'] = '2015-05-02,2015-05-05'
        response = self.client.get(PACKAGES_API_ENDPOINT, data=query)
        self.assertEqual(json.loads(response.content)['count'], 3)

    # def test_print_date_filter(self):
    #     """A comma-separated print_date param should perform a range query on
    #     print_run_date"""
    #     package_factory(
    #         print_run_date=DateRange(
    #             lower=date(2015, 5, 3),
    #             upper=date(2015, 5, 4)
    #         ),
    #         slug_key='test-pkg-api-pdf'
    #     )
    #
    #     query = {
    #         'format': 'json',
    #         'print_run_date': '2015-05-03,2015-05-04'
    #     }
    #     response = self.client.get(PACKAGES_API_ENDPOINT, data=query)
    #     self.assertEqual(json.loads(response.content)['count'], 1)

    def test_get_by_slug(self):
        """The package detail view should allow GETing by slug"""
        package = package_factory(slug_key='test-pkg-api-gbs')

        url = '%s%s/' % (PACKAGES_API_ENDPOINT, package.full_slug)
        response = self.client.get(url, data={'format': 'json'})
        self.assertEqual(response.status_code, 200)

        json_response = json.loads(response.content)
        self.assertEqual(json_response['id'], package.id)

    def test_get_by_id(self):
        """The package detail view should allow GETing by ID (traditional
        behavior)"""
        package = package_factory(slug_key='test-pkg-api-gbid')

        url = '%s%s/' % (PACKAGES_API_ENDPOINT, package.pk)
        response = self.client.get(url, data={'format': 'json'})
        self.assertEqual(response.status_code, 200)

        json_response = json.loads(response.content)
        self.assertEqual(json_response['id'], package.id)

    def test_sort_by_publish_date(self):
        """publish_date should sort by upper bound, then by range precision"""
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
        """publish_date should be the default ordering"""
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

    # def test_sort_by_print_run_date(self):
    #     """print_run_date should sort by upper bound, then by range
    #     precision"""
    #     package_factory(
    #         slug_key='test-one',
    #         print_run_date=DateRange(
    #             lower=date(2015, 5, 1),
    #             upper=date(2015, 5, 3)
    #         )
    #     )
    #     package_factory(
    #         slug_key='test-two',
    #         print_run_date=DateRange(
    #             lower=date(2015, 5, 1),
    #             upper=date(2015, 5, 2)
    #         )
    #     )
    #     package_factory(
    #         slug_key='test-three',
    #         print_run_date=DateRange(
    #             lower=date(2015, 5, 2),
    #             upper=date(2015, 5, 3)
    #         )
    #     )
    #
    #     response = self.client.get(
    #         PACKAGES_API_ENDPOINT,
    #         data={
    #             'format': 'json',
    #             'ordering': 'print_run_date',
    #             'print_run_date': '2015-05-01,2015-05-04'
    #         }
    #     )
    #
    #     # Get the publish dates of the returned packages and make sure they
    #     # align with what we expect
    #     returned_dates = [
    #         x['printRunDate']
    #         for x in json.loads(response.content)['results']
    #     ]
    #
    #     expected_dates = [
    #         ['2015-05-02', '2015-05-03'],
    #         ['2015-05-01', '2015-05-03'],
    #         ['2015-05-01', '2015-05-02']
    #     ]
    #     self.assertListEqual(returned_dates, expected_dates)

    def test_searches_budget_lines(self):
        """Search queries should find packages based on both primary and
        additional content budget lines"""
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
        """Search queries should find packages based on both primary and
        additional content slugs"""
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
        """Search queries should find packages based on both primary and
        additional content slug keys"""
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
        """Querying with the person filter should return package with primary
        content with matching author"""
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
        """Querying with the person filter should return package with primary
        content with matching editor"""
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
        """Querying with the person filter should return package with
        additional content with matching author"""
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
        """Querying with the person filter should return package with
        additional content with matching editor"""
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
        """has_primary filter should exclude packages without primary content
        items when set to 1"""
        package = package_factory(slug_key='test-pkg-api-hpf-on')
        response = self.client.get(PACKAGES_API_ENDPOINT, {
            'format': 'json',
            'has_primary': '0'
        })
        json_response = json.loads(response.content)
        self.assertEqual(json_response['count'], 1)
        self.assertEqual(json_response['results'][0]['id'], package.pk)

    def test_has_primary_filter_off(self):
        """has_primary filter should only include packages without primary
        content items when set to 0"""
        package_factory(slug_key='test-pkg-api-hpf-off')
        response = self.client.get(PACKAGES_API_ENDPOINT, {
            'format': 'json',
            'has_primary': '1'
        })
        json_response = json.loads(response.content)
        # Should only return the 5 items setup in setUpTestData
        self.assertEqual(json_response['count'], 5)

    def test_has_primary_filter_invalid(self):
        """has_primary filter should return an empty queryset when passed an
        invalid value"""
        package_factory(slug_key='test-pkg-api-hpf-inv')
        response = self.client.get(PACKAGES_API_ENDPOINT, {
            'format': 'json',
            'has_primary': 'x'
        })
        json_response = json.loads(response.content)
        self.assertEqual(json_response['count'], 0)


@override_settings(ROOT_URLCONF='budget.test_urls')
class PrintPublicationAPITestCase(AuthedApiTestMixin, TestCase):
    multi_db = separate_db

    @classmethod
    def setUpTestData(cls):
        """Add multiple pubs with multipe sections each so we can spot
        unnecessary queries on ForeignKey fields"""
        tdmn = PrintPublication.objects.create(name='The Dallas Morning News')
        PrintSection.objects.create(name='News', publication=tdmn)
        PrintSection.objects.create(name='Sports', publication=tdmn)
        PrintSection.objects.create(name='Inactive', publication=tdmn,
                                    is_active=False)
        al_dia = PrintPublication.objects.create(name='Al Dia')
        PrintSection.objects.create(name='News', publication=al_dia)
        PrintSection.objects.create(name='Sports', publication=al_dia)

    def test_query_count(self):
        """Extra queries shouldn't occur for foreign-keyed fields because
        the view should pre-fetch"""
        with self.assertNumQueries(3, using=budget_db):
            self.client.get(PUBLICATION_API_ENDPOINT, data={'format': 'json'})

    def test_publication_active_filter(self):
        """publication_active filter should exclucde/include publications
        based on their is_active flag"""
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


@override_settings(ROOT_URLCONF='budget.test_urls')
class AuditTrailApiMixinTestCase(AuthedApiTestMixin, TestCase):
    """Test our mixin that auto-adds user info and creates Change models"""
    multi_db = separate_db

    @classmethod
    def setUpTestData(cls):
        staff_factory()

    def setUp(self):
        self.creator = User.objects.create_user('user')
        self.client = APIClient()
        self.client.force_authenticate(user=self.creator)

    def test_user_saved_on_package_create(self):
        """Packages created by API should have created_by set to authed user"""
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
        """A change model should be created when packages are updated by API"""
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
        """Items created by API should have created_by set to authed user"""
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
        """A change model should be created when items are updated by API"""
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
        """A change model should be created when items are updated by API"""
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


######################
# Misc. helper tests #
######################

class SlugDateToRangeTestCase(SimpleTestCase):
    def test_single_day_range(self):
        """Method being tested should turn a single-day formatted slug date
        (such as '050115') into a 1-day date range, with correct time zones"""
        slug_date = '090115'
        actual_range = slug_date_to_range(slug_date)

        intended_range = DateTimeTZRange(
            lower=make_aware(datetime(2015, 9, 1)),
            upper=make_aware(datetime(2015, 9, 2))
        )
        self.assertEqual(intended_range, actual_range)

    def test_multiple_day_range(self):
        """Method being tested should turn a multi-day formatted slug date
        (such as '05--15') into a month date range, with correct time zones"""
        # 28-day month
        feb_slug_date = '02--15'
        feb_actual_range = slug_date_to_range(feb_slug_date)

        feb_intended_range = DateTimeTZRange(
            lower=make_aware(datetime(2015, 2, 1)),
            upper=make_aware(datetime(2015, 3, 1))
        )
        self.assertEqual(feb_intended_range, feb_actual_range)

        # 29-day month
        leap_slug_date = '02--16'
        leap_actual_range = slug_date_to_range(leap_slug_date)

        leap_intended_range = DateTimeTZRange(
            lower=make_aware(datetime(2016, 2, 1)),
            upper=make_aware(datetime(2016, 3, 1))
        )
        self.assertEqual(leap_intended_range, leap_actual_range)

        # 30-day month
        sept_slug_date = '09--15'
        sept_actual_range = slug_date_to_range(sept_slug_date)

        sept_intended_range = DateTimeTZRange(
            lower=make_aware(datetime(2015, 9, 1)),
            upper=make_aware(datetime(2015, 10, 1))
        )
        self.assertEqual(sept_intended_range, sept_actual_range)

        # 31-day month
        oct_slug_date = '10--15'
        oct_actual_range = slug_date_to_range(oct_slug_date)

        oct_intended_range = DateTimeTZRange(
            lower=make_aware(datetime(2015, 10, 1)),
            upper=make_aware(datetime(2015, 11, 1))
        )
        self.assertEqual(oct_intended_range, oct_actual_range)


class UtilsTestCase(SimpleTestCase):
    def test_alpha_code_generator(self):
        """Integers should be transformed into alphas. Ex: 1 = a, 27 = aa"""
        self.assertEqual(alphacode(1), 'a')
        self.assertEqual(alphacode(26), 'z')
        self.assertEqual(alphacode(27), 'aa')
        self.assertEqual(alphacode(53), 'ba')


class ValidatorTestCase(TestCase):
    def test_hub_exists(self):
        """Should throw ValidationError if passed slug for a nonexistent hub"""
        with self.assertRaises(ValidationError):
            hub_exists('not-a-hub')
