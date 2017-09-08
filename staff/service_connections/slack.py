# Imports from Django.
from django.conf import settings


# Imports from staff.
from staff.utils import get_random_anonymous_animal


# Imports from other dependencies.
from slacker import Slacker


def SlackConnection():
    return Slacker(getattr(settings, 'SLACK_TOKEN', ''))


def format_slack_staffer(slack_user, exclude_email=False):
    """TK."""
    staffer_formatted = {}

    profile = slack_user['profile']

    if exclude_email is not True:
        staffer_formatted['email'] = profile.get('email')

    staffer_formatted['last_name'] = profile.get(
        'last_name',
        get_random_anonymous_animal()
    ).strip()

    staffer_formatted['first_name'] = profile.get(
        'first_name',
        'anonymous'
    ).strip()

    staffer_formatted['image_url'] = profile.get('image_72', '')

    return staffer_formatted
