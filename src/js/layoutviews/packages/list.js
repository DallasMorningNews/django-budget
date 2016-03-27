define([
    'backbone',
    'marionette',
    'misc/tpl',
    'itemviews/packages/date-filter',
    'itemviews/packages/search-box',
    'collectionviews/packages/package-collection'
], function(
    Backbone,
    Mn,
    tpl,
    DateFilterView,
    SearchBoxView,
    PackageCollectionView
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
            this.dateFilterView = new DateFilterView({});
            this.searchBoxView = new SearchBoxView({
                searchOptions: this.options.data.searchOptions
            });

            this.collectionView = new PackageCollectionView({
                collection: this.options.data.packages,
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