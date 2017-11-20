# Imports from django.  # NOQA
from django.db.models.signals import pre_save
from django.dispatch import receiver


# Imports from other dependencies.
from editorial_staff.models import Hub


# Imports from budget.
from budget.models import Package


@receiver(pre_save, dispatch_uid='budget_package_save', sender=Package)
def update_package_vertical_on_save(sender, instance, **kwargs):
    """Update package's vertical before saving."""
    instance.vertical = Hub.objects.get(slug=instance.hub).vertical.slug
