define([
    'backbone',
    'deepModel',
    'jquery',
    'moment',
    'underscore',
    'budget/collections/headline-candidates',
    'budget/collections/items',
    'common/settings',
],
function(
    Backbone,
    deepModel,
    $,
    moment,
    _,
    HeadlineCandidateCollection,
    BudgetItemCollection,
    settings
) {
    'use strict';
    _.noConflict();

    return deepModel.DeepModel.extend({
        urlRoot: settings.apiEndpoints.GET.package.detail,

        url: function() {
            return this.urlRoot + this.id + (settings.apiPostfix || '/');
        },

        defaults: {
            additionalContent: [],

            headlineCandidates: [],
            headlineStatus: 'drafting',

            printPlacements: null,
            isPrintPlacementFinalized: false,
            printRunDate: null,
            publication: null,

            pubDate: null,
            pubDateFormatted: null,
            pubDateResolution: null,
            pubDateTimestamp: null,
        },

        initialize: function() {
            moment.locale('en', {
                meridiem: function(hour, minute, isLowercase) {
                    var meridiemString;
                    if (hour < 12) {
                        meridiemString = 'a.m.';
                    } else {
                        meridiemString = 'p.m.';
                    }

                    if (!isLowercase) {
                        return meridiemString.toUpperCase();
                    }

                    return meridiemString;
                },
                monthsShort: [
                    'Jan.', 'Feb.', 'March', 'April', 'May', 'June',
                    'July', 'Aug.', 'Sept.', 'Oct.', 'Nov.', 'Dec.',
                ],
                week: {
                    dow: 1,
                },
            });
        },

        loadInitial: function() {
            var initialLoadPromise = new $.Deferred();

            // Instantiate an item collection associated with this package.
            this.set(
                {
                    additionalContent: new BudgetItemCollection(),
                    headlineCandidates: new HeadlineCandidateCollection(),
                }
            );

            // Create four empty headline objects in this package's
            // 'headlineCandidates' collection.
            this.get('headlineCandidates').add([{}, {}, {}, {}]);

            initialLoadPromise.resolve();

            return initialLoadPromise;
        },

        load: function() {
            var packageRequest = this.fetch({
                    xhrFields: {
                        withCredentials: true,
                    },
                }),
                itemRequestPromise = new $.Deferred(),
                additionalRequestPromise = new $.Deferred();

            // Load the package, then fire each request for the additional
            // information we'll need to fully construct the object.
            packageRequest.done(function(model, request, options) {  // eslint-disable-line no-unused-vars,max-len
                var itemsRequest,
                    additionalItems,
                    headlinesRequest,
                    allAdditionalRequests = [itemRequestPromise];

                // Log that the package fetch was successful.
                console.log("Fetched package with ID '" + this.id + "'.");  // eslint-disable-line no-console,max-len

                // Instantiate an item collection associated with this package, and
                // retrieve its starting values from the API.
                this.set('additionalContent', new BudgetItemCollection());

                itemsRequest = this.get('additionalContent').fetch({
                    xhrFields: {
                        withCredentials: true,
                    },
                    data: {
                        id__in: this.primaryID + ',' + this.additionalIDs.join(','),
                    },
                });

                // Once primary and additional items are loaded, incorporate
                // their attributes into the package model.
                itemsRequest.done(function(itColl, itRequest, itOptions) {  // eslint-disable-line no-unused-vars,max-len
                    var primaryItem = this.get('additionalContent').get(this.primaryID),
                        additionalText = (
                            !_.isEmpty(this.additionalIDs)
                        ) ? ", '" + this.additionalIDs.join("', '") + "'" : '';

                    additionalItems = this.get('additionalContent').clone();
                    additionalItems.remove(primaryItem);

                    console.log(  // eslint-disable-line no-console
                        "Fetched items with IDs '" + primaryItem.id + "'" + additionalText + '.'
                    );

                    this.set('primaryContent', primaryItem.toJSON());
                    this.set('additionalContent', additionalItems);

                    return '';
                }.bind(this)).done(function() {
                    itemRequestPromise.resolve();
                });

                // If the item request fails, pass back the error.
                itemsRequest.fail(function(response, errorText) {  // eslint-disable-line no-unused-vars,max-len
                    additionalRequestPromise.reject('items', response);
                });

                // Create an empty collection for headlines.
                this.set('headlineCandidates', new HeadlineCandidateCollection());
                this.get('headlineCandidates').on(
                    'change',
                    function() { this.trigger('change:headlineCandidates'); }.bind(this)
                );

                // Instantiate and retrieve data for a collection
                // containing each headline in this package.
                headlinesRequest = this.get('headlineCandidates').fetch({
                    xhrFields: {withCredentials: true},
                    data: {id__in: this.headlineIDs.join(',')},
                });

                // Add this request to the list of simultaneous
                // additional-information queries.
                allAdditionalRequests.push(headlinesRequest);

                // Once the headlines have been loaded, update the value of
                // the package model's headline candidates.
                headlinesRequest.done(function(hlColl, hlResponse, hlOpts) {  // eslint-disable-line no-unused-vars,max-len
                    if (!_.isEmpty(this.headlineIDs)) {
                        console.log(  // eslint-disable-line no-console
                            "Fetched headlines with IDs '" +
                            this.get('headlineCandidates').pluck('id').join("', '") +
                            "'."
                        );
                    }

                    _.each(
                        _.range(4 - this.get('headlineCandidates').length),
                        function(index) {  // eslint-disable-line no-unused-vars
                            this.get('headlineCandidates').add([{}]);
                        }.bind(this)
                    );
                }.bind(this));  // eslint-disable-line no-extra-bind

                // If the headline request fails, pass back the error.
                headlinesRequest.fail(function(response, errorText) {  // eslint-disable-line no-unused-vars,max-len
                    additionalRequestPromise.reject('headlines', response);
                });


                // When all additional queries have returned successfully, pass
                // a successful resolution the underlying Deferred promise.
                $.when.apply($, allAdditionalRequests).done(function() {
                    additionalRequestPromise.resolve(this);
                }.bind(this));
            }.bind(this));

            // If the package request fails, pass back the error.
            packageRequest.fail(function(response, errorText) {  // eslint-disable-line no-unused-vars,max-len
                additionalRequestPromise.reject('package', response);
            });

            return additionalRequestPromise.promise();
        },

        parse: function(data) {
            this.initialHeadlineStatus = data.headlineStatus;
            this.primaryID = data.primaryContent;
            this.additionalIDs = data.additionalContent;
            this.headlineIDs = _.clone(data.headlineCandidates);

            return data;
        },

        dateFormats: {
            m: ['MMMM YYYY'],
            w: ['[Week of] MMM D, YYYY'],
            d: ['MMM D, YYYY'],
            t: ['MMM D, YYYY', 'h:mm a'],
        },

        intervalRoundings: {
            t: 'second',
            d: 'day',
            w: 'week',
            m: 'month',
        },

        facetFilters: {
            person: function(pkg, stringToMatch, context) {  // eslint-disable-line no-unused-vars
                // TODO: Update this to reflect 'additionalContent' being a collection.
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
            hub: function(pkg, stringToMatch, context) {  // eslint-disable-line no-unused-vars
                return pkg.get('hub') === stringToMatch;
            },
            vertical: function(pkg, stringToMatch, extraContext) {
                var thisVerticalSlug = extraContext.hubs.findWhere({
                    slug: pkg.get('hub'),
                }).get('vertical').slug;

                return thisVerticalSlug === stringToMatch;
            },
            fullText: function(pkg, stringToMatch, extraContext) {
                return _.contains(
                    _.pluck(
                        extraContext.fullTextSearches[stringToMatch],
                        'ref'
                    ),
                    pkg.get('id')
                );
            },
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
                    queryFunction = function(
                        pkg,
                        stringToMatch,
                        context  // eslint-disable-line no-unused-vars
                    ) {
                        console.log(  // eslint-disable-line no-console
                            "Couldn't find filter for query term: " + termType
                        );
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
            }

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
        },

        generateSlugHub: function() {
            if (this.get('hub')) {
                return this.get('hub');
            }

            return 'hub';
        },

        generateSlugDate: function() {
            var resolution,
                timestamp,
                latestDate,
                intervalMap;

            if (this.has('pubDateResolution')) {
                resolution = this.get('pubDateResolution');
                timestamp = this.get('pubDateTimestamp');

                if (!_.isNull(timestamp)) {
                    latestDate = moment.unix(timestamp).tz('America/Chicago');

                    // If this is a month or a week-resolution date, use the
                    // earliest moment of the time period to generate a dayless
                    // slug value.

                    // This way, weeks that span two months will resolve to the
                    // earlier month for consistency.
                    if (_.contains(['m', 'w'], resolution)) {
                        intervalMap = {
                            m: 'month',
                            w: 'week',
                        };

                        return latestDate.startOf(intervalMap[resolution]).format('MM--YY');
                    }

                    return latestDate.format('MMDDYY');
                }
            }

            return 'date';
        },

        generatePackageTitle: function() {
            var rawKey = this.get('primaryContent.slugKey');

            return [
                this.generateSlugHub(),
                ((rawKey !== '') && (!_.isUndefined(rawKey))) ? rawKey : 'keyword',
                this.generateSlugDate(),
            ].join('.');
        },

        generateFormattedPubDate: function(resolutionRaw, timestampRaw) {
            var resolution,
                timestamp,
                endDate,
                processedEndDate;

            // Use the model values if no parameters have been passed.
            if (_.isUndefined(resolutionRaw)) {
                resolution = this.get('pubDateResolution');
            } else {
                resolution = resolutionRaw;
            }

            if (_.isUndefined(timestampRaw)) {
                timestamp = this.get('pubDateTimestamp');
            } else {
                timestamp = timestampRaw;
            }

            endDate = moment.unix(timestamp).tz('America/Chicago');

            if (_.contains(['m', 'w', 'd', 't'], resolution)) {
                processedEndDate = endDate;

                if (resolution === 'w') {
                    processedEndDate = endDate.startOf('week');
                }

                return _.map(
                    this.dateFormats[resolution],
                    function(formatString) {
                        return processedEndDate.format(formatString);
                    }
                );
            }

            return ['Invalid date'];
        },

        updateFormattedPubDate: function(newPubDate) {
            var resolution = this.get('pubDateResolution'),
                roughDate = moment(
                    newPubDate,
                    this.dateFormats[resolution].join(' ')
                ).tz('America/Chicago'),
                finalDate;

            finalDate = roughDate.endOf(this.intervalRoundings[resolution]);

            this.set(
                {pubDateTimestamp: finalDate.unix()},
                {
                    // silent: true
                }
            );
            this.set(
                {
                    pubDateFormatted: this.generateFormattedPubDate(
                        resolution,
                        finalDate.unix()
                    ).join(' '),
                },
                {
                    // silent: true
                }
            );
        },

        resetPubDateResolution: function(newResolution) {
            var currentResolution = this.get('pubDateResolution'),
                oldEnd,
                newEnd;

            this.set('pubDateResolution', newResolution);

            if (currentResolution !== newResolution) {
                if (_.isNull(newResolution)) {
                    this.set('pubDateFormatted', null);
                    this.set('pubDateTimestamp', null);
                } else {
                    if (!_.isNull(this.get('pubDateTimestamp'))) {
                        oldEnd = moment.unix(
                            this.get('pubDateTimestamp')
                        ).tz('America/Chicago');
                        newEnd = oldEnd.endOf(
                            this.intervalRoundings[newResolution]
                        );

                        if (_.contains(['m', 'w', 'd'], currentResolution)) {
                            if (newResolution === 't') {
                                newEnd = newEnd.endOf('day')
                                                .subtract(12, 'hours')
                                                .add({seconds: 1});
                            }
                        }

                        this.set('pubDateTimestamp', newEnd.unix());
                        this.set(
                            'pubDateFormatted',
                            this.generateFormattedPubDate(
                                newResolution,
                                newEnd.unix()
                            ).join(' ')
                        );
                    } else {
                        this.set('pubDateFormatted', null);
                    }
                }
            }
        },

        generateFormattedRunDate: function(formatString, runDateValue) {
            var value = (
                !_.isUndefined(runDateValue)
            ) ? runDateValue : this.get('printRunDate');

            return moment(value, formatString).tz('America/Chicago').toDate();
        },

        parseRunDate: function(formatString, runDate) {
            var runMoment = moment(runDate).tz('America/Chicago');

            return runMoment.format(formatString);
        },
    });
});
