# Imports from python.  # NOQA
from datetime import datetime


# Imports from Django.
from django.db import connections
from django.db.utils import ConnectionDoesNotExist
from django.utils import timezone


# Imports from other dependencies.
from editorial_staff.models import Hub
from editorial_staff.models import Vertical
from psycopg2.extras import DateTimeTZRange


# Imports from budget.
from budget.models import Item
from budget.models import Package


tz = timezone.get_default_timezone()

# Figure out which database we should use to check query counts
try:
    connections['budget'].cursor()
    separate_db = True
    budget_db = 'budget'
except ConnectionDoesNotExist:
    separate_db = False
    budget_db = 'default'


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
