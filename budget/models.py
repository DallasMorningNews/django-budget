# Imports from python.  # NOQA
from datetime import timedelta


# Imports from Django.
from django.apps import apps
from django.conf import settings
from django.contrib.auth import get_user_model
from django.contrib.auth.models import AnonymousUser
from django.contrib.postgres.fields import ArrayField
from django.contrib.postgres.fields import DateRangeField
from django.contrib.postgres.fields import DateTimeRangeField
from django.contrib.postgres.fields import JSONField
from django.core.exceptions import ValidationError
from django.db import models
from django.db.models import F
from django.db.models import Func
from django.utils.encoding import python_2_unicode_compatible
from django.utils.timezone import get_current_timezone


# Imports from other dependencies.
import pytz


# Imports from budget.
from budget.querysets import ChangeQuerySet
from budget.querysets import PackageQuerySet
from budget.validators import hub_exists


TZ = pytz.timezone(settings.TIME_ZONE)


class CreationTrailModel(models.Model):
    """Abstract base model for recording changes to content.

    Implements a 'created_by' field to store a user's ID, and a
    'created_at' field that's auto-set to creation time.
    """
    created_by = models.PositiveSmallIntegerField(db_index=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True, editable=False)

    @property
    def created_by_user(self):
        if self.created_by is None:
            return AnonymousUser
        UserModel = get_user_model()
        try:
            return UserModel.objects.get(pk=self.created_by)
        except UserModel.DoesNotExist:
            return None

    class Meta:  # NOQA
        abstract = True


@python_2_unicode_compatible
class Change(models.Model):
    """Model representing a change to any of our budget models.

    Includes some GenericForeignKey-like fields to allow us to link to
    auth models and generically to other models in our app.
    """
    at = models.DateTimeField(auto_now_add=True, editable=False)
    by = models.PositiveSmallIntegerField(db_index=True)
    package = models.ForeignKey(
        'Package',
        related_name='related_changes',
        null=True,
        on_delete=models.CASCADE,
        blank=True
    )

    # Approximate a GenericForeignKey here because we can't have a real one
    # in a multi-db scenario
    item_content_type = models.CharField(db_index=True, max_length=30)
    item_id = models.PositiveIntegerField(db_index=True)

    objects = ChangeQuerySet.as_manager()

    def __str__(self):
        return 'User %s changed %s at %s.' % (
            self.by,
            self.package,
            self.at
        )

    @property
    def item(self):
        if hasattr(self, '_item'):
            return self._item

        Model = apps.get_model(
            app_label='budget', model_name=self.item_content_type)
        try:
            item = Model.objects.get(pk=self.item_id)
        except Model.DoesNotExist:
            item = None
        setattr(self, '_item', item)
        return item

    @property
    def by_user(self):
        if hasattr(self, '_user'):
            return self._user

        UserModel = get_user_model()
        try:
            user = UserModel.objects.get(pk=self.by)
        except UserModel.DoesNotExist:
            user = None
        setattr(self, '_user', user)
        return user

    class Meta:  # NOQA
        ordering = ['-at']


@python_2_unicode_compatible
class PrintPublication(models.Model):
    """Print publication model."""

    name = models.CharField(max_length=100)
    slug = models.SlugField(max_length=100)
    priority = models.PositiveSmallIntegerField(
        default=10,
        help_text=' '.join([
            'In the list of all active print publications,',
            'how high should this entry show up?'
        ]),
    )
    is_active = models.BooleanField(
        'Active?',
        default=True,
        help_text=' '.join([
            'Should this publication be included in the current options',
            'users can choose from?',
            'If false, this publication will be archived,',
            'but it may be re-activated in the future.',
        ]),
    )
    objects = models.Manager()

    class Meta:  # NOQA
        ordering = ['priority', 'is_active', 'slug']
        verbose_name = "publishing destination"

    def __str__(self):
        """String formatting."""
        if not self.is_active:
            return '{} (inactive)'.format(
                self.name
            )
        return self.name


class PrintSectionManager(models.Manager):
    def get_queryset(self):
        return super(
            PrintSectionManager,
            self
        ).get_queryset().select_related('publication')


