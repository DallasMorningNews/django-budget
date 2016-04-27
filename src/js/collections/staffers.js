define(
    [
        'backbone',
        'underscore',
        'models/staffer',
        'misc/settings'
    ],
    function(
        Backbone,
        _,
        Staffer,
        settings
    ) {
        'use strict';

        return Backbone.Collection.extend({
            // A boolean to track whether we've populated our collection with
            // search options for the first time
            model: Staffer,

            events: {},

            /**
             * Sort the collection by pinned status first (pinned on top) then by
             * created timestamp in reverse chronological order
             */
            // comparator: function(model) {
            //     var optionTypeWeights = {
            //         'person': 2,
            //         'hub': 3,
            //         'vertical': 4
            //     };
            //     return optionTypeWeights[model.get('type')] + '_' + model.get('value');
            // },

            url: function() {
                return settings.urlConfig.getEndpoints.staffer.list;
            },

            parse: function(response) {
                return response;
            }
        });
    }
);