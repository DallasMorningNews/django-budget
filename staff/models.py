# Imports from Django.  # NOQA
from django.db import models


# Imports from staff.
from staff.service_connections import SlackConnection
from staff.service_connections.slack import format_slack_staffer
from staff.utils import get_random_anonymous_animal


# Imports from other dependencies.
from colorfield.fields import ColorField


SLACK_CONNECTION = SlackConnection()


def slack_user_search(email):
    """Return a user if found in Slack."""
    users = SLACK_CONNECTION.users.list().body['members']
    for user in users:
        if user['profile'].get('email', None) == email:
            return user
    return None


class Vertical(models.Model):
    """Model for top-level organizational entities."""
    name = models.CharField(max_length=100)
    slug = models.SlugField(max_length=100)

    class Meta:  # noqa
        ordering = ['name']

    def __str__(self):
        return self.name

    def as_object(self):
        return {
            'name': self.name,
            'slug': self.slug,
        }


class Hub(models.Model):
    """Model for lower-level organizational entities."""
    name = models.CharField(max_length=100)
    slug = models.SlugField(max_length=100)
    vertical = models.ForeignKey(Vertical, on_delete=models.CASCADE)
    color = ColorField(default='#0185D3')

    class Meta:  # noqa
        ordering = ['name']

    def __str__(self):
        return self.name

    def as_object(self):
        return {
            'name': self.name,
            'color': self.color,
            'slug': self.slug,
            'vertical': {
                'name': self.vertical.name,
                'slug': self.vertical.slug,
            }
        }


class Staffer(models.Model):
    """Model for individual staffers."""
    email = models.EmailField(unique=True)
    first_name = models.CharField(max_length=50, blank=True, null=True)
    last_name = models.CharField(max_length=50, blank=True, null=True)
    image_url = models.URLField(blank=True, null=True)
    active = models.BooleanField(default=True)

    class Meta:  # noqa
        ordering = ['last_name', 'first_name']

    def __str__(self):
        return self.render_full_name()

    def fetch_slack_details(self):
        staffer = slack_user_search(self.email)

        if staffer:
            staffer_data = format_slack_staffer(staffer, exclude_email=True)

            for attr, value in staffer_data.items():
                setattr(self, attr, value)
        else:
            self.first_name = 'anonymous'
            self.last_name = get_random_anonymous_animal()

    def save(self, *args, **kwargs):
        if not self.last_name or not self.first_name:
            self.fetch_slack_details()
        super(Staffer, self).save(*args, **kwargs)

    def render_full_name(self):
        if self.last_name:
            if self.first_name:
                return '{} {}'.format(self.first_name, self.last_name)

            return self.last_name

        return ''

    def render_formatted_name(self):
        # TK: More error-proof formatting for people with the same
        # surname.
        return self.last_name

    def as_object(self):
        return {
            'firstName': self.first_name,
            'lastName': self.last_name,
            'fullName': self.render_full_name(),
            'formattedName': self.render_formatted_name(),
            'email': self.email,
            'imageURL': self.image_url,
            'active': self.active,
        }
