define([
    'backbone',
    'underscore',
    'common/settings',
],
function(
    Backbone,
    _,
    settings
) {
    'use strict';

    return Backbone.Model.extend({
        urlRoot: settings.apiEndpoints.GET.package.detail,

        url: function() {
            return this.urlRoot + this.id + '/';
        },

        facetFilters: {
            person: function(pkg, stringToMatch, extraContext) {
                var allPeople = _.union(
                        _.pluck(pkg.get('primaryContent').editors, 'email'),
                        _.pluck(pkg.get('primaryContent').authors, 'email'),
                        _.pluck(
                            _.flatten(
                                _.pluck(
                                    pkg.get('additionalContent'),
                                    'editors'
                                )
                            ),
                            'email'
                        ),
                        _.pluck(
                            _.flatten(
                                _.pluck(
                                    pkg.get('additionalContent'),
                                    'authors'
                                )
                            ),
                            'email'
                        )
                    );

                return _.contains(allPeople, stringToMatch);
            },
            hub: function(pkg, stringToMatch, extraContext) {
                return pkg.get('hub') == stringToMatch;
            },
            vertical: function(pkg, stringToMatch, extraContext) {
                var thisVerticalSlug = extraContext.hubs.findWhere({
                    'slug': pkg.get('hub')
                }).get('vertical').slug;

                return thisVerticalSlug == stringToMatch;
            },
            fullText: function(pkg, stringToMatch, extraContext) {
                return _.contains(
                    _.pluck(
                        extraContext.fullTextSearches[stringToMatch],
                        'ref'
                    ),
                    pkg.get('id')
                );
            }
        },

        filterUsingAnd: function(queryTerms, extraContext) {
            var allFacetsMatch = true;

            queryTerms.each(function(term) {
                var termType = term.get('type'),
                    facetMatches = _.chain(this.facetFilters)
                                        .keys()
                                        .contains(termType)
                                        .value(),
                    extraMatches = _.chain(extraContext.extraQueryFunctions)
                                        .keys()
                                        .contains(termType)
                                        .value(),
                    queryFunction;

                if (facetMatches) {
                    queryFunction = this.facetFilters[termType];
                } else if (extraMatches) {
                    queryFunction = extraContext.extraQueryFunctions[termType];
                } else {
                    queryFunction = function(pkg, stringToMatch, extraContext) {
                        console.log("Couldn't find filter for query term: " + termType);
                        return false;
                    };
                }

                if (
                    !queryFunction(
                        this,
                        term.get('value'),
                        _.omit(extraContext, 'extraQueryFunctions')
                    )
                ) {
                    allFacetsMatch = false;
                }
            }.bind(this));

            return allFacetsMatch;
        },

        filterUsingOr: function(searchTerms, extraContext) {
            var anyFacetsMatch = false;

            if (searchTerms.length === 0) {
                // Show everything if there are no search terms.
                return true;
            } else {
                searchTerms.each(function(term) {
                    if (
                        this.facetFilters[term.get('type')](
                            this,
                            term.get('value'),
                            extraContext
                        )
                    ) {
                        anyFacetsMatch = true;
                    }
                }.bind(this));

                return anyFacetsMatch;
            }
        }
    });
});