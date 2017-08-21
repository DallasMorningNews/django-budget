# Imports from Django.  # NOQA
from django.contrib import admin


# Imports from staff.
from staff.models import Staffer, Hub, Vertical  # NOQA


admin.site.register(Staffer)
admin.site.register(Hub)
admin.site.register(Vertical)
