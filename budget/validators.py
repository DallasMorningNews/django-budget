# Imports from Django.  # NOQA
from django.core.exceptions import ValidationError


# Imports from other dependencies.
from editorial_staff.models import Hub


def hub_exists(value):
    """Validate that a hub exists"""
    try:
        Hub.objects.get(slug=value)
    except Hub.DoesNotExist:
        raise ValidationError('Hub "%s" does not exist.' % value)
