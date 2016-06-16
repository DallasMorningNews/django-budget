define(
    [
        'backbone',
        'lunr',
        'underscore',
        'common/settings',
        'budget/models/package',
    ],
    function(
        Backbone,
        lunr,
        _,
        settings,
        Package
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

            cleanSlug: function(rawSlug) {
                return rawSlug
                            .replace(/\./g, ' ')
                            .replace(/-/g, ' ')
                            .replace(/_/g, ' ');
            },

            combineAdditionalItemValues: function(model, field, fieldFormat) {
                return _.chain(model.get('additionalContent'))
                            .pluck(field)
                            .reduce(
                                function(memo, value) {
                                    var finalValue = value;
                                    if (!_.isUndefined(fieldFormat)) {
                                        finalValue = fieldFormat(finalValue);
                                    }

                                    return memo + ' ' + finalValue;
                                }
                            )
                            .value();
            },

            rebuildIndex: function() {
                this.fullTextIndex = lunr(
                    function() {
                        this.field('relatedSlugs', {boost: 5});
                        this.field('relatedSlugsCleaned', {boost: 10});
                        this.field('relatedBudgetLines', {boost: 15});
                        this.field('primarySlug', {boost: 20});
                        this.field('primarySlugCleaned', {boost: 25});
                        this.field('primaryBudgetLine', {boost: 30});
                        this.ref('id');
                    }
                );

                this.each(function(pkg) {
                    this.fullTextIndex.add({
                        id: pkg.get('id'),
                        relatedSlugs: this.combineAdditionalItemValues(
                            pkg,
                            'slug'
                        ),
                        relatedSlugsCleaned: this.combineAdditionalItemValues(
                            pkg,
                            'slug',
                            this.cleanSlug
                        ),
                        relatedBudgetLines: this.combineAdditionalItemValues(
                            pkg,
                            'budgetLine'
                        ),
                        primarySlug: pkg.get('primaryContent').slug,
                        primarySlugCleaned: this.cleanSlug(
                            pkg.get('primaryContent').slug
                        ),
                        primaryBudgetLine: pkg.get('primaryContent').budgetLine,
                    });
                }.bind(this));
            },

            filterAnd: function(queryTerms, extraContext) {
                this.queryFiltered = this.filter(function(pkg) {
                    return pkg.filterUsingAnd(queryTerms, extraContext);
                }.bind(this));  // eslint-disable-line no-extra-bind

                this.trigger('updateQuery', this.queryFiltered);
            },

            filterOr: function(searchTerms, extraContext) {
                this.queryFiltered = this.filter(function(pkg) {
                    return pkg.filterUsingOr(searchTerms, extraContext);
                }.bind(this));  // eslint-disable-line no-extra-bind

                this.trigger('updateQuery', this.queryFiltered);
            },

            /**
             * Sort the collection by pinned status first (pinned on top) then by
             * created timestamp in reverse chronological order
             */
            comparator: function(model) {
                return model.get('pubDate').timestamp;
            },

            parse: function(response) {
                // window.resp = response;
                // response.posts = _.map(response.posts, function(post) {
                //     post.updated = new Date(post.updated);
                //     return post;
                // });
                return response;
            },
        });
    }
);
