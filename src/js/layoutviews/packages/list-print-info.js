define([
    'itemviews/packages/package-print-info',
    'layoutviews/packages/list-base'
], function(
    PacakgeItemPrintView,
    PackageListBase
) {
    return PackageListBase.extend({
        packageItemView: PacakgeItemPrintView,
        suppliedDateRange: 'pubDateRange'
    });
});
