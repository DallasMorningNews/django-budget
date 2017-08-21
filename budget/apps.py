# Imports from Django.  # NOQA
from django.apps import AppConfig


class BudgetConfig(AppConfig):
    name = 'budget'
    verbose_name = 'budget'

    def ready(self):
        from budget import signals  # NOQA
