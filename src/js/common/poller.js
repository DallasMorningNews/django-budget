define(
    [
        'backbone',
        'jquery',
        'marionette',
        'underscore',
        'common/settings',
    ],
    function(
        Backbone,
        $,
        Mn,
        _,
        settings
    ) {
        'use strict';

        // var radio = Backbone.Wreqr.radio.channel('global');

        return Mn.Object.extend({
            initialize: function(options) {
                this.requestConfig = (_.has(options, 'requestConfig')) ? options.requestConfig : {};

                if (this.options.isPolling === false) {
                    this.isPolling = false;
                } else {
                    this.commencePolling();
                }
            },

            _active: [],

            _poll: function() {
                _.each(this._active, function(datum) {
                    if (datum.static === true) {
                        console.info(  // eslint-disable-line no-console
                            '[poller] Skipping update for static data from ' + datum.url()
                        );
                        return;
                    }
                    if (datum instanceof Backbone.Model) {
                        console.info(  // eslint-disable-line no-console
                            '[poller] Updating model from ' + datum.url
                        );
                    } else if (datum instanceof Backbone.Collection) {
                        console.info(  // eslint-disable-line no-console
                            '[poller] Updating collection from ' + datum.url
                        );
                    }

                    datum.fetch(this.requestConfig);
                }.bind(this));
            },

            commencePolling: function() {
                this.isPolling = true;

                this.interval = window.setInterval(
                    this._poll.bind(this),
                    settings.pollInterval
                );
            },

            /**
             * When passed an array of models/collections/etc., fetch the data
             * for all of them and poll for updates until they're killed.
             */
            get: function(data, options) {
                var loadingDeferreds;

                if (this._active.length > 0) {
                    console.info(  // eslint-disable-line no-console
                        '[poller] Releasing active data.'
                    );
                    this._active = [];
                }

                loadingDeferreds = _.map(data, function(datum) {
                    return datum.fetch(options);
                }.bind(this));  // eslint-disable-line no-extra-bind

                console.info(  // eslint-disable-line no-console
                    '[poller] Loading new active data.'
                );

                this.isPolling = true;

                this._active = data;

                return $.when.apply(this, loadingDeferreds);
            },

            pause: function(options) {
                var opts = options || {muteConsole: null},
                    muteConsole = (_.isBoolean(opts.muteConsole)) ? opts.muteConsole : false;

                if (this.isPolling) {
                    window.clearInterval(this.interval);
                    if (!muteConsole) {
                        console.info('[poller] Polling paused.');  // eslint-disable-line no-console
                    }
                    this.isPolling = false;
                }
            },

            resume: function() {
                if (!this.isPolling) {
                    this.commencePolling();
                }
            },

            onBeforeDestroy: function() {
                if (this.isPolling) {
                    this.pause();
                }
            },
        });
    }
);
