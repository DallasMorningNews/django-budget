# Imports from python.  # NOQA
from datetime import datetime
from unittest import skipUnless


# Imports from Django.
from django.contrib.auth.models import AnonymousUser
from django.contrib.auth.models import User
from django.core.exceptions import ValidationError
from django.test import SimpleTestCase
from django.test import TestCase
from django.utils.timezone import make_aware


# Imports from other dependencies.
from psycopg2.extras import DateTimeTZRange
import six


# Imports from budget.
from budget.models import Change
from budget.models import Headline
from budget.models import HeadlineVote
from budget.models import Item
from budget.models import Package
from budget.models import PrintPublication
from budget.models import PrintSection
from budget.tests.utils import budget_db
from budget.tests.utils import item_factory
from budget.tests.utils import package_factory
from budget.tests.utils import separate_db
from budget.tests.utils import staff_factory


__all__ = [
    'PrintPublicationTestCase',
    'PrintSectionTestCase',
    'HeadlineTestCase',
    'HeadlineVoteTestCase',
    'PackageTestCase',
    'ItemTestCase',
    'ChangeTestCase',
    'ChangeQuerysetTestCase',
    'CreationTrailTestCase',
]


class PrintPublicationTestCase(SimpleTestCase):
    def test_str(self):
        """Verify inactive suffix on publication name.

        Should return publication name with (inactive) appended when the
        publication is not active.
        """
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
        """Verify string method for PrintSection model.

        The method should return section name and pub name.
        """
        section = PrintSection.objects.create(name='News',
                                              publication=self.pub)
        self.assertEqual(str(section), 'TDMN > News')

    def test_str_section_inactive(self):
        """Verify string method behavior for inactive sections.

        When section is inactive, string representation should include
        a flag that it's inactive.
        """
        section = PrintSection.objects.create(name='News', is_active=False,
                                              publication=self.pub)
        self.assertEqual(str(section), 'TDMN > News (inactive)')

    def test_str_publication_inactive(self):
        """Verify string method behavior for inactive publications.

        When publication is inactive, string representation should
        include a flag that it's inactive.
        """
        self.pub.is_active = False
        section = PrintSection.objects.create(name='News',
                                              publication=self.pub)
        self.assertEqual(str(section), 'TDMN > News (inactive)')


class HeadlineTestCase(TestCase):
    multi_db = separate_db

    def test_str(self):
        """Verify string method for Headline model.

        The method should return the headline's text.
        """
        hed = Headline(
            package=package_factory(slug_key='test-hed-str'),
            text='A headline'
        )
        self.assertEqual(str(hed), 'A headline')

    def test_total_votes(self):
        """Verify total_votes() method behavior.

        The method should return latest total for headline votes.
        """
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
        """Verify string method for HeadlineVote model.

        The method should include voter and vote information.
        """
        hed = Headline(
            package=package_factory(slug_key='test-hedvote-str'),
            text='A headline'
        )
        vote = HeadlineVote(headline=hed, voter='a@b.com')
        self.assertEqual(str(vote), 'a@b.com for A headline')


