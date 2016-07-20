define(
    [
        'backbone',
        'underscore',
        'common/settings',
        'budget/models/hub',
    ],
    function(
        Backbone,
        _,
        settings,
        Hub
    ) {
        'use strict';

        return Backbone.Collection.extend({
            // A boolean to track whether we've populated our collection with
            // hubs for the first time
            model: Hub,

            events: {},

            /**
             * Sort the collection by pinned status first (pinned on top) then by
             * created timestamp in reverse chronological order
             */
            comparator: function(model) {
                return model.get('slug');
            },

            url: function() {
                return settings.apiEndpoints.hub;
            },

            parse: function(response) {
                return response;
            },
        });
    }
);
