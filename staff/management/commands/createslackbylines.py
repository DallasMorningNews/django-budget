# Imports from django.  # NOQA
from django.core.management.base import BaseCommand, CommandError  # NOQA


# Imports from staff.
from staff.loaders.slack import load_staff_from_slack


class Command(BaseCommand):
    help = 'Makes bylines for all current, full-privileged Slack users'

    def handle(self, *args, **options):
        created_bylines = load_staff_from_slack()

        self.stdout.write(self.style.SUCCESS(
            'Successfully created {} bylines:'.format(len(created_bylines))
        ))

        for byline in created_bylines:
            self.stdout.write(self.style.SUCCESS(
                '    - {} ({})'.format(
                    byline.render_full_name(),
                    byline.email,
                )
            ))
