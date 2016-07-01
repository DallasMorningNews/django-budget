define(
    [
        'backbone',
        'underscore',
        'common/settings',
        'budget/models/item',
    ],
    function(
        Backbone,
        _,
        settings,
        BudgetItem
    ) {
        'use strict';

        return Backbone.Collection.extend({
            // A boolean to track whether we've populated our collection with
            // search options for the first time
            model: BudgetItem,

            url: settings.apiEndpoints.item,

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

            parse: function(response) {
                return response.results;
            },
        });
    }
);
