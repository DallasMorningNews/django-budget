# Imports from Django.  # NOQA
from django.contrib import admin


# Imports from other dependencies.
from adminsortable2.admin import SortableInlineAdminMixin


# Imports from budget.
from budget.models import Change
from budget.models import ContentPlacement
from budget.models import Headline
from budget.models import HeadlineVote
from budget.models import Item
from budget.models import Package
from budget.models import PrintPublication
from budget.models import PrintSection


admin.site.register(Headline)
admin.site.register(HeadlineVote)


class ContentPlacementInline(admin.StackedInline):
    model = ContentPlacement
    extra = 0
    fields = (
        'destination',
        ('run_date', 'external_slug',),
        ('placement_types', 'placement_details',),
        'is_finalized',
    )


@admin.register(Package)
class PackageAdmin(admin.ModelAdmin):
    """Admin config for budget packages."""
    list_display = ('full_slug', 'hub', 'scheduled_publish_date')
    list_filter = ('hub', 'vertical',)
    ordering = ('-id',)
    fieldsets = (
        (None, {
            'fields': ('vertical', 'hub')
        }),
        ('Digital publishing info', {
            'fields': ('publish_date', 'published_url', 'notes')
        }),
        # ('Print publishing info', {
        #     'fields': (
        #         'print_section',
        #         'print_system_slug',
        #         'print_run_date',
        #         'print_placements',
        #         'is_print_placement_finalized'
        #     )
        # }),
        ('Headlines', {
            'fields': ('headline_status',)
        }),
        ('Debugging info', {
            'fields': ('created_by', 'last_changed_by_old',)
        })
    )
    inlines = [
        ContentPlacementInline
    ]

    def scheduled_publish_date(self, obj):
        return '%s (%s)' % (
            obj.publish_date.lower.strftime('%B %-d, %Y'),
            obj.publish_date_resolution()
        )


@admin.register(Item)
class ItemAdmin(admin.ModelAdmin):
    """Admin config for budget items."""
    fieldsets = (
        (None, {
            'fields': ('slug_key',)
        }),
        ('Related package', {
            'fields': ('primary_for_package', 'additional_for_package',)
        }),
        ('Budget info', {
            'fields': ('type', 'budget_line', 'length', 'is_ready')
        }),
        ('Authors', {
            'fields': ('authors', 'editors')
        })
    )
    list_display = ('full_slug', 'type', 'is_primary',)
    list_filter = ('type',)
    ordering = ('-id',)

    def get_queryset(self, request):
        qs = super(ItemAdmin, self).get_queryset(request)
        return qs.select_related(
            'primary_for_package',
            'additional_for_package'
        )

    def is_primary(self, obj):
        if obj.primary_for_package:
            return True
        return False
    is_primary.boolean = True


class PrintSectionInline(SortableInlineAdminMixin, admin.TabularInline):
    model = PrintSection
    extra = 0


@admin.register(PrintPublication)
class PrintPublicationAdmin(admin.ModelAdmin):
    """Admin config for print publications."""
    fieldsets = (
        (None, {
            'fields': (
                'name',
                'priority',
                'is_active'
            )
        }),
        ("Don't touch unless you know what you're doing", {
            'classes': ('collapse',),
            'fields': ('slug',),
        }),
    )
    inlines = [PrintSectionInline]
    prepopulated_fields = {
        'slug': ('name',)
    }


@admin.register(Change)
class ChangeAdmin(admin.ModelAdmin):
    """Admin config for budget-item change records."""
    list_display = ('pk', 'by_user', 'at', 'package', 'item',
                    'item_content_type', 'item_id',)
    list_filter = ('item_content_type',)
    date_hierarchy = 'at'

    def get_queryset(self, request):
        return super(ChangeAdmin, self)\
            .get_queryset(request)\
            .select_related('package', 'package__primary_content')\
            .prefetch_related('by_user', 'item')
