# -*- coding: utf-8 -*-
# Generated by Django 1.11.4 on 2017-10-28 23:55
from __future__ import unicode_literals

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('budget', '0035_auto_20170924_1624'),
    ]

    operations = [
        migrations.AlterField(
            model_name='contentplacement',
            name='placement_details',
            field=models.CharField(blank=True, help_text='E.G., print page number.', max_length=25, null=True),
        ),
    ]
