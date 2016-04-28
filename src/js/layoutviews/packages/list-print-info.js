define([
    'underscore',
    'misc/tpl',
    'collections/packages',
    'collectionviews/packages/package-collection',
    'itemviews/list-components/print/daily-title',
    'itemviews/list-components/print/print-placement-toggle',
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
    DailyTitleView,
    PrintPlacementToggleView,
    DateFilterView,
    PackageItemPrintView,
    SearchBoxView,
    PackageListBase,
    settings
) {
    return PackageListBase.extend({
        template: tpl('packages-list-print'),

        regions: {
            dailyTitle: '#filter-holder #daily-title',
            dateFilter: '#filter-holder #date-filter',
            searchBox: '#filter-holder #search-box',
            printPlacementToggle: '#filter-holder #print-placement-toggle',
            packages: '#package-list'
        },

        packageItemView: PackageItemPrintView,
        stateKey: 'printList',
        urlBase: '/print/',

        extraChildViews: {
            dailyTitle: DailyTitleView,
            printPlacementToggle: PrintPlacementToggleView,
        },

        extraQueryTerms: [
            'printPlacement'
        ],

        extendInitialize: function() {
            var selectedPrintPlacement = 'all';

            if (_.has(this.initialState.extraContext, 'printPlacement')) {
                var placementRaw = this.initialState.extraContext.printPlacement;

                if (_.contains(
                    _.pluck(settings.printPlacementTypes, 'slug'),
                    placementRaw
                )) {
                    selectedPrintPlacement = placementRaw;
                } else if (placementRaw == 'all') {
                    selectedPrintPlacement = placementRaw;
                }
            }

            if (_.isUndefined(this._radio.reqres.request(
                'getState',
                this.stateKey,
                'currentPrintPlacement'
            ))) {
                this._radio.commands.execute(
                    'setState',
                    this.stateKey,
                    'currentPrintPlacement',
                    selectedPrintPlacement
                );
            }
        },

        extendGenerateQuerystring: function(existingQueryString) {
            var commonPrintPlacement = this._radio.reqres.request(
                'getState',
                this.stateKey,
                'currentPrintPlacement'
            );

            if (!_.isUndefined(commonPrintPlacement)) {
                if (commonPrintPlacement != 'all') {
                    if (existingQueryString !== '') {
                        existingQueryString += '&';
                    }

                    existingQueryString += 'printPlacement=' + commonPrintPlacement;
                }
            }

            return existingQueryString;
        },

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