define(
    [
        'backbone',
        'underscore',
        'models/package',
        'misc/settings'
    ],
    function(
        Backbone,
        _,
        Package,
        settings
    ) {
        'use strict';

        return Backbone.Collection.extend({
            // A boolean to track whether we've populated our collection with
            // packages for the first time
            model: Package,

            events: {
                // 'change:pinned': 'sort'
            },

            initialize: function() {
                this.once('sync', function() {
                    this.queryFiltered = this.filter();
                });
            },

            filterAnd: function(queryTerms, extraContext) {
                this.queryFiltered = this.filter(function(pkg) {
                    return pkg.filterUsingAnd(queryTerms, extraContext);
                }.bind(this));

                this.trigger('updateQuery', this.queryFiltered);
            },

            filterOr: function(searchTerms, extraContext) {
                this.queryFiltered = this.filter(function(pkg) {
                    return pkg.filterUsingOr(searchTerms, extraContext);
                }.bind(this));

                this.trigger('updateQuery', this.queryFiltered);
            },

            /**
             * Sort the collection by pinned status first (pinned on top) then by
             * created timestamp in reverse chronological order
             */
            comparator: function(model) {
                return model.get('pubDate').timestamp;
            },

            url: function() {
                return settings.urlConfig.packageEndpoint;
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