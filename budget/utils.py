# Imports from python.  # NOQA
from datetime import datetime
import re
import string


# Imports from django.
from django.utils import timezone


# Imports from other dependencies.
from dateutil.relativedelta import relativedelta
from psycopg2.extras import DateTimeTZRange


SLUG_MATCH_RE = re.compile(
    r"""
    ^
    (?P<hub_name>[-\w]+)\.
    (?P<slug_key>[-\w]+)\.
    (?P<month>[\d]{2})(?P<day>([\d]{2}|[-]{2}))(?P<year>[\d]{2})
    (?P<suffix_letter>[\w]{0,1})
    (.(?P<additional_slug>[-\w]+)){0,1}
    $
    """,
    re.VERBOSE
)


def alphacode(i):
    """Return base 26 alpha code.

    e.g., 1 = A, 27 = AA, etc.
    """
    letters = list(string.ascii_lowercase)
    code = ''
    while i > 0:
        i -= 1
        remainder = i % 26
        code = '{}{}'.format(letters[int(remainder)], code)
        i = (i - remainder) / 26
    return code


def slug_date_to_range(raw_date_string):
    """Parse slug's date ('yymmdd' or 'yy--dd') to Date object."""
    is_single_day = True

    raw_month = raw_date_string[0:2]
    raw_day = raw_date_string[2:4]
    raw_year = raw_date_string[4:6]

    if raw_day == '--':
        raw_day = '01'
        is_single_day = False

    first_day = timezone.make_aware(
        datetime.strptime(
            '20{}-{}-{}'.format(raw_year, raw_month, raw_day),
            '%Y-%m-%d'
        )
    )

    delta = relativedelta(days=+1)
    if not is_single_day:
        delta = relativedelta(months=+1)

    return DateTimeTZRange(
        lower=first_day,
        upper=(first_day + delta)
    )
