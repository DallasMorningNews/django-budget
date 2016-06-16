define([
    'underscore',
    'common/settings',
    'common/tpl',
    'budget/collections/packages',
    'budget/collectionviews/packages/package-collection',
    'budget/itemviews/packages/date-filter',
    'budget/itemviews/packages/package-web-info',
    'budget/itemviews/packages/search-box',
    'budget/layoutviews/packages/list-base',
], function(
    _,
    settings,
    tpl,
    PackageCollection,
    PackageCollectionView,
    DateFilterView,
    PackageItemWebView,
    SearchBoxView,
    PackageListBase
) {
    return PackageListBase.extend({
        template: tpl('packages-list-web'),

        packageItemView: PackageItemWebView,
        stateKey: 'webList',
        urlBase: '/',

        generateCollectionURL: function() {
            var dateRange = this._radio.reqres.request(
                    'getState',
                    this.stateKey,
                    'dateRange'
                ),
                newPackagesURL = settings.apiEndpoints.GET.package.list.web;

            if (!_.isEmpty(dateRange)) {
                newPackagesURL = newPackagesURL +
                                    dateRange.start + '/' +
                                    dateRange.end + '/';
            }

            return newPackagesURL;
        },
    });
});
