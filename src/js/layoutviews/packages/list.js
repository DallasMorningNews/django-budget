define([
    'marionette',
    'underscore',
    'misc/tpl',
    'collectionviews/packages/package-collection',
    'itemviews/packages/date-filter',
    'itemviews/packages/search-box',
    'misc/settings'
], function(
    Mn,
    _,
    tpl,
    PackageCollectionView,
    DateFilterView,
    SearchBoxView,
    settings
) {
    return Mn.LayoutView.extend({
        id: 'package-archive',
        template: tpl('packages-list'),
        regions: {
            dateFilter: "#filter-holder #date-filter",
            searchBox: "#filter-holder #search-box",
            packages: "#package-list"
        },

        initialize: function() {
            this._radio = Backbone.Wreqr.radio.channel('global');

            this.packageCollection = this.options.boundData.packageCollection;

            this.dateFilterView = new DateFilterView({});
            this.searchBoxView = new SearchBoxView({
                data: this.options.data
            });

            this.collectionView = new PackageCollectionView({
                collection: this.packageCollection,
                currentUser: this.options.currentUser,
                hubs: this.options.data.hubs,
                state: this.options.state,
            });

            this._radio.commands.setHandler(
                'switchListDates',
                function(dates) {
                    var newPackagesURL = settings.urlConfig.packageEndpoint;
                    if (!_.isEmpty(dates)) {
                        newPackagesURL = newPackagesURL + dates.start + '/' + dates.end + '/';
                    }

                    this.packageCollection.url = newPackagesURL;
                    this.packageCollection.fetch({
                        success: function (collection, response, options)  {
                            collection.filterAnd(
                                this.options.state.queryTerms,
                                {hubs: this.options.data.hubs}
                            );
                        }.bind(this)
                    });
                }.bind(this),
                this
            );
        },

        onRender: function() {
            this.showChildView('dateFilter', this.dateFilterView);
            this.showChildView('searchBox', this.searchBoxView);

            this.showChildView('packages', this.collectionView);
        }
    });
});