class PackageTestCase(TestCase):
    multi_db = separate_db

    def test_str(self):
        """Verify string method for Package model.

        The method should return generated slug information.
        """
        slug_key = 'my-test'
        package = package_factory(slug_key=slug_key)
        self.assertEqual(str(package), 'hub.{}.050115'.format(slug_key))

    def test_package_slug_creation(self):
        """Verify behavior of Package's 'full_slug' model property.

        This property should return a Package's 'slug_key'.
        """
        slug_key = 'test-key-one'
        package = package_factory(slug_key=slug_key)
        self.assertEqual(
            package.full_slug,
            'hub.{}.050115'.format(slug_key)
        )

    def test_publish_date_resolution_inference(self):
        """Verify inference of publish date based on date range length.

        The inferring method should treat ranges greater than 27 days as
        month (m) resolution, ranges between 6 and 27 days as week (w)
        resolution, ranges between 23 hours and 6 days as day (d)
        resolution and ranges less than 23 hours as time (t) resolution.
        """
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
        """Primary item's slug should be None."""
        package = package_factory(slug_key='test-item-pis')
        primary_item = item_factory(primary_for=package)
        self.assertIsNone(primary_item.full_slug)

    def test_additional_item_slug(self):
        """Verify additional-item slug behavior.

        An additional item's slug should be the concatenation of its
        parent package's slug and the individual item's slug key.
        """
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
        """Verify protection against duplicate additional-item slugs.

        Model should throw an IntegrityError when saving multiple
        additional items with the same slug key to a package.
        """
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
        """Verify month and week date-range formatting behavior.

        If publish_date doesn't have at least day precision, day of
        month should be excluded from the date slug.
        """
        week_resolution = package_factory(
            publish_date_lower=make_aware(datetime(2015, 5, 1)),
            publish_date_upper=make_aware(datetime(2015, 5, 8)),
            slug_key='test-item-gdsnd'
        )
        self.assertEqual(week_resolution.slugified_date, '05--15')

    def test_generate_date_slug_with_day(self):
        """Verify precise-date date-range formatting behavior.

        If publish_date is day- / datetime-precise, generate a date slug
        with format 'MMDDYY'.
        """
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
        """Verify items have no less than one link to the Package model.

        Raise ValidationError on an item if neither its primary nor its
        additional Package ForeignKeys have values.
        """
        with six.assertRaisesRegex(
            self,
            ValidationError,
            "Items must be connected to a package"
        ):
            item = Item(slug_key='sluggy-slug', type='text',
                        budget_line='Budget line')
            item.clean()

    def test_primary_and_additional_raise_error(self):
        """Verify mutual exclusivity of primary- & additional-type FKs.

        Raise ValidationError if an item has simultaneous values set for
        both primary and additional package.
        """
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
        """Verify string method for Change model.

        The method should include user, package & timestamp information.
        """
        self.assertEqual(
            str(self.change),
            'User {} changed {} at {}.'.format(
                self.user.pk,
                str(self.item.primary_for_package),
                self.change.at
            )
        )

    def test_item(self):
        """This property should load the change's item instance."""
        self.assertEqual(self.change.item, self.item)

    def test_item_missing(self):
        """If Item model is missing, 'self.item' should be None."""
        self.item.delete()
        change = Change.objects.get(pk=self.change.pk)
        self.assertIsNone(change.item)

    def test_item_cache(self):
        """Verify multiple-reference behavior on 'Change.item' call.

        Subsequent calls after the first call to a Change model's item
        property should load from model's cache, not from additional
        queries to the database.
        """
        change = Change.objects.get(pk=self.change.pk)

        with self.assertNumQueries(1, using=budget_db):
            change.item

        with self.assertNumQueries(0, using=budget_db):
            change.item

    def test_user(self):
        """User property should load the change's user instance."""
        self.assertEqual(self.change.by_user, self.user)

    def test_user_cache(self):
        """Verify multiple-reference behavior on 'Change.by_user' call.

        Subsequent calls after the first call to a Change model's user
        property should load from model's cache, not from additional
        queries to the database.
        """
        change = Change.objects.get(pk=self.change.pk)

        with self.assertNumQueries(1, using='default'):
            change.by_user

        with self.assertNumQueries(0, using='default'):
            change.by_user

    def test_user_missing(self):
        """If User model is missing, 'self.by_user' should be None."""
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
        """Verify duplicate-removal behavior on fetch.

        Ensure that duplicate queries are eliminated when prefetching
        users and items.
        """
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
        """Verify queryset's ability to return empty querysets."""
        self.assertEqual(len(Change.objects.filter(by=10000)), 0)

    def test_values_query(self):
        """Verify tolerance of non-model-instance returning queries."""
        user_ids = Change.objects.all().values('by')
        expect = [{'by': self.user.pk} for x in range(0, 10)]
        self.assertListEqual(list(user_ids), list(expect))


class CreationTrailTestCase(TestCase):
    """Tests for our abstract base class.

    This class adds 'created_by' and 'created_at' fields.

    All tests use the Package model, but this class is mixed into almost
    all budget models.
    """
    multi_db = separate_db

    def test_created_by_user(self):
        """Verify behavior of 'created_by_user' model property.

        This property should load the user model from the database.
        """
        user = User.objects.create_user('user')

        package = package_factory(slug_key='test-cr-trl-cbu')
        package.created_by = user.pk
        package.save()

        self.assertEqual(package.created_by_user, user)

    def test_created_by_user_none(self):
        """Verify 'created_by_user' behavior when user is null.

        In this case, the property should return AnonymousUser.
        """
        package = package_factory(slug_key='test-cr-trl-cbun')
        self.assertEqual(package.created_by_user, AnonymousUser)

    def test_created_by_user_missing(self):
        """Verify 'created_by_user' behavior when user does not exist.

        In this case, the property should return a value of None.
        """
        package = package_factory(slug_key='test-cr-trl-cbum')
        package.created_by = 5000
        package.save()

        self.assertEqual(package.created_by_user, None)
