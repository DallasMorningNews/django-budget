# Imports from Django.  # NOQA
from django.conf import settings


# Imports from other dependencies.
from rest_framework.pagination import LimitOffsetPagination


class ItemViewPagination(LimitOffsetPagination):
    default_limit = getattr(settings, 'BUDGET_API_MAX_ITEMS', 500)
    max_limit = getattr(settings, 'BUDGET_API_MAX_ITEMS', 500)
