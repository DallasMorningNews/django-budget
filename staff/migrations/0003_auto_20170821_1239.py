# -*- coding: utf-8 -*-
# Generated by Django 1.11.4 on 2017-08-21 19:39
from __future__ import unicode_literals

import colorfield.fields
from django.db import migrations


class Migration(migrations.Migration):

    dependencies = [
        ('staff', '0002_staffer_active'),
    ]

    operations = [
        migrations.AlterField(
            model_name='hub',
            name='color',
            field=colorfield.fields.ColorField(default='#0185D3', max_length=10),
        ),
    ]
