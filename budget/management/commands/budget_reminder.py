# Imports from python.  # NOQA
from datetime import datetime
from datetime import timedelta
import os


# Imports from Django.
from django.core.management.base import BaseCommand
from django.db.models import F
from django.db.models import Func


# Imports from other dependencies.
import requests


# Imports from budget.
from budget.models import Package


TOKEN = os.environ.get("CUEBOT_TOKEN", None)

POST_URL = "http://apps.dallasnews.com/tools/cuebot/message/"

PAST_DUE_WARNINGS = {
    'first_warning': ' '.join([
        "Hello.",
        "You were an author or editor on the following package which had a",
        "planned publish date yesterday.",
        "If it published, would you kindly add the URL it published to?\n\n",
        "You can reply to me and say `{} was published to [story URL]`.\n\n",
        "If your package didn't publish, please delete the item or move its",
        "pub date.\n\n",
        "CueBot thanks you for keeping our newsroom budget tidy.\n",
    ]),
    'second_warning': ' '.join([
        "Hi. Your package is past due.",
        "If it published, please add the URL it published to.\n\n",
        "You can reply back and say `{} was published to [story URL]`.\n\n",
        "If it didn't publish, either delete it or move the pub date.\n\n",
        "CueBot thanks you for your compliance.\n",
    ]),
    'last_warning': ' '.join([
        "Citizen, your package is out of date.",
        "Please add publishing info, delete the package or change its",
        "pub date.\n\n",
        "Reply back with `{} was published to [story URL]`.\n\n",
        "CueBot thanks you for your compliance.\n",
    ]),
}


class Command(BaseCommand):
    help = "Reminds authors and editors of budget items past their deadline."

    def handle(self, *args, **options):

        past_due = datetime.combine(
            datetime.now().date(),
            datetime.min.time()
        )

        def get_recipients(package):
            if package.primary_content.editors:
                recipients = [
                    editor['email']
                    for editor in package.primary_content.editors
                ] + [
                    author['email']
                    for author in package.primary_content.authors
                ]
            else:
                recipients = [
                    author['email']
                    for author in package.primary_content.authors
                ]
            return recipients

        self.stdout.write("SENDING FIRST WARNINGS")
        # FIRST WARNING
        first_warn = past_due - timedelta(days=1)
        for package in Package.objects.annotate(
            publish_date_upper=Func(F('publish_date'), function='UPPER')
        ).filter(
            publish_date_upper__lt=past_due,
            publish_date_upper__gte=first_warn,
            published_url=None,
            primary_content__isnull=False
        ):
            recipients = get_recipients(package)
            requests.post(POST_URL, json={
                "token": TOKEN,
                "packageID": package.id,
                "recipients": recipients,
                "message": PAST_DUE_WARNINGS['first_warning'].format(
                    package.full_slug
                )
            })

            self.stdout.write(self.style.SUCCESS(
                "First warning sent for {} to {}".format(
                    package.full_slug,
                    ", ".join(recipients)
                )
            ))

        # SECOND WARNING: 2 days gone
        for package in Package.objects.annotate(
            publish_date_upper=Func(F('publish_date'), function='UPPER')
        ).filter(
            publish_date_upper__lt=first_warn,
            publish_date_upper__gte=first_warn - timedelta(days=1),
            published_url=None,
            primary_content__isnull=False
        ):
            recipients = get_recipients(package)
            requests.post(POST_URL, json={
                "token": TOKEN,
                "packageID": package.id,
                "recipients": recipients,
                "message": PAST_DUE_WARNINGS['second_warning'].format(
                    package.full_slug
                )
            })

            self.stdout.write(self.style.SUCCESS(
                "Second warning sent for {} to {}".format(
                    package.full_slug,
                    ", ".join(recipients)
                )
            ))

        # Last warning: 3 days gone
        for package in Package.objects.annotate(
            publish_date_upper=Func(F('publish_date'), function='UPPER')
        ).filter(
            publish_date_upper__lt=first_warn - timedelta(days=1),
            publish_date_upper__gte=first_warn - timedelta(days=2),
            published_url=None,
            primary_content__isnull=False
        ):
            recipients = get_recipients(package)
            requests.post(POST_URL, json={
                "token": TOKEN,
                "packageID": package.id,
                "recipients": recipients,
                "message": PAST_DUE_WARNINGS['last_warning'].format(
                    package.full_slug
                )
            })

            self.stdout.write(self.style.SUCCESS(
                "Last warning sent for {} to {}".format(
                    package.full_slug,
                    ", ".join(recipients)
                )
            ))
