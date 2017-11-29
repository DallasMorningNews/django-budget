import Backbone from 'backbone';
import jQuery from 'jquery';
import Mn from 'backbone.marionette';
import _ from 'underscore';
import Stickit from 'backbone.stickit';

import deline from '../../vendored/deline';

import NamedRouter from '../../common/router';
import loadSettings from '../../common/settings';
import HubCollection from '../collections/hubs';
import PrintPublicationCollection from '../collections/print-publications';
import StafferCollection from '../collections/staffers';
import RootView from '../layoutviews/root-view';
import BudgetController from '../misc/controller';
import urlConfig from '../misc/urls';

Backbone.Stickit = Stickit;
_.extend(Backbone.View.prototype, Stickit.ViewMixin);

// Enable Marionette Inspector
if (window.__agent) {  // eslint-disable-line no-underscore-dangle
  window.__agent.start(Backbone, Mn);  // eslint-disable-line no-underscore-dangle
}

export default Mn.Application.extend({
  initialize(opts) {  // eslint-disable-line no-unused-vars
    this.initialConfig = opts;

    // Hook into our global Wreqr channel.
    this.radio = Backbone.Wreqr.radio.channel('global');

    // Add a ReqRes handler to allow controllers to fetch
    // data of our app instance.
    this.radio.reqres.setHandler('data', type => this.data[type], this);

    // Handler for getting app state.
    this.radio.reqres.setHandler(
      'getState',
      (overallKey, specificKey) => {
        if (!_.has(this.state, overallKey)) {
          this.state[overallKey] = {};
        }

        if (!_.has(this.state[overallKey], specificKey)) {
          return undefined;
        }

        return this.state[overallKey][specificKey];
      },
      this  // eslint-disable-line comma-dangle
    );

    // Handler for setting app state.
    this.radio.commands.setHandler(
      'setState',
      (overallKey, specificKey, assignee, literalFunction) => {
        let newValue = null;

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
      }  // eslint-disable-line comma-dangle
    );

    this.currentUser = {
      email: 'test.user@dallasnews.com',
    };
  },

  bootstrapData() {
    const dataLoadedPromise = new jQuery.Deferred();

    // Initialize settings and set handler to retrieve individual settings.
    const settingsLoader = loadSettings(this.initialConfig);

    settingsLoader.done((appSettings) => {
      this.settings = appSettings;

      this.radio.reqres.setHandler('getSetting', s => this.settings[s]);

      const userPromise = this.retrieveUser();

      userPromise.done(() => {
        const initialDataPromise = this.loadInitialData();

        initialDataPromise.done(() => {
          dataLoadedPromise.resolve();
        });
      });
    });

    settingsLoader.fail((resp, textStatus, errorThrown) => {
      dataLoadedPromise.fail(resp, textStatus, errorThrown);
    });

    /**
      * Return a deferred object for when all the data's loaded.
      */
    return dataLoadedPromise;
  },

  retrieveUser() {
    /*
     * Load data for the currently logged-in user.
     */
    const userLoaded = new jQuery.Deferred();
    const userInfoRequest = jQuery.ajax({
      dataType: 'json',
      data: { 'success-url': document.location.href },
      url: this.radio.reqres.request('getSetting', 'apiEndpoints').userInfo,
      xhrFields: { withCredentials: true },
    });
    let errorEmailBody = '';

    userInfoRequest.done((data) => {
      this.handleUserData(data);
      userLoaded.resolve();
    });

    userInfoRequest.fail((resp, textStatus, errorThrown) => {
      let errorText = '';
      let snackbarShim = '';

      if (
        (resp.status === 403) &&
        (_.has(resp, 'responseJSON')) &&
        (_.has(resp.responseJSON, 'loginRedirectUrl')) &&
        (!_.isNull(resp.responseJSON.loginRedirectUrl))
      ) {
        window.location.replace(resp.responseJSON.loginRedirectUrl);
      } else {
        if (
            (_.has(resp, 'responseJSON')) &&
            (_.has(resp.responseJSON, 'detail'))
        ) {
          errorText = `Error ${resp.status} (${resp.responseJSON.detail})`;
        } else {
          errorText = `Error ${resp.status}`;
        }

        jQuery('<div id="snackbar-holder"></div>').appendTo('body');

        errorEmailBody = deline`
            Hello. I encountered an error ["${errorText}"] while
            using the budget app.

            The specific error parameters were: ${
                resp.responseText
            }.

            Please note the error, and provide feedback on how I
            can avoid it happening again.
            `;

        snackbarShim = jQuery(deline`
          <div class="snackbar failure 1-line">

              <div class="contents">${errorText} <div class="action-trigger">

                  <a href="mailto:${
                    this.radio.reqres.request('getSetting', 'adminEmail')
                  }?subject=DMN budget app error&body=${
                    encodeURIComponent(errorEmailBody)
                  }"> Report</a>

              </div></div>

          </div>`  // eslint-disable-line comma-dangle
        );
        snackbarShim.appendTo('#snackbar-holder');
        setTimeout(() => { snackbarShim.addClass('active'); }, 0);
      }

      userLoaded.fail(resp, textStatus, errorThrown);
    });

    return userLoaded;
  },

  handleUserData(data) {
    // Overwrite 'this.currentUser' with a user's
    // actual profile information.
    if (!_.isEmpty(data)) {
      this.currentUser = data;
    }
  },

  loadInitialData() {
    const initialDataLoaded = new jQuery.Deferred();

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
    jQuery.when(
      this.data.hubs.fetch({ xhrFields: { withCredentials: true } }),
      this.data.printPublications.fetch({
        data: {
          publication_active: 1,
        },
        xhrFields: {
          withCredentials: true,
        },
      }),
      // eslint-disable-next-line comma-dangle
      this.data.staffers.fetch({ xhrFields: { withCredentials: true } })
    ).done(() => {
      initialDataLoaded.resolve();
    });

    return initialDataLoaded;
  },

  onBeforeStart() {
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

  onStart() {
    this.rootView.render();

    const CustomRouter = NamedRouter.extend({
      controller: BudgetController,
      namedAppRoutes: urlConfig,
    });

    this.router = new CustomRouter();

    /**
     * Add a Wreqr command to allow other modules to trigger navigation
     */
    this.radio.commands.setHandler('navigate', (path, options) => {
      this.router.navigate(path, options);
    }, this);

    const historyDict = { pushState: true };

    const rootURL = this.radio.reqres.request('getSetting', 'rootURL');

    if (rootURL !== null) {
      historyDict.root = rootURL;
    }

    Backbone.history.start(historyDict);
  },
});
