# -*- coding: utf-8 -*-
# Generated by Django 1.9.6 on 2016-06-28 15:37
from __future__ import unicode_literals

import django.contrib.postgres.fields.ranges
from django.db import migrations


class Migration(migrations.Migration):

    dependencies = [
        ('budget', '0017_auto_20160627_1750'),
    ]

    operations = [
        migrations.AlterField(
            model_name='package',
            name='print_run_date',
            field=django.contrib.postgres.fields.ranges.DateRangeField(blank=True, null=True),
        ),
    ]
