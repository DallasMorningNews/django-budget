import Backbone from 'backbone';
import jQuery from 'jquery';
import Mn from 'backbone.marionette';
import _ from 'underscore';

import settings from './settings';

export default Mn.Object.extend({
    initialize(options) {
        this.requestConfig = (_.has(options, 'requestConfig')) ? options.requestConfig : {};

        if (this.options.isPolling === false) {
            this.isPolling = false;
        } else {
            this.commencePolling();
        }
    },

    isActive: [],

    poll() {
        _.each(this.active, (datum) => {
            if (datum.static === true) {
                console.info(  // eslint-disable-line no-console
                  `[poller] Skipping update for static data from ${datum.url()}`
                );
                return;
            }
            if (datum instanceof Backbone.Model) {
                console.info(  // eslint-disable-line no-console
                    `[poller] Updating model from ${datum.url}`
                );
            } else if (datum instanceof Backbone.Collection) {
                console.info(  // eslint-disable-line no-console
                    `[poller] Updating collection from ${datum.url}`
                );
            }

            datum.fetch(this.requestConfig);
        });
    },

    commencePolling() {
        this.isPolling = true;

        this.interval = window.setInterval(
            this.poll.bind(this),
            settings.pollInterval
        );
    },

    /**
     * When passed an array of models/collections/etc., fetch the data
     * for all of them and poll for updates until they're killed.
     */
    get(data, options) {
        let loadingDeferreds = null;

        if (!_.isUndefined(this.active) && this.active.length > 0) {
            console.info(  // eslint-disable-line no-console
                '[poller] Releasing active data.'
            );
            this.active = [];
        }

        loadingDeferreds = _.map(data, datum => datum.fetch(options));

        console.info(  // eslint-disable-line no-console
            '[poller] Loading new active data.'
        );

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
                console.info('[poller] Polling paused.');  // eslint-disable-line no-console
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
                console.log('[poller] Polling resumed.');  // eslint-disable-line no-console
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
