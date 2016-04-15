define([
    'backbone',
    'marionette',
    'underscore',
    'itemviews/packages/package',
    'itemviews/packages/no-package'
], function(
    Backbone,
    Mn,
    _,
    PackageView,
    NoPackagesView
) {
    return Mn.CollectionView.extend({
        childView: PackageView,

        collectionEvents: {
            'updateQuery': 'render'
        },

        // initialize: function() {
        //     // Hook into our global Wreqr channel.
        //     this._radio = Backbone.Wreqr.radio.channel('global');
        // },

        childViewOptions: function(model, index) {
            return {
                currentUser: this.options.currentUser,
                hubConfigs: this.options.hubs,
            };
        },

        filter: function(child, index, collection) {
            if (_.contains(collection.queryFiltered, child)) {
                return true;
            }

            return false;
        },

        isEmpty: function(collection) {
            return _.isEmpty(collection.queryFiltered);
        },

        getEmptyView: function() {
            // custom logic
            return NoPackagesView;
        },

        // id: '',
        // template: tpl('packages-list'),
        // className: 'center-content',
        // regions: {
        //     filters: "#filters",
        //     packages: "#packages"
        // },

        // initialize: function() {
        //     this.packageFilterView = new PackageFilterView({});
        //     this.packageCollectionView = new ({});
        // },

        // onBeforeShow: function() {
        //     this.showChildView('filters', this.packageFilterView);
        //     this.showChildView('packages', this.packageCollectionView);
        // }
    });
});