# Imports from python.  # NOQA
import os
import random


# Imports from Django.
from django.db import models


# Imports from other dependencies.
from colorfield.fields import ColorField
from slacker import Slacker


SLACK = Slacker(os.environ.get('SLACK_TOKEN'))

anons = [
    'alligator', 'anteater', 'armadillo', 'auroch',
    'axolotl', 'badger', 'bat', 'beaver', 'buffalo',
    'camel', 'chameleon', 'cheetah', 'chipmunk',
    'chinchilla', 'chupacabra', 'cormorant', 'coyote', 'crow',
    'dingo', 'dinosaur', 'dolphin', 'duck', 'elephant',
    'ferret', 'fox', 'frog', 'giraffe', 'gopher', 'grizzly',
    'hedgehog', 'hippo', 'hyena', 'jackal', 'ibex',
    'ifrit', 'iguana', 'koala', 'kraken', 'lemur', 'leopard',
    'liger', 'llama', 'manatee', 'mink', 'monkey', 'narwhal',
    'nyan cat', 'orangutan', 'otter', 'panda', 'penguin',
    'platypus', 'python', 'pumpkin', 'quagga', 'rabbit',
    'raccoon', 'rhino', 'sheep', 'shrew', 'skunk', 'slow loris',
    'squirrel', 'turtle', 'walrus', 'wolf', 'wolverine', 'wombat'
]


def slack_user_search(email):
    """Return a user if found in slack."""
    users = SLACK.users.list().body['members']
    for user in users:
        if user['profile'].get('email', None) == email:
            return user
    return None


class Vertical(models.Model):
    '''Model for top-level organizational entities.'''
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
    '''Model for lower-level organizational entities.'''
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
    '''Model for individual human staffers.'''
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
            profile = staffer['profile']
            self.last_name = profile.get(
                'last_name',
                random.choice(anons)
            ).strip()
            self.first_name = profile.get('first_name', 'anonymous').strip()
            self.image_url = profile.get('image_72', '')
        else:
            self.first_name = 'anonymous'
            self.last_name = random.choice(anons)

    def save(self, *args, **kwargs):
        if not self.last_name or not self.first_name:
            self.fetch_slack_details()
        super(Staffer, self).save(*args, **kwargs)

    def render_full_name(self):
        if self.last_name:
            if self.first_name:
                return '{} {}'.format(
                    self.first_name.encode("utf-8"),
                    self.last_name.encode("utf-8")
                )

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
