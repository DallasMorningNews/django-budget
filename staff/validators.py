# Imports from Django.  # NOQA
from django.core.exceptions import ValidationError


# Imports from staff.
from staff.models import Vertical


def validate_vertical(slug):
    """Validate that the passed slug corresponds to an existing vertical

    :raises ValidationError: thrown if slug doesn't match
    """
    try:
        Vertical.objects.get(slug=slug)
    except Vertical.DoesNotExist:
        raise ValidationError('Vertical "%s" does not exist.' % slug)
