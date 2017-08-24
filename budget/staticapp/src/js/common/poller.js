import Backbone from 'backbone';
import jQuery from 'jquery';
import Mn from 'backbone.marionette';
import _ from 'underscore';


let pollInterval = 30 * 60 * 1000;


export default Mn.Object.extend({
  initialize(options) {
    this.requestConfig = (_.has(options, 'requestConfig')) ? options.requestConfig : {};

    if (this.options.isPolling === false) {
      this.isPolling = false;
    } else {
      this.commencePolling();
    }

    pollInterval = (
      _.has(options, 'pollInterval')
    ) ? (
      options.pollInterval
    ) : (
      30 * 60 * 1000
    );
  },

  isActive: [],

  poll() {
    _.each(this.active, (datum) => {
      if (datum.static === true) {
        // eslint-disable-next-line no-console
        console.info(`[poller] Skipping update for static data from ${datum.url()}`);
        return;
      }
      if (datum instanceof Backbone.Model) {
        // eslint-disable-next-line no-console
        console.info(`[poller] Updating model from ${datum.url}`);
      } else if (datum instanceof Backbone.Collection) {
        // eslint-disable-next-line no-console
        console.info(`[poller] Updating collection from ${datum.url}`);
      }

      datum.fetch(this.requestConfig);
    });
  },

  commencePolling() {
    this.isPolling = true;

    this.interval = window.setInterval(
      this.poll.bind(this),
      pollInterval  // eslint-disable-line comma-dangle
    );
  },

  /**
  * When passed an array of models/collections/etc., fetch the data
  * for all of them and poll for updates until they're killed.
  */
  get(data, options) {
    let loadingDeferreds = null;

    if (!_.isUndefined(this.active) && this.active.length > 0) {
      // eslint-disable-next-line no-console
      console.info('[poller] Releasing active data.');
      this.active = [];
    }

    loadingDeferreds = _.map(data, datum => datum.fetch(options));

    // eslint-disable-next-line no-console
    console.info('[poller] Loading new active data.');

    this.isPolling = true;

    this.active = data;

    return jQuery.when.apply(this, loadingDeferreds);
  },

  pause(options) {
    const opts = options || { muteConsole: null };
    const muteConsole = (
        _.isBoolean(opts.muteConsole)
    ) ? opts.muteConsole : false;

    if (this.isPolling) {
      window.clearInterval(this.interval);
      if (!muteConsole) {
        // eslint-disable-next-line no-console
        console.info('[poller] Polling paused.');
      }
      this.isPolling = false;
    }
  },

  resume(options) {
    const opts = options || { muteConsole: null };
    const muteConsole = (
        _.isBoolean(opts.muteConsole)
    ) ? opts.muteConsole : false;

    if (!this.isPolling) {
      if (!muteConsole) {
        // eslint-disable-next-line no-console
        console.info('[poller] Polling resumed.');
      }
      this.commencePolling();
    }
  },

  onBeforeDestroy() {
    if (this.isPolling) {
      this.pause();
    }
  },
});
