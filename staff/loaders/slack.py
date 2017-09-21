# Imports from staff.  # NOQA
from staff.data_providers import SlackProvider
from staff.models import Staffer


SLACK = SlackProvider()


def load_staff_from_slack():
    """TK."""
    all_slack_users = SLACK.get_all_staffers()

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
        formatted_staffer = SLACK.format_staffer(slack_user)
        new_staffer = Staffer(**formatted_staffer)
        new_staffer.save()

        added_staffers.append(new_staffer)

    return added_staffers
