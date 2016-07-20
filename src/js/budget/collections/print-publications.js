define(
    [
        'backbone',
        'underscore',
        'common/settings',
        'budget/models/print-publication',
    ],
    function(
        Backbone,
        _,
        settings,
        PrintPublication
    ) {
        'use strict';

        return Backbone.Collection.extend({
            // A boolean to track whether we've populated our collection with
            // search options for the first time
            model: PrintPublication,

            events: {},

            comparator: 'priority',

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
                return settings.apiEndpoints.printPublication;
            },

            parse: function(response) {
                return response.results;
            },
        });
    }
);
