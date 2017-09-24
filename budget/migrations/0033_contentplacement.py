# -*- coding: utf-8 -*-
# Generated by Django 1.11.4 on 2017-09-24 20:49
from __future__ import unicode_literals

import django.contrib.postgres.fields
import django.contrib.postgres.fields.ranges
from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):

    dependencies = [
        ('budget', '0032_auto_20170924_1204'),
    ]

    operations = [
        migrations.CreateModel(
            name='ContentPlacement',
            fields=[
                ('id', models.AutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('created_by', models.PositiveSmallIntegerField(db_index=True, null=True)),
                ('created_at', models.DateTimeField(auto_now_add=True)),
                ('placement_types', django.contrib.postgres.fields.ArrayField(base_field=models.CharField(blank=True, max_length=15, null=True), blank=True, null=True, size=None)),
                ('placement_details', models.CharField(help_text='E.G., print page number.', max_length=25)),
                ('run_date', django.contrib.postgres.fields.ranges.DateRangeField(blank=True, null=True)),
                ('external_slug', models.CharField(blank=True, max_length=250, null=True)),
                ('is_finalized', models.BooleanField(default=False)),
                ('destination', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='placed_content', to='budget.PrintPublication')),
                ('package', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='placements', to='budget.Package')),
            ],
            options={
                'abstract': False,
            },
        ),
    ]
