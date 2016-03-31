define([
    'marionette',
    'misc/tpl',
    'collectionviews/packages/package-collection',
    'itemviews/packages/date-filter',
    'itemviews/packages/search-box'
], function(
    Mn,
    tpl,
    PackageCollectionView,
    DateFilterView,
    SearchBoxView
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
            this.packageCollection = this.options.boundData.packageCollection;

            this.dateFilterView = new DateFilterView({});
            this.searchBoxView = new SearchBoxView({
                searchOptions: this.options.data.searchOptions
            });

            this.collectionView = new PackageCollectionView({
                collection: this.packageCollection,
                currentUser: this.options.currentUser,
                hubs: this.options.data.hubs,
                state: this.options.state,
            });
        },

        onRender: function() {
            this.showChildView('dateFilter', this.dateFilterView);
            this.showChildView('searchBox', this.searchBoxView);

            this.showChildView('packages', this.collectionView);
        }
    });
});