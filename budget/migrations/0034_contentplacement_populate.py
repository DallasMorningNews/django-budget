# -*- coding: utf-8 -*-
# Generated by Django 1.11.4 on 2017-09-24 21:00
from __future__ import unicode_literals

from django.db import migrations
from django.db.models import Count


def forward_func(apps, schema_editor):
    """Forward direction: migrate data on Package to related models.

    Packages must have both a print run date and at least one assigned
    print section (also known as a "placement_type") for this migration
    to construct a new ContentPlacement model.
    """
    Package = apps.get_model('budget', 'Package')
    ContentPlacement = apps.get_model('budget', 'ContentPlacement')
    Publication = apps.get_model('budget', 'PrintPublication')

    placed_packages = Package.objects.annotate(
        num_placements=Count('print_section')
    ).exclude(
        num_placements=0
    ).filter(
        print_run_date__isnull=False
    )

    for package in placed_packages:
        print_section_id = list(set(
            package.print_section.values_list('publication__id', flat=True)
        ))

        print_sections_to_migrate = package.print_section.all()

        saved_publication_id = print_section_id[0]

        if len(print_section_id) != 1:
            print_sections_to_migrate = package.print_section.filter(
                publication__id=saved_publication_id
            )

            print(' '.join([
                'Multiple placement destinations found for budget.Package',
                'instance with an ID of {}.',
                'This migration will not create ContentPlacement models for',
                'the following destinations and placement types:'
            ]).format(package.id))

            for section in package.print_section.exclude(
                publication__id=saved_publication_id
            ):
                print('*   publication={}, type={}'.format(
                    section.publication.name,
                    section.name
                ))

            print(' '.join([
                'If the next migration to `budget` is allowed to run, these',
                'destination/placement-type pairs\' data will be deleted.',
            ]))

        placement_obj = {
            'package': package,
            'destination': Publication.objects.get(id=saved_publication_id),
            'placement_types': print_sections_to_migrate.values_list(
                'slug',
                flat=True
            ),
            'placement_details': '',
            'run_date': package.print_run_date,
            'external_slug': package.print_system_slug,
            'is_finalized': package.is_print_placement_finalized,
        }

        placement = ContentPlacement(**placement_obj)
        placement.save()


def backward_func(apps, schema_editor):
    """"""
    ContentPlacement = apps.get_model('budget', 'ContentPlacement')
    PrintSection = apps.get_model('budget', 'PrintSection')

    for placement in ContentPlacement.objects.all():
        if placement.package.print_section.count() == 0:
            pkg = placement.package

            pkg.print_run_date = placement.run_date
            pkg.print_system_slug = placement.external_slug
            pkg.is_print_placement_finalized = placement.is_finalized

            pkg.save()

            for placement_type in placement.placement_types:
                try:
                    type_model = PrintSection.objects.get(
                        publication__id=placement.destination.id,
                        slug=placement_type
                    )
                    pkg.print_section.add(type_model)
                    pkg.save()
                except PrintSection.DoesNotExist:
                    print(' '.join([
                        'Could not find a placement type with destination',
                        '"{}" and slug "{}" to attach to package with ID {}.',
                    ]).format(
                        placement.destination.name,
                        placement_type,
                        pkg.id
                    ))
        else:
            print(' '.join([
                'Couldn\'t save placement in destination "{}" of type(s) "{}"',
                'for package with ID {} because that package already has a',
                'stored placement.',
            ]).format(
                placement.destination.name,
                placement_type,
                pkg.id
            ))
            print('-   This placement is still saved with ID {}.'.format(
                placement.id
            ))


class Migration(migrations.Migration):

    dependencies = [
        ('budget', '0033_contentplacement'),
    ]

    operations = [
        migrations.RunPython(forward_func, backward_func)
    ]
