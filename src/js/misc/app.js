define(
    [
        'backbone',
        'foundation',
        'jquery',
        'marionette',
        'collections/hubs',
        'collections/query-terms',
        'collections/staffers',
        'layoutviews/root-view',
        'misc/router',
        'misc/settings'
    ],
    function(
        Backbone,
        Foundation,
        $,
        Mn,
        HubCollection,
        QueryTermCollection,
        StafferCollection,
        RootView,
        Router,
        settings
    ) {
        'use strict';

        // Enable Marionette Inspector
        if (window.__agent) {
            window.__agent.start(Backbone, Marionette);
        }

        return Mn.Application.extend({
            initialize: function(opts) {
                // Hook into our global Wreqr channel.
                this._radio = Backbone.Wreqr.radio.channel('global');

                // Add a ReqRes handler to allow controllers to fetch
                // data of our app instance.
                this._radio.reqres.setHandler('data', function(type){
                    return this.data[type];
                }, this);
            },

            bootstrapData: function() {
                /**
                 * Bootstrap app data
                 */
                this.data = {};

                /**
                 * Instantiate collections and models, storing our data
                 * on the app class for later access w/ reqres.
                 */
                this.data.hubs = new HubCollection();
                this.data.staffers = new StafferCollection();

                /**
                 * Return a deferred object for when all the data's loaded.
                 */
                return $.when(
                    this.data.hubs.fetch(),
                    this.data.staffers.fetch()
                );
            },

            onBeforeStart: function() {
                /**
                 * Instantiate the root view.
                 */
                this.state = {
                    selectizeType: 'and',
                    dateRange: {},
                };

                this.state.queryTerms = new QueryTermCollection();

                this.rootView = new RootView({
                    currentUser: this.options.currentUser,
                    data: this.data,
                    state: this.state,
                });
            },

            onStart: function() {
                this.rootView.render();

                this.router = new Router();

                /**
                 * Add a Wreqr command to allow other modules to trigger navigation
                 */
                this._radio.commands.setHandler('navigate', function(path, options){
                    this.router.navigate(path, options);
                }, this);

                Backbone.history.start();
            }
        });
    }
);