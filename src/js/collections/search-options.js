define(
    [
        'backbone',
        'underscore',
        'models/search-option',
        'misc/settings'
    ],
    function(
        Backbone,
        _,
        SearchOption,
        settings
    ) {
        'use strict';

        return Backbone.Collection.extend({
            // A boolean to track whether we've populated our collection with
            // search options for the first time
            model: SearchOption,

            events: {},

            /**
             * Sort the collection by pinned status first (pinned on top) then by
             * created timestamp in reverse chronological order
             */
            comparator: function(model) {
                var optionTypeWeights = {
                    'person': 2,
                    'hub': 3,
                    'vertical': 4
                };
                return optionTypeWeights[model.get('type')] + '_' + model.get('value');
            },

            url: function() {
                return settings.urlConfig.searchOptionEndpoint;
            },

            parse: function(response) {
                // window.resp = response;
                // response.posts = _.map(response.posts, function(post) {
                //     post.updated = new Date(post.updated);
                //     return post;
                // });
                return response;
            }
        });
    }
);