define([
    'backbone',
    'marionette',
    'itemviews/packages/package',
    'itemviews/packages/no-package'
], function(
    Backbone,
    Mn,
    PackageView,
    NoPackagesView
) {
    return Mn.CollectionView.extend({
        childView: PackageView,

        collectionEvents: {
            'updateQuery': 'render'
        },

        initialize: function() {
            // Hook into our global Wreqr channel.
            this._radio = Backbone.Wreqr.radio.channel('global');

            this._radio.commands.setHandler(
                'pushQueryTerm',
                function(queryObject) {
                    this.options.state.queryTerms.push(queryObject);

                    this.options.collection.filterAnd(
                        this.options.state.queryTerms,
                        {
                            hubs: this.options.hubs
                        }
                    );
                },
                this
            );

            this._radio.commands.setHandler(
                'popQueryTerm',
                function(queryValue) {
                    this.options.state.queryTerms.remove(
                        this.options.state.queryTerms.where({
                            value: queryValue
                        })
                    );

                    this.options.collection.filterAnd(
                        this.options.state.queryTerms,
                        {
                            hubs: this.options.hubs
                        }
                    );
                },
                this
            );
        },

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