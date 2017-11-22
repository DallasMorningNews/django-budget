# Imports from python.  # NOQA
from datetime import datetime


# Imports from Django.
from django.core.exceptions import ValidationError
from django.test import SimpleTestCase
from django.test import TestCase
from django.utils.timezone import make_aware


# Imports from other dependencies.
from psycopg2.extras import DateTimeTZRange


# Imports from budget.
from budget.utils import alphacode
from budget.utils import slug_date_to_range
from budget.validators import hub_exists


__all__ = [
    'SlugDateToRangeTestCase',
    'UtilsTestCase',
    'ValidatorTestCase',
]


class SlugDateToRangeTestCase(SimpleTestCase):
    def test_single_day_range(self):
        """Verify 'budget.utils.slug_date_to_range' single-day behavior.

        The method should turn a single-day formatted slug date
        (e.g., '050115') into a 1-day date range.

        The resulting range should also have correct time zones.
        """
        slug_date = '090115'
        actual_range = slug_date_to_range(slug_date)

        intended_range = DateTimeTZRange(
            lower=make_aware(datetime(2015, 9, 1)),
            upper=make_aware(datetime(2015, 9, 2))
        )
        self.assertEqual(intended_range, actual_range)

    def test_multiple_day_range(self):
        """Verify 'budget.utils.slug_date_to_range' multi-day behavior.

        The method should turn a multiple-day formatted slug date
        '05--15') into a week/month date range.

        The resulting range should also have correct time zones.
        """
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
        """Verify 'budget.utils.alphacode' behavior.

        Integers should be transformed into alphas. Ex: 1 = a, 27 = aa
        """
        self.assertEqual(alphacode(1), 'a')
        self.assertEqual(alphacode(26), 'z')
        self.assertEqual(alphacode(27), 'aa')
        self.assertEqual(alphacode(53), 'ba')


class ValidatorTestCase(TestCase):
    def test_hub_exists(self):
        """Verify 'budget.validators.hub_exists' behavior.

        The 'hub_exists' method should throw a ValidationError when
        passed the slug for a nonexistent hub.
        """
        with self.assertRaises(ValidationError):
            hub_exists('not-a-hub')
