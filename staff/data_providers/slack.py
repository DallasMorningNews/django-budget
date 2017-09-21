# Imports from Django.  # NOQA
from django.conf import settings


# Imports from staff.
# from staff.utils import get_random_anonymous_animal


# Imports from other dependencies.
from slacker import Slacker


SLACK_CONNECTION = Slacker(getattr(settings, 'SLACK_TOKEN', ''))


class SlackProvider(object):
    def __init__(self):
        self.connection = SLACK_CONNECTION

    def get_all_staffers(self):
        return self.connection.users.list().body['members']

    def get_staffer(self, queried_email):
        """Return a user if found in Slack."""
        users = self.connection.users.list().body['members']
        for user in users:
            if user['profile'].get('email', None) == queried_email:
                return user
        return None

    def format_staffer(self, user_data, exclude_email=False):
        """TK."""
        staffer_formatted = {}

        profile = user_data['profile']

        if exclude_email is not True:
            staffer_formatted['email'] = profile.get('email')

        staffer_formatted['last_name'] = profile.get(
            'last_name',
            None
        ).strip()

        staffer_formatted['first_name'] = profile.get(
            'first_name',
            None
        ).strip()

        staffer_formatted['image_url'] = profile.get('image_72', '')

        return staffer_formatted
