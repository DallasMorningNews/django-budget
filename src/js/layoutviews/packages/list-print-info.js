define([
    'underscore',
    'misc/tpl',
    'collections/packages',
    'collectionviews/packages/package-collection',
    'itemviews/packages/date-filter',
    'itemviews/packages/package-print-info',
    'itemviews/packages/search-box',
    'layoutviews/packages/list-base',
    'misc/settings'
], function(
    _,
    tpl,
    PackageCollection,
    PackageCollectionView,
    DateFilterView,
    PackageItemPrintView,
    SearchBoxView,
    PackageListBase,
    settings
) {
    return PackageListBase.extend({
        template: tpl('packages-list'),

        packageItemView: PackageItemPrintView,
        stateKey: 'printList',
        urlBase: '/print/',

        generateCollectionURL: function() {
            var dateRange = this._radio.reqres.request(
                    'getState',
                    this.stateKey,
                    'dateRange'
                ),
                newPackagesURL = settings.urlConfig.getEndpoints.package.list.print;

            if (!_.isEmpty(dateRange)) {
                newPackagesURL = newPackagesURL +
                                    dateRange.start + '/' +
                                    dateRange.end + '/';
            }

            return newPackagesURL;
        },
    });
});