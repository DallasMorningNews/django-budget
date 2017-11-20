# Imports from Django.  # NOQA
from django.apps import apps
from django.contrib.auth import get_user_model
from django.db import models


# Imports from budget.
# from budget.utils import alphacode
from budget.utils import slug_date_to_range


class ChangeQuerySet(models.QuerySet):
    # Any supported pretch fields should go here, exactly as they'd go into
    # a prefetch_related() call
    CUSTOM_PREFETCH_FIELDS = ('by_user', 'item',)

    def _prefetch_related_objects(self):
        """Filter out custom prefetch fields and read them separately.

        Override the queryset's built-in _prefetch_related_objects
        method to filter out - but then read - the custom prefetch
        fields we support.
        """
        active_custom_prefetches = []

        cleaned_related_lookups = list(self._prefetch_related_lookups)

        for custom_prefetch in self.CUSTOM_PREFETCH_FIELDS:
            if custom_prefetch in self._prefetch_related_lookups:
                active_custom_prefetches.append(custom_prefetch)
                cleaned_related_lookups.remove(custom_prefetch)

        self._prefetch_related_lookups = cleaned_related_lookups
        super(ChangeQuerySet, self)._prefetch_related_objects()

        self._prefetch_related_lookups = (
            self._prefetch_related_lookups + active_custom_prefetches)

    def _prefetch_by_user(self):
        """Prefetch the by_user field.

        Handle this using the PKs in the by model attribute. This needs
        to happen here because the users are in a different table, so we
        can't store a true ForeignKey to them at the model level.

        Instead, we grab them all in a single query and add them onto
        the model's _user attribute, where they're accessed by the
        by_user model method.
        """
        if 'by_user' not in self._prefetch_related_lookups:
            return

        # Get all models that are missing a cached _user property
        missing_users = list(
            [x for x in self._result_cache if not hasattr(x, '_user')]
        )

        if not missing_users:
            return

        # Get all unique user IDs from the models missing _user attributes
        user_ids = [x.by for x in missing_users]
        unique_user_ids = list(set(user_ids))

        # Then get all matching user models
        UserModel = get_user_model()
        users = list(
            UserModel.objects.filter(id__in=unique_user_ids).iterator()
        )

        # Now attach those user models to the results models in our results
        # cache
        def _add_user(change):
            change._user = next(u for u in users if u.id == change.by)
            return change

        self._result_cache = list(map(_add_user, self._result_cache))

    def _prefetch_item(self):
        """Prefetch related budget item from change model.

        Works the same as _prefetch_by_user, but with a slight
        modification: _prefetch_by_user can count on working with a single
        model type. _prefetch_by_item has to query multiple model types.
        """
        if 'item' not in self._prefetch_related_lookups:
            return

        # Get all items that are missing a cached _item property
        missing = list(
            [x for x in self._result_cache if not hasattr(x, '_item')]
        )

        if not missing:
            return

        # Get all unique item IDs and model names for missing _items
        item_ids = list(
            set([(x.item_content_type, x.item_id) for x in missing])
        )
        item_types = list(set([x.item_content_type for x in missing]))

        # Now go through each of the unique model names referenced and load
        # all items of that type needed by this queryset
        prefetched_instances = []

        for model in item_types:
            # Get the model by name
            Model = apps.get_model(app_label='budget', model_name=model)
            # Then get all unique model IDs for matching models
            matches = list([x for x in item_ids if x[0] == model])
            ids_for_model = list([x[1] for x in matches])
            # And run a query to get them all at once
            items = list(Model.objects.filter(id__in=ids_for_model).iterator())

            prefetched_instances += items

        # Tack the results onto the result cache
        for cached in self._result_cache:
            for prefetched in prefetched_instances:
                if (prefetched._meta.model_name == cached.item_content_type and
                        prefetched.id == cached.item_id):
                    setattr(cached, '_item', prefetched)
                    break

    def _fetch_all(self):
        """Fetch all the related fields.

        This is the queryset method that actually evaluates the query,
        so it's the best spot to intercept the result cache before it's
        returned and run our custom prefetch logic.
        """
        super(ChangeQuerySet, self)._fetch_all()

        if not self._result_cache:
            return

        if not isinstance(self._result_cache[0], self.model):
            return

        self._prefetch_by_user()
        self._prefetch_item()


class PackageQuerySet(models.QuerySet):
    """TK."""
    def get_by_slug(self, raw_slug):
        """TK."""
        slug_parts = raw_slug.split('.')

        publish_date_range = slug_date_to_range(slug_parts[2])

        if (publish_date_range.upper - publish_date_range.lower).days == 1:
            return self.get(
                hub=slug_parts[0],
                slug_key=slug_parts[1],
                publish_date__contained_by=publish_date_range
            )

        else:
            Package = apps.get_model(app_label='budget', model_name='package')
            try:
                # Query for month matches first.
                # These will exactly match the given range
                return self.get(
                    hub=slug_parts[0],
                    slug_key=slug_parts[1],
                    publish_date__contained_by=publish_date_range
                )
            except Package.DoesNotExist:
                # If the previous condition failed (and assuming there _is_ an
                # item that matches this date slug), 2 things are true:
                # - This item has a date-granularity of 1 week.
                # - The week to which this item is set spans two months.

                # Instead of looking for an exact match, just find any packages
                # whose dates intersect the current month.
                return self.get(
                    hub=slug_parts[0],
                    slug_key=slug_parts[1],
                    publish_date__contained_by=publish_date_range
                )
