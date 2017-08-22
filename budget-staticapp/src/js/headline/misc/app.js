import _ from 'underscore';
import Backbone from 'backbone';
import jQuery from 'jquery';
import Mn from 'backbone.marionette';

import RootView from '../layoutviews/root-view';

// Enable Marionette Inspector
if (window.__agent) {  // eslint-disable-line no-underscore-dangle
    window.__agent.start(Backbone, Mn);  // eslint-disable-line no-underscore-dangle
}

export default Mn.Application.extend({
    initialize(opts) {  // eslint-disable-line no-unused-vars
        // Hook into our global Wreqr channel.
        this.radio = Backbone.Wreqr.radio.channel('global');

        this.currentUser = {
            email: 'test.user@dallasnews.com',
        };
    },

    bootstrapData() {
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
        return jQuery.when(
            // this.data.hubs.fetch(),
            // this.data.staffers.fetch(),
            jQuery.ajax({
                dataType: 'json',
                url: '/user-info/',
            }).done(this.handleUserData.bind(this))
        );
    },

    handleUserData(data) {
        // Overwrite 'this.currentUser' with a user's
        // actual profile information.
        if (!_.isEmpty(data)) {
            this.currentUser = data;
        }
    },

    onBeforeStart() {
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

    onStart() {
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
    },
});