@python_2_unicode_compatible
class PrintSection(models.Model):
    """Print publication model."""

    name = models.CharField(max_length=100)
    slug = models.SlugField(max_length=100)
    publication = models.ForeignKey(
        PrintPublication,
        related_name='sections',
        on_delete=models.CASCADE,
    )
    priority = models.PositiveSmallIntegerField(
        default=0,
        help_text=' '.join([
            'In the list of all active print publications,',
            'how high should this entry show up?'
        ]),
    )
    is_active = models.BooleanField(
        'Active?',
        default=True,
        help_text=' '.join([
            'Should this publication be included in the current options',
            'users can choose from?',
            'If false, this publication will be archived,',
            'but it may be re-activated in the future.',
        ]),
    )

    objects = PrintSectionManager()

    class Meta:  # NOQA
        ordering = [
            'priority',
            'is_active',
            'slug',
        ]
        verbose_name = "placement type"

    def __str__(self):
        """String formatting."""
        if not self.is_active:
            return '{} > {} (inactive)'.format(
                self.publication.name,
                self.name
            )
        elif not self.publication.is_active:
            return '{} > {} (inactive)'.format(
                self.publication.name,
                self.name
            )
        return '{} > {}'.format(self.publication.name, self.name)


class PackageManager(models.Manager):
    """A manager to JOIN primary_content fields.

    This exists since these fields are used in our string method.
    """

    def get_queryset(self):
        """Retrieve primary_content fields used in our string method.

        Deferrable fields are also enumerated.
        """
        return PackageQuerySet(
            self.model,
            using=self._db
        ).select_related('primary_content').defer(
            'primary_content__editors',
            'primary_content__authors',
            'primary_content__budget_line',
            'primary_content__type',
            'primary_content__is_ready',
            'primary_content__length',
        ).annotate(
            publish_date_upper=Func(
                F('publish_date'), function='UPPER'),
            publish_date_lower=Func(
                F('publish_date'), function='LOWER')
        ).annotate(
            publish_date_len=(
                F('publish_date_upper') - F('publish_date_lower'))
        ).order_by('-publish_date_upper', 'publish_date_len')

    def get_by_slug(self, slug):
        """Retrieve a package by its generated slug.

        Relies on logic in 'budget.models.PackageQuerySet' above.
        """
        return self.get_queryset().get_by_slug(slug)


class Package(CreationTrailModel):
    """Package model."""

    MONTH_RESOLUTION = 'm'
    WEEK_RESOLUTION = 'w'
    DAY_RESOLUTION = 'd'
    TIME_RESOLUTION = 't'
    PUB_DATE_RESOLUTION_CHOICES = (
        (MONTH_RESOLUTION, 'Month'),
        (WEEK_RESOLUTION, 'Week'),
        (DAY_RESOLUTION, 'Day'),
        (TIME_RESOLUTION, 'Time'),
    )

    HEADLINE_DRAFTING_STATUS = 'drafting'
    HEADLINE_VOTING_STATUS = 'voting'
    HEADLINE_FINALIZED_STATUS = 'finalized'
    HEADLINE_STATUS_CHOICES = (
        (HEADLINE_DRAFTING_STATUS, 'Drafting'),
        (HEADLINE_VOTING_STATUS, 'Voting'),
        (HEADLINE_FINALIZED_STATUS, 'Finalized'),
    )

    # Organization
    vertical = models.CharField(max_length=100, blank=True, null=True)
    hub = models.CharField(max_length=100, validators=[hub_exists])

    # Placement
    published_url = models.URLField(blank=True, null=True)
    # print_section = models.ManyToManyField(PrintSection, blank=True)
    # print_run_date_old = models.DateField(blank=True, null=True)
    # print_run_date = DateRangeField(blank=True, null=True)

    slug_key = models.CharField(
        # Package slug keys can be longer than Item slug keys, to allow for
        # suffixes on legacy items.
        max_length=25,
        help_text=' '.join([
            'Miniature package descriptor.',
            'Will be used to generate the slug.'
        ]),
        null=True  # TODO(ajv): Write a migration to disallow nulls
        # once we've migrated primary content items' slugs to this field.
    )

    # print_placements = ArrayField(
    #     models.CharField(max_length=15, blank=True, null=True),
    #     blank=True,
    #     null=True,
    # )
    # print_system_slug = models.CharField(
    #     max_length=250,
    #     blank=True,
    #     null=True
    # )
    # is_print_placement_finalized = models.BooleanField(default=False)

    # TODO(ajv/achavez): Deprecate this in favor of using publish_date
    pub_date = models.DateTimeField(blank=True, null=True, editable=False)
    pub_date_resolution = models.CharField(
        max_length=1,
        choices=PUB_DATE_RESOLUTION_CHOICES,
        default=DAY_RESOLUTION,
        blank=True,
        null=True,
        editable=False
    )
    publish_date = DateTimeRangeField()

    notes = models.TextField(blank=True, null=True)

    # TODO(ajv/achavez): Deprecate this once our change record and creation
    # mixin are fully implemented
    created_by_old = models.EmailField(blank=True, null=True)
    last_changed_by_old = models.EmailField(blank=True, null=True)

    headline_status = models.CharField(
        max_length=9,
        choices=HEADLINE_STATUS_CHOICES,
        default=HEADLINE_DRAFTING_STATUS
    )

    objects = PackageManager()

    class Meta:  # NOQA
        unique_together = ('hub', 'slug_key', 'publish_date')

    def __str__(self):
        """String formatting."""
        return self.full_slug

    @property
    def slugified_date(self):
        """Return the slug-compatible published date.

        Formatted as 'mmddyy' for those items with specific dates, or as
        'mm--yy' for those without.
        """
        pub_date_converted = self.publish_date.lower.astimezone(
            get_current_timezone()
        )

        month_fmt = pub_date_converted.strftime('%m')
        year_fmt = pub_date_converted.strftime('%y')

        if self.publish_date_resolution() in ['w', 'm']:
            day_fmt = '--'
        else:
            day_fmt = pub_date_converted.strftime('%d')

        return '{}{}{}'.format(month_fmt, day_fmt, year_fmt)

    @property
    def full_slug(self):
        return '{}.{}.{}'.format(
            self.hub,
            self.slug_key,
            self.slugified_date
        )

    def publish_date_resolution(self):
        """Approximate the resolution of the publish_date.

        This is calculated from the duration of the
        underlying rangefield.
        """
        time_diff = self.publish_date.upper - self.publish_date.lower

        if time_diff > timedelta(days=27):
            return 'm'
        elif time_diff > timedelta(days=6):
            return 'w'
        elif time_diff > timedelta(hours=23):
            return 'd'
        else:
            return 't'


class Item(CreationTrailModel):
    """Content item model."""

    TEXT_TYPE = 'text'
    PHOTO_TYPE = 'photo'
    VIDEO_TYPE = 'video'
    AUDIO_TYPE = 'audio'
    GRAPHIC_TYPE = 'graphic'
    INTERACTIVE_TYPE = 'interactive'
    AGGREGATION_TYPE = 'aggregation'
    OTHER_TYPE = 'other'
    ITEM_TYPE_CHOICES = (
        (TEXT_TYPE, 'Text'),
        (PHOTO_TYPE, 'Photo'),
        (VIDEO_TYPE, 'Video'),
        (AUDIO_TYPE, 'Audio'),
        (GRAPHIC_TYPE, 'Graphic'),
        (INTERACTIVE_TYPE, 'Interactive'),
        (AGGREGATION_TYPE, 'Aggregation'),
        (OTHER_TYPE, 'Other'),
    )

    # TODO(ajv): Delete this field, after migrating its values.
    slug = models.CharField(max_length=100, db_index=True, editable=False)

    slug_key = models.CharField(
        max_length=20,
        help_text=' '.join([
            'Will be used, with package info, to generate',
            'additional items\' slugs.'
        ]),
        blank=True,
        null=True
    )
    type = models.CharField(
        max_length=25,
        choices=ITEM_TYPE_CHOICES,
        default=TEXT_TYPE,
    )
    editors = JSONField(blank=True, null=True)
    authors = JSONField(blank=True, null=True)
    is_ready = models.BooleanField(default=False)
    budget_line = models.TextField()
    length = models.PositiveIntegerField(
        'Length (in words)',
        blank=True,
        null=True,
        help_text='How long is this article?',
    )
    primary_for_package = models.OneToOneField(
        Package,
        related_name='primary_content',
        blank=True,
        null=True,
        on_delete=models.CASCADE,
    )
    additional_for_package = models.ForeignKey(
        Package,
        related_name='additional_content',
        blank=True,
        null=True,
        on_delete=models.CASCADE,
    )

    class Meta:  # NOQA
        ordering = ['slug_key']

    def __str__(self):
        """String formatting."""
        return self.full_slug

    def clean(self):
        """Ensure that either a primary or additional item is specified.

        If not, raise a ValidationError.
        """
        if not self.primary_for_package and not self.additional_for_package:
            err_msg = ('Items must be connected to a package as either primary'
                       ' or additional content.')
            raise ValidationError({
                'primary_for_package': ValidationError(err_msg),
                'additional_for_package': ValidationError(err_msg)
            })
        if self.primary_for_package and self.additional_for_package:
            err_msg = ('Items cannot be connected to a package as both primary'
                       'and additional content.')
            raise ValidationError({
                'primary_for_package': ValidationError(err_msg),
                'additional_for_package': ValidationError(err_msg)
            })

    def save(self, *args, **kwargs):
        if not self.id and self.primary_for_package:
            self.slug_key = None

        super(Item, self).save(*args, **kwargs)

    @property
    def full_slug(self):
        if self.primary_for_package:
            # return self.primary_for_package.full_slug
            return None

        return '{}.{}'.format(
            self.additional_for_package.full_slug,
            self.slug_key
        )

    def validate_unique(self, *args, **kwargs):
        super(Item, self).validate_unique(*args, **kwargs)

        if not self.id:
            addl = self.additional_for_package
            if addl:
                existing_slug_keys = list(
                    set(
                        addl.additional_content.values_list(
                            'slug_key',
                            flat=True
                        )
                    )
                )

                if self.slug_key in existing_slug_keys:
                    error_msg = ''.join([
                        'Each additional item for this package needs to have',
                        'a unique name.',
                        'Please enter a different value.',
                    ])
                    raise ValidationError({
                        'slug_key': ValidationError(error_msg),
                    })


class ContentPlacement(CreationTrailModel):
    """"""
    package = models.ForeignKey(
        Package,
        related_name='placements',
        on_delete=models.CASCADE
    )

    destination = models.ForeignKey(
        PrintPublication,
        related_name='placed_content',
        on_delete=models.CASCADE
    )
    placement_types = ArrayField(
        models.CharField(max_length=100, blank=True, null=True),
        blank=True,
        null=True,
    )
    page_number = models.PositiveSmallIntegerField(blank=True, null=True)
    placement_details = models.CharField(
        blank=True,
        null=True,
        max_length=25,
        help_text='E.G., print page number.'
    )

    run_date = DateRangeField()

    external_slug = models.CharField(max_length=250, blank=True, null=True)

    is_finalized = models.BooleanField(default=False)

    def __str__(self):
        """String formatting."""
        return '{} in {}'.format(
            self.package.full_slug,
            self.destination.name
        )


@python_2_unicode_compatible
class Headline(models.Model):
    """Headline model."""

    package = models.ForeignKey(
        Package,
        related_name='headline_candidates',
        on_delete=models.CASCADE
    )
    text = models.TextField()
    winner = models.BooleanField(default=False)

    def total_votes(self):
        """Docstring TK."""
        return self.headline_vote.all().count()

    def __str__(self):
        """String formatting."""
        return self.text


@python_2_unicode_compatible
class HeadlineVote(models.Model):
    """Headline vote model."""

    headline = models.ForeignKey(
        Headline,
        related_name='headline_vote',
        on_delete=models.CASCADE
    )
    voter = models.EmailField()
    timestamp = models.DateTimeField(auto_now_add=True)

    class Meta:  # noqa
        unique_together = ("headline", "voter")

    def __str__(self):
        """String formatting."""
        return "{0} for {1}".format(self.voter, self.headline.text)
