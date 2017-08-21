# Imports from Django.  # NOQA
from django.db.models import Field


# Imports from staff.
from staff.validators import validate_vertical
from staff.widgets import VerticalWidget


class VerticalField(Field):
    def __init__(self, *args, **kwargs):
        validators = kwargs.get('validators', [])
        if validators is None:
            validators = []
        if validate_vertical not in validators:
            validators.append(validate_vertical)
        kwargs['validators'] = validators

        kwargs['max_length'] = 64
        return super(VerticalField, self).__init__(*args, **kwargs)

    def get_internal_type(self):
        return 'CharField'

    def formfield(self, *args, **kwargs):
        kwargs['widget'] = kwargs.get('widget', VerticalWidget())
        return super(VerticalField, self).formfield(*args, **kwargs)
