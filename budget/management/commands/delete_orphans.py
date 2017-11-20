# Imports from Django.  # NOQA
from django.core.management.base import BaseCommand


# Imports from other dependencies.
from six.moves import input


# Imports from budget.
from budget.models import Package


class Command(BaseCommand):
    help = 'Deletes all packages without a primary content item'

    def add_arguments(self, parser):
        parser.add_argument(
            '--noinput', '--no-input',
            action='store_false', dest='interactive', default=True,
            help=(
                'Tells Django to NOT prompt the user for input of any kind. '
                'Packages without primary content items will be deleted '
                'without asking for confirmation.'
            ),
        )

    def handle(self, *args, **options):
        with_orphans = Package.objects.filter(primary_content__isnull=True)

        if not with_orphans:
            self.stdout.write(self.style.SUCCESS(
                'No packages without primary content items found.'))
            return

        deleted = 0

        for orphan in with_orphans:
            if options['interactive']:
                delete = False
                while delete is False:
                    msg = 'Delete package "%s"? [y/n] ' % orphan
                    answer = input(msg).lower()
                    if answer == 'y':
                        self.stdout.write('Deleting "%s".' % orphan)
                        orphan.delete()
                        deleted += 1
                        delete = True
                    elif answer == 'n':
                        self.stdout.write('Skipping "%s".' % orphan)
                        break
                    else:
                        self.stdout.write(self.style.WARNING(
                            'Answer with "y" to delete or "n" to skip.'))
            else:
                self.stdout.write('Deleting "%s"' % orphan)
                orphan.delete()
                deleted += 1

        self.stdout.write(self.style.SUCCESS(
            'Deleted %s package(s) without primary content items.' %
            len(with_orphans)))
