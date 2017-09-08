# Imports from staff.
from staff.models import Staffer
from staff.service_connections import SlackConnection
from staff.service_connections.slack import format_slack_staffer


SLACK_CONNECTION = SlackConnection()


def load_staff_from_slack():
    """TK."""
    all_slack_users = SLACK_CONNECTION.users.list().body['members']

    active_staff = [
      _ for _ in all_slack_users
      if _.get('deleted', False) is False
      and _.get('is_restricted', False) is False
      and _.get('is_ultra_restricted', False) is False
      and _.get('is_bot', False) is False
      and _.get('real_name', '').lower() != 'slackbot'
    ]

    added_staffers = []
    for slack_user in active_staff:
        formatted_staffer = format_slack_staffer(slack_user)
        new_staffer = Staffer(**formatted_staffer)
        new_staffer.save()

        added_staffers.append(new_staffer)

    return added_staffers
