define(
    [
        'backbone',
        'jquery',
        'marionette',
        'headline/layoutviews/root-view'
    ],
    function(
        Backbone,
        $,
        Mn,
        RootView
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

                this.currentUser = {
                    email: 'test.user@dallasnews.com'
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
                // this.data.hubs = new HubCollection();
                // this.data.staffers = new StafferCollection();

                /**
                 * Return a deferred object for when all the data's loaded.
                 */
                return $.when(
                    // this.data.hubs.fetch(),
                    // this.data.staffers.fetch(),
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
                    // selectizeType: 'and',
                };

                this.rootView = new RootView({
                    currentUser: this.currentUser,
                    data: this.data,
                    state: this.state,
                });
            },

            onStart: function() {
console.log('Started.');
                this.rootView.render();

                // var CustomRouter = NamedRouter.extend({
                //     controller: BudgetController,
                //     namedAppRoutes: urlConfig,
                // });

                // this.router = new CustomRouter();

                /**
                 * Add a Wreqr command to allow other modules to trigger navigation
                 */
                // this._radio.commands.setHandler('navigate', function(path, options){
                //     this.router.navigate(path, options);
                // }, this);

                // Backbone.history.start({
                //     pushState: true
                // });
            }
        });
    }
);