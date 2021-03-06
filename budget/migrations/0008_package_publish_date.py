# -*- coding: utf-8 -*-
# Generated by Django 1.9.6 on 2016-06-21 16:28
from __future__ import unicode_literals

import datetime
import calendar

import django.contrib.postgres.fields.ranges
from django.db import migrations
from django.core.exceptions import FieldError
from django.db.utils import DataError
from django.conf import settings

import pytz


DEFAULT_PUB_DATE = datetime.datetime(2015, 1, 1)
tz = pytz.timezone(settings.TIME_ZONE)


def end_of_month(dt):
    last_day_number = calendar.monthrange(year=dt.year, month=dt.month)[1]
    last_day = dt.replace(day=last_day_number)
    return last_day + datetime.timedelta(days=1)


def get_date_range(model):
    """Use the existing date fields to infer the start date for our new range
    field"""
    resolution = model.pub_date_resolution

    pub_date = model.pub_date.astimezone(tz)

    if resolution not in ('m', 'w', 'd', 't'):
        raise FieldError(
            'Invalid pub_date_resolution "%s" on model "%s"' % (
                model.pub_date_resolution, model
            ))

    if resolution == 'm':
        start = pub_date.replace(day=1, hour=0, minute=0)
        end = end_of_month(start)
    elif resolution == 'w':
        pub_date = datetime.datetime.combine(
            pub_date,
            datetime.time.min
        ) + datetime.timedelta(days=1)
        end = tz.localize(pub_date)
        start = end - datetime.timedelta(days=7)
    elif resolution == 'd':
        pub_date = datetime.datetime.combine(
            pub_date,
            datetime.time.min
        ) + datetime.timedelta(days=1)
        end = tz.localize(pub_date)
        start = end - datetime.timedelta(hours=24)
    elif resolution == 't':
        start = pub_date
        end = start + datetime.timedelta(minutes=1)

    return (start.replace(second=0, microsecond=0),
            end.replace(second=0, microsecond=0))


def pub_date_to_daterange(apps, schema_editor):
    """Take the stored pub_date and pub_date_resolution fields and turn them
    into a tuple to store in a DateTimeRangeField"""
    Package = apps.get_model("budget", "Package")
    for package in Package.objects.all():
        if package.pub_date is None:
            print("Skipping %s" % package)
            continue

        try:
            package.publish_date = get_date_range(package)
            package.save()
        except DataError as e:
            print('Error processing "%s" with pub_date "%s (%s)".' % (
                package, package.pub_date, package.pub_date_resolution))
            raise e


def default_dateranges(apps, schema_editor):
    """Walk back the date range migration to the field defaults"""
    Package = apps.get_model("budget", "Package")
    for package in Package.objects.all():
        package.publish_date = (DEFAULT_PUB_DATE, DEFAULT_PUB_DATE)
        package.save()


class Migration(migrations.Migration):

    dependencies = [
        ('budget', '0007_auto_20160531_1748'),
    ]

    operations = [
        migrations.AddField(
            model_name='package',
            name='publish_date',
            field=django.contrib.postgres.fields.ranges.DateTimeRangeField(default=(DEFAULT_PUB_DATE, DEFAULT_PUB_DATE)),
            preserve_default=False,
        ),
        migrations.RunPython(
            pub_date_to_daterange,
            default_dateranges
        )
    ]
