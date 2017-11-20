# Imports from other dependencies.  # NOQA
from psycopg2.extras import DateRange
from psycopg2.extras import DateTimeTZRange
from rest_framework import serializers
from rest_framework.serializers import ModelSerializer


# Imports from budget.
from budget.models import Change
from budget.models import ContentPlacement
from budget.models import Headline
from budget.models import HeadlineVote
from budget.models import Item
from budget.models import Package
from budget.models import PrintPublication
# from budget.models import PrintSection


class UserMetadataMixin(object):
    """Mixin that adds an audit trail to REST operations.

    On change, creates a ChangeRecord module with user and model info.
    On create, adds user info to model before save. Base class should
    implement _get_package(), which will be used to get related package
    for ChangeRecord.
    """
    def _get_user(self):
        """Get the user making the request."""
        user = None
        request = self.context.get('request')
        if request and hasattr(request, 'user'):
            user = request.user
        return user

    def _get_package(self, instance):
        """Get package instance for any models able to connect to them.

        Works on any models that can connect to a package (even those
        that connect indirectly). Serializers should override this to
        implement model-specific logic.
        """
        return None

    def create(self, validated_data):
        """Fill in model's created_by field with appropriate value.

        Sets this field value to the requesting user's primary key.
        """
        validated_data['created_by'] = self._get_user().id
        return super(UserMetadataMixin, self).create(validated_data)

    def update(self, instance, validated_data):
        """Model-update behavior.

        On update, let REST Framework do its usual saving for the
        affected instance. Then save a change record once that update
        has completed.
        """
        instance = super(
            UserMetadataMixin, self).update(instance, validated_data)

        Change.objects.create(
            by=self._get_user().id,
            item_id=instance.pk,
            item_content_type=instance._meta.model_name,
            package=self._get_package(instance)
        )
        return instance


class EmptyArrayJsonField(serializers.JSONField):
    """Field serializer for JSONFields.

    Returns an empty array when the JSONField is null, giving API
    consumers a more reliable data type.
    """
    def get_attribute(self, instance):
        attr = super(EmptyArrayJsonField, self).get_attribute(instance)
        if attr is None:
            return []
        return attr


class DateRangeField(serializers.ListField):
    """Custom serializer for django.postgres.fields.DateRangeFields.

    Only supports storing ranges with defined upper and lower bounds.
    """
    child = serializers.DateField()
    range_class = DateRange

    def to_representation(self, obj):
        return [obj.lower, obj.upper]

    def to_internal_value(self, data):
        data = super(DateRangeField, self).to_internal_value(data)

        try:
            lower = data[0]
            upper = data[1]
        except IndexError:
            raise serializers.ValidationError(
                'Incorrect format. Expected an Array with two items.')

        if lower >= upper:
            raise serializers.ValidationError(
                'The upper date bound must be greater than the lower bound.')

        return self.range_class(lower=lower, upper=upper)


class DateTimeRangeField(DateRangeField):
    """Custom serializer for django.postgres.fields.DateTimeRangeFields.

    Works just like DateRangeField serializer.
    """
    child = serializers.DateTimeField()
    range_class = DateTimeTZRange


class ContentPlacementSerializer(UserMetadataMixin, ModelSerializer):
    package = serializers.PrimaryKeyRelatedField(
        required=True,
        many=False,
        queryset=Package.objects.all()
    )
    destination = serializers.PrimaryKeyRelatedField(
        required=True,
        many=False,
        queryset=PrintPublication.objects.all()
    )
    run_date = DateRangeField(allow_null=True, required=False)

    class Meta:  # NOQA
        model = ContentPlacement
        read_only_fields = (
            # 'slug',
            'created_by',
        )
        fields = (
            'id',
            'url',
            'package',  # ForeignKey.
            'destination',  # ForeignKey.
            'placement_types',  # ArrayField.
            'page_number',  # PositiveSmallIntegerField.
            'placement_details',  # CharField.
            'run_date',  # Date range.
            'external_slug',  # CharField.
            'is_finalized',  # Bool.
            'created_by',
        )
        extra_kwargs = {
            'url': {'view_name': 'budget:contentplacement-detail'},
        }


class HeadlineSerializer(UserMetadataMixin, ModelSerializer):
    def _get_package(self, instance):
        return instance.package

    class Meta:  # NOQA
        model = Headline
        fields = ('id', 'url', 'package', 'text', 'winner')
        extra_kwargs = {
            'url': {'view_name': 'budget:headline-detail'},
        }


