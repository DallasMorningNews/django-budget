define(
    [
        'backbone',
        'foundation',
        'jquery',
        'marionette',
        'underscore',
        'common/router',
        'common/settings',
        'budget/collections/hubs',
        'budget/collections/print-publications',
        'budget/collections/staffers',
        'budget/layoutviews/root-view',
        'budget/misc/controller',
        'budget/misc/urls',
    ],
    function(
        Backbone,
        Foundation,
        $,
        Mn,
        _,
        NamedRouter,
        settings,
        HubCollection,
        PrintPublicationCollection,
        StafferCollection,
        RootView,
        BudgetController,
        urlConfig
    ) {
        'use strict';

        // Enable Marionette Inspector
        if (window.__agent) {  // eslint-disable-line no-underscore-dangle
            window.__agent.start(Backbone, Mn);  // eslint-disable-line no-underscore-dangle
        }

        return Mn.Application.extend({
            initialize: function(opts) {  // eslint-disable-line no-unused-vars
                // Hook into our global Wreqr channel.
                this._radio = Backbone.Wreqr.radio.channel('global');

                // Add a ReqRes handler to allow controllers to fetch
                // data of our app instance.
                this._radio.reqres.setHandler('data', function(type) {
                    return this.data[type];
                }, this);

                // Handler for getting app state.
                this._radio.reqres.setHandler(
                    'getState',
                    function(overallKey, specificKey) {
                        if (!_.has(this.state, overallKey)) {
                            this.state[overallKey] = {};
                        }

                        if (!_.has(this.state[overallKey], specificKey)) {
                            return undefined;
                        }

                        return this.state[overallKey][specificKey];
                    },
                    this
                );

                // Handler for setting app state.
                this._radio.commands.setHandler(
                    'setState',
                    function(overallKey, specificKey, assignee, literalFunction) {
                        var newValue;

                        if (!_.has(this.state, overallKey)) {
                            this.state[overallKey] = {};
                        }

                        if (!_.has(this.state[overallKey], specificKey)) {
                            this.state[overallKey][specificKey] = null;
                        }

                        if (!_.isUndefined(assignee)) {
                            if (_.isFunction(assignee)) {
                                if (_.isUndefined(literalFunction) || literalFunction === false) {
                                    newValue = assignee(this.state[overallKey][specificKey]);

                                    if (!_.isUndefined(newValue)) {
                                        this.state[overallKey][specificKey] = newValue;
                                    }
                                } else {
                                    this.state[overallKey][specificKey] = assignee;
                                }
                            } else {
                                this.state[overallKey][specificKey] = assignee;
                            }
                        }
                    }.bind(this)
                );

                this.currentUser = {
                    email: 'test.user@dallasnews.com',
                };
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
                this.data.printPublications = new PrintPublicationCollection();
                this.data.staffers = new StafferCollection();

                /**
                 * Return a deferred object for when all the data's loaded.
                 */
                return $.when(
                    this.data.hubs.fetch(),
                    this.data.printPublications.fetch({xhrFields: {withCredentials: true}}),
                    this.data.staffers.fetch(),
                    $.ajax({
                        dataType: 'json',
                        url: '/user-info/',
                    }).done(this.handleUserData.bind(this))
                );
            },

            handleUserData: function(data) {
                // Overwrite 'this.currentUser' with a user's
                // actual profile information.
                if (!_.isEmpty(data)) {
                    this.currentUser = data;
                }
            },

            onBeforeStart: function() {
                /**
                 * Instantiate the root view.
                 */
                this.state = {
                    selectizeType: 'and',
                };

                this.rootView = new RootView({
                    currentUser: this.currentUser,
                    data: this.data,
                    state: this.state,
                });
            },

            onStart: function() {
                var CustomRouter;

                this.rootView.render();

                CustomRouter = NamedRouter.extend({
                    controller: BudgetController,
                    namedAppRoutes: urlConfig,
                });

                this.router = new CustomRouter();

                /**
                 * Add a Wreqr command to allow other modules to trigger navigation
                 */
                this._radio.commands.setHandler('navigate', function(path, options) {
                    this.router.navigate(path, options);
                }, this);

                Backbone.history.start({pushState: true});
            },
        });
    }
);
