# Imports from Django.  # NOQA
from django.apps import AppConfig


class StaffConfig(AppConfig):
    name = 'staff'
    verbose_name = 'staff'

    def ready(self):
        pass