class HeadlineVoteSerializer(UserMetadataMixin, ModelSerializer):
    def _get_package(self, instance):
        return instance.headline.package

    class Meta:  # NOQA
        model = HeadlineVote
        fields = ('id', 'url', 'headline', 'voter', 'timestamp')
        extra_kwargs = {
            'url': {'view_name': 'budget:headlinevote-detail'},
        }


class ItemSerializer(UserMetadataMixin, ModelSerializer):
    editors = EmptyArrayJsonField(allow_null=True, required=False)
    authors = EmptyArrayJsonField()

    slug = serializers.ReadOnlyField(source='full_slug')

    def _get_package(self, instance):
        if instance.primary_for_package:
            return instance.primary_for_package
        elif instance.additional_for_package:
            return instance.additional_for_package

    def validate_authors(self, value):
        """Ensure at least one author is provided"""
        if value is None or len(value) == 0:
            raise serializers.ValidationError(
                'At least one author is required.')
        return value

    def validate(self, attrs):
        """Run model validation that REST doesn't run automatically.

        Specifically, calls Item.full_clean() for validation since REST
        doesn't call it by default.
        """
        # Only validate if both primary and additional exist (it could be a
        # PATCH)
        if 'primary_for_package' in attrs \
                and 'additional_for_package' in attrs:
            if attrs.get('primary_for_package', None) is None and \
                    attrs['additional_for_package'] is None:
                err_msg = ('Items must be connected to a package as either '
                           'primary or additional content.')
                raise serializers.ValidationError({
                    'primary_for_package': err_msg,
                    'additional_for_package': err_msg
                })
            if attrs['primary_for_package'] is not None and \
                    attrs['additional_for_package'] is not None:
                err_msg = ('Items cannot be connected to a package as both '
                           'primary and additional content.')
                raise serializers.ValidationError({
                    'primary_for_package': err_msg,
                    'additional_for_package': err_msg
                })
        return super(ItemSerializer, self).validate(attrs)

    class Meta:  # NOQA
        model = Item
        read_only_fields = (
            'slug',
            'created_by',
        )
        fields = (
            'id',
            'url',
            'slug_key',
            'slug',
            'type',
            'editors',
            'authors',
            'is_ready',
            'budget_line',
            'length',
            'primary_for_package',
            'additional_for_package',
            'created_by',
        )
        extra_kwargs = {
            'url': {'view_name': 'budget:item-detail'},
        }


class PackageSerializer(UserMetadataMixin, ModelSerializer):
    publish_date = DateTimeRangeField()
    # print_run_date = DateRangeField(allow_null=True, required=False)

    primary_content = serializers.PrimaryKeyRelatedField(read_only=True)
    additional_content = serializers.PrimaryKeyRelatedField(
        required=False,
        many=True,
        queryset=Item.objects.all()
    )
    headline_candidates = serializers.PrimaryKeyRelatedField(
        required=False,
        many=True,
        queryset=Headline.objects.all()
    )
    # print_section = serializers.PrimaryKeyRelatedField(
    #     required=False,
    #     many=True,
    #     queryset=PrintSection.objects.all()
    # )

    slug = serializers.ReadOnlyField(source='full_slug')
    slug_date = serializers.ReadOnlyField(source='slugified_date')

    def _get_package(self, instance):
        return instance

    class Meta:  # NOQA
        model = Package
        read_only_fields = (
            'created_by',
            'slug',
        )
        fields = (
            'id',
            'url',
            'vertical',
            'hub',
            'slug',
            'slug_date',
            'slug_key',
            'pub_date',
            'pub_date_resolution',
            'publish_date',
            'publish_date_resolution',
            'published_url',
            'headline_status',
            'headline_candidates',
            # 'print_run_date',
            # 'print_system_slug',
            # 'print_placements',
            # 'print_section',
            # 'is_print_placement_finalized',
            'notes',
            'primary_content',
            'additional_content',
            'created_by',
        )
        extra_kwargs = {
            'url': {'view_name': 'budget:package-detail'},
        }


class PrintPublicationSerializer(ModelSerializer):
    class Meta:  # NOQA
        depth = 1
        model = PrintPublication
        fields = (
            'id',
            'url',
            'name',
            'slug',
            'priority',
            'is_active',
            'sections'
        )
        extra_kwargs = {
            'url': {'view_name': 'budget:printpublication-detail'},
        }
