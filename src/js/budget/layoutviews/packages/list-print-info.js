define([
    'underscore',
    'common/settings',
    'common/tpl',
    'budget/collections/packages',
    'budget/collectionviews/packages/package-collection',
    'budget/itemviews/list-components/print/daily-title',
    'budget/itemviews/list-components/print/print-placement-toggle',
    'budget/itemviews/packages/date-filter',
    'budget/itemviews/packages/package-print-info',
    'budget/itemviews/packages/search-box',
    'budget/layoutviews/packages/list-base'
], function(
    _,
    settings,
    tpl,
    PackageCollection,
    PackageCollectionView,
    DailyTitleView,
    PrintPlacementToggleView,
    DateFilterView,
    PackageItemPrintView,
    SearchBoxView,
    PackageListBase
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
            {
                urlSlug: 'printPlacement',
                parseFunction: function(pkg, stringToMatch, extraContext) {
                    return _.contains(
                        pkg.get('printPlacement').printPlacements,
                        stringToMatch
                    );
                }
            }
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

            // Handler for removing a query term.
            this._radio.commands.setHandler(
                'updateQueryElements',
                function() {
                    this.updateQuery(this.packageCollection);
                    this.updateQuerystring();
                },
                this
            );
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
                newPackagesURL = settings.apiEndpoints.GET.package.list.print;

            if (!_.isEmpty(dateRange)) {
                newPackagesURL = newPackagesURL +
                                    dateRange.start + '/' +
                                    dateRange.end + '/';
            }

            return newPackagesURL;
        },
    });
});