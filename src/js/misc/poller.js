define(
    [
        'backbone',
        'jquery',
        'marionette',
        'underscore',
        'misc/settings'
    ],
    function(
        Backbone,
        $,
        Mn,
        _,
        settings
    ) {
        'use strict';

        var _radio = Backbone.Wreqr.radio.channel('global');

        return Mn.Object.extend({
            initialize: function() {
                if (this.options.isPolling === false) {
                    this.isPolling = false;
                } else {
                    this.commencePolling();
                }
            },

            _active: [],

            _poll: function() {
                _.each(this._active, function(datum) {
                    if(datum.static === true) {
                        console.info('[poller] Skipping update for static data from ' + datum.url());
                        return;
                    }
                    if (datum instanceof Backbone.Model) {
                        console.info('[poller] Updating model from ' + datum.url);
                    } else if (datum instanceof Backbone.Collection) {
                        console.info('[poller] Updating collection from ' + datum.url);
                    }
                    datum.fetch();
                });
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
            get: function(data) {
                if(this._active.length > 0) {
                    console.info('[poller] Releasing active data.');
                    this._active = [];
                }

                var loadingDeferreds = _.map(data, function(datum) {
                    return datum.fetch();
                });

                console.info('[poller] Loading new active data.');

                this.isPolling = true;

                this._active = data;

                return $.when.apply(this, loadingDeferreds);
            },

            pause: function() {
                if (this.isPolling) {
                    window.clearInterval(this.interval);
                    console.info('[poller] Polling paused.');
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
            }
        });
    }
);