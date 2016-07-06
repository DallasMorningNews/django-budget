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
                var dataLoadedPromise = new $.Deferred(),
                    userPromise = this.retrieveUser();

                userPromise.done(function() {
                    var initialDataPromise = this.loadInitialData();

                    initialDataPromise.done(function() {
                        dataLoadedPromise.resolve();
                    });
                }.bind(this));

                /**
                 * Return a deferred object for when all the data's loaded.
                 */
                return dataLoadedPromise;
            },

            retrieveUser: function() {
                /*
                 * Load data for the currently logged-in user.
                 */
                var userLoaded = new $.Deferred(),
                    userInfoRequest = $.ajax({
                        dataType: 'json',
                        url: settings.apiEndpoints.userInfo,
                        xhrFields: {
                            withCredentials: true,
                        },
                    }),
                    errorEmailBody;

                userInfoRequest.done(function(data) {
                    this.handleUserData(data);
                    userLoaded.resolve();
                }.bind(this));

                userInfoRequest.fail(function(resp, textStatus, errorThrown) {
                    var errorText,
                        snackbarShim;

                    if (
                        (resp.status === 403) &&
                        (_.has(resp, 'responseJSON')) &&
                        (_.has(resp.responseJSON, 'loginRedirectUrl'))
                    ) {
                        window.location.replace(resp.responseJSON.loginRedirectUrl);
                    } else {
                        if (
                            (_.has(resp, 'responseJSON')) &&
                            (_.has(resp.responseJSON, 'detail'))
                        ) {
                            errorText = 'Error ' + resp.status +
                                            ' (' + resp.responseJSON.detail + ')';
                        } else {
                            errorText = 'Error ' + resp.status;
                        }

                        $('<div id="snackbar-holder"></div>').appendTo('body');

                        errorEmailBody =
                            'Hello. I encountered an error ["' + errorText + '"] ' +
                                'while using the budget app.\n\n' +
                            'The specific error parameters were: ' +
                                resp.responseText + '.\n\n' +
                            'Please note the error, and provide feedback on how I ' +
                            'can avoid it happening again.\n\n';

                        snackbarShim = $('' +
                            '<div class="snackbar failure 1-line">' +
                                '<div class="contents">' +
                                    errorText +
                                    '<div class="action-trigger">' +
                                        '<a href="mailto:' + settings.adminEmail + '?' +
                                            'subject=DMN budget app error&' +
                                            'body=' + encodeURIComponent(errorEmailBody) +
                                            '"> Report</a>' +
                                    '</div>' +
                                '</div>' +
                            '</div>'
                        );
                        snackbarShim.appendTo('#snackbar-holder');
                        setTimeout(function() { snackbarShim.addClass('active'); }, 0);
                    }

                    userLoaded.fail(resp, textStatus, errorThrown);
                });

                return userLoaded;
            },

            handleUserData: function(data) {
                // Overwrite 'this.currentUser' with a user's
                // actual profile information.
                if (!_.isEmpty(data)) {
                    this.currentUser = data;
                }
            },

            loadInitialData: function() {
                var initialDataLoaded = new $.Deferred();

                /**
                 * Load all initial data.
                 */
                this.data = {};

                /**
                 * Instantiate collections and models, storing our data
                 * on the app class for later access w/ reqres.
                 */
                this.data.hubs = new HubCollection();
                this.data.printPublications = new PrintPublicationCollection();
                this.data.staffers = new StafferCollection();

                // When all initial data has loaded, resolve the overall deferred object.
                $.when(
                    this.data.hubs.fetch(),
                    this.data.printPublications.fetch({
                        data: {
                            publication_active: 1,
                        },
                        xhrFields: {
                            withCredentials: true,
                        },
                    }),
                    this.data.staffers.fetch()
                ).done(function() {
                    initialDataLoaded.resolve();
                });

                return initialDataLoaded;
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
