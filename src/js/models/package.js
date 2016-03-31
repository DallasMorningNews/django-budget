define([
    'backbone',
    'misc/settings',
],
function(Backbone, settings) {
    'use strict';

    return Backbone.Model.extend({
        urlRoot: settings.urlConfig.getEndpoints.packageDetailBase,

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
            }
        },

        filterUsingAnd: function(queryTerms, extraContext) {
            var allFacetsMatch = true;

            queryTerms.each(function(term) {
                if (
                    !this.facetFilters[term.get('type')](
                        this,
                        term.get('value'),
                        extraContext
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