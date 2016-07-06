define([
    'backbone',
    'deepModel',
    'jquery',
    'moment',
    'underscore',
    'underscore.string',
    'budget/collections/headline-candidates',
    'budget/collections/items',
    'budget/models/item',
    'common/settings',
],
function(
    Backbone,
    deepModel,
    $,
    moment,
    _,
    _string_,
    HeadlineCandidateCollection,
    BudgetItemCollection,
    BudgetItem,
    settings
) {
    'use strict';
    _.noConflict();

    return deepModel.DeepModel.extend({
        urlRoot: settings.apiEndpoints.package,

        url: function() {
            if (this.has('id')) {
                return this.urlRoot + this.id + (settings.apiPostfix || '/');
            }

            return this.urlRoot;
        },

        defaults: {
            additionalContent: [],

            headlineCandidates: [],
            headlineStatus: 'drafting',

            printPlacements: null,
            isPrintPlacementFinalized: false,
            printRunDate: null,
            publication: null,

            publishDate: [],
            publishDateResolution: null,
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


            if (!_.has(this, 'primaryContentItem')) {
                this.primaryContentItem = new BudgetItem();
            }

            if (!_.has(this, 'additionalContentCollection')) {
                this.additionalContentCollection = new BudgetItemCollection();
            }

            if (!_.has(this, 'headlineCandidateCollection')) {
                this.headlineCandidateCollection = new HeadlineCandidateCollection();
            }
        },

        loadInitial: function() {
            var initialLoadPromise = new $.Deferred();

            // Create four empty headline objects in this package's
            // headlineCandidatesCollection property.
            this.headlineCandidateCollection.add([{}, {}, {}, {}]);

            initialLoadPromise.resolve();

            return initialLoadPromise;
        },

        load: function() {
            var packageRequest = this.fetch({
                xhrFields: {
                    withCredentials: true,
                },
            });
            return packageRequest;
        },

        parse: function(data, config) {
            var deepLoad = (_.isBoolean(config.deepLoad)) ? config.deepLoad : true,
                muteConsole = (_.isBoolean(config.muteConsole)) ? config.muteConsole : false,
                relatedItemCallback;

            this.initialHeadlineStatus = data.headlineStatus;

            if (_.has(config, 'collection')) {
                // If this model is being instantiated as part of a
                // 'PackageCollection.fetch()' call, create the additional
                // content and headline collections here.

                if (_.isUndefined(this.primaryContentItem)) {
                    this.primaryContentItem = new BudgetItem();
                }

                if (_.isUndefined(this.additionalContentCollection)) {
                    this.additionalContentCollection = new BudgetItemCollection();
                }

                if (_.isUndefined(this.headlineCandidateCollection)) {
                    this.headlineCandidateCollection = new HeadlineCandidateCollection();
                }
            }

            if (!muteConsole) {
                // Log that the package fetch was successful.
                console.log("Fetched package with ID '" + data.id + "'.");  // eslint-disable-line no-console,max-len
            }

            if (deepLoad) {
                relatedItemCallback = this.loadRelatedItems(data, {muteConsole: muteConsole});

                relatedItemCallback.done(function() {
                    this.trigger('packageLoaded');
                }.bind(this));
            } else {
                this.trigger('packageLoaded');
            }

            return data;
        },

        loadRelatedItems: function(data, options) {
            var itemsRequest,
                itemRequestPromise = new $.Deferred(),
                headlinesRequest,
                allAdditionalRequests = [itemRequestPromise],
                relatedItemPromise = new $.Deferred(),
                muteConsole = (_.isBoolean(options.muteConsole)) ? options.muteConsole : false;

            // Retrieve the additional item collection's starting values from
            // the API.
            itemsRequest = this.additionalContentCollection.fetch({
                xhrFields: {
                    withCredentials: true,
                },
                data: {
                    id__in: data.primaryContent + ',' + data.additionalContent.join(','),
                },
                silent: true,
            });

            // Once primary and additional items are loaded, incorporate
            // their attributes into the package model.
            itemsRequest.done(function(itColl, itRequest, itOptions) {  // eslint-disable-line no-unused-vars,max-len
                var primaryItem = this.additionalContentCollection.get(data.primaryContent),
                    additionalText = (
                        !_.isEmpty(data.additionalContent)
                    ) ? ", '" + data.additionalContent.join("', '") + "'" : '',
                    entireSlug,
                    generatedSlug;

                if (!muteConsole) {
                    console.log(  // eslint-disable-line no-console
                        "Fetched items with IDs '" + primaryItem.id + "'" + additionalText + '.'
                    );
                }

                this.primaryContentItem = primaryItem;
                this.additionalContentCollection.remove(primaryItem);
                this.additionalContentCollection.trigger('reset');

                this.primaryContentItem.on('change', function(mdl, opts) {  // eslint-disable-line max-len,no-unused-vars
                    _.each(
                        _.keys(this.primaryContentItem.changedAttributes()),
                        function(changedKey) {
                            this.trigger('change:primaryContent.' + changedKey);
                        }.bind(this)
                    );
                }.bind(this));

                // Evaluate whether there's a suffix on the primary content
                // item's slug.
                entireSlug = primaryItem.get('slug');
                generatedSlug = this.generatePackageTitle();
                if (
                    (entireSlug !== generatedSlug) &&
                    (_string_.startsWith(entireSlug, generatedSlug))
                ) {
                    this.primaryContentItem.set(
                        'slugSuffix',
                        _string_.strRight(entireSlug, generatedSlug)
                    );
                }

                return '';
            }.bind(this)).done(function() {
                itemRequestPromise.resolve();
            });

            // If the item request fails, pass back the error.
            itemsRequest.fail(function(response, errorText) {  // eslint-disable-line no-unused-vars,max-len
                this.trigger('packageLoadFailed', 'items');
            });

            // Load headlines' information.
            this.headlineCandidateCollection.on(
                'change',
                function() { this.trigger('change:headlineCandidates'); }.bind(this)
            );

            if (!_.isEmpty(data.headlineCandidates)) {
                // Instantiate and retrieve data for a collection
                // containing each headline in this package.
                headlinesRequest = this.headlineCandidateCollection.fetch({
                    xhrFields: {withCredentials: true},
                    data: {id__in: data.headlineCandidates.join(',')},
                });
            } else {
                headlinesRequest = new $.Deferred();
                headlinesRequest.resolve([], {}, {});
            }

            // Add this request to the list of simultaneous
            // additional-information queries.
            allAdditionalRequests.push(headlinesRequest);

            // Once the headlines have been loaded, update the value of
            // the package model's headline candidates.
            headlinesRequest.done(function(hlColl, hlResponse, hlOpts) {  // eslint-disable-line no-unused-vars,max-len
                if (!_.isEmpty(data.headlineCandidates)) {
                    if (!muteConsole) {
                        console.log(  // eslint-disable-line no-console
                            "Fetched headlines with IDs '" +
                            this.headlineCandidateCollection.pluck('id').join("', '") +
                            "'."
                        );
                    }
                }

                _.each(
                    _.range(4 - this.headlineCandidateCollection.length),
                    function(index) {  // eslint-disable-line no-unused-vars
                        this.headlineCandidateCollection.add([{}]);
                    }.bind(this)
                );
            }.bind(this));  // eslint-disable-line no-extra-bind

            // If the headline request fails, pass back the error.
            headlinesRequest.fail(function(response, errorText) {  // eslint-disable-line no-unused-vars,max-len
                this.trigger('packageLoadFailed', 'headlines');
            });

            // When all additional queries have returned successfully, pass
            // a successful resolution the underlying Deferred promise.
            $.when.apply($, allAdditionalRequests).done(function() {
                relatedItemPromise.resolve();
            }.bind(this));  // eslint-disable-line no-extra-bind

            return relatedItemPromise;
        },

        dateFormats: {
            m: ['MMMM YYYY'],
            w: ['[Week of] MMM D, YYYY'],
            d: ['MMM D, YYYY'],
            t: ['MMM D, YYYY', 'h:mm a'],
        },

        intervalRoundings: {
            t: 'minute',
            d: 'day',
            w: 'week',
            m: 'month',
        },

        facetFilters: {
            person: function(pkg, stringToMatch, context) {  // eslint-disable-line no-unused-vars
                // TODO: Update this to reflect 'additionalContent' being a collection.
                var allPeople = _.union(
                        _.pluck(pkg.primaryContentItem.get('editors'), 'email'),
                        _.pluck(pkg.primaryContentItem.get('authors'), 'email'),
                        _.pluck(
                            _.flatten(pkg.additionalContentCollection.pluck('editors')),
                            'email'
                        ),
                        _.pluck(
                            _.flatten(pkg.additionalContentCollection.pluck('authors')),
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
            var resolution = this.get('publishDateResolution'),
                latestDate,
                intervalMap;

            if (!_.isUndefined(resolution)) {
                if (this.has('publishDate') && !_.isEmpty(this.get('publishDate'))) {
                    latestDate = moment(
                        this.get('publishDate')[1]
                    ).tz('America/Chicago').subtract({seconds: 1});

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
            var rawKey;

            if (!_.isUndefined(this.primaryContentItem)) {
                rawKey = this.primaryContentItem.get('slugKey');
            }

            return [
                this.generateSlugHub(),
                ((rawKey !== '') && (!_.isUndefined(rawKey))) ? rawKey : 'keyword',
                this.generateSlugDate(),
            ].join('.');
        },

        updatePublishDateResolution: function(newResolution) {
            var currentResolution = this.get('publishDateResolution'),
                oldEnd,
                newEnd = null,
                newStart = null;

            this.set('publishDateResolution', newResolution);

            if (currentResolution !== newResolution) {
                if (!_.isNull(newResolution)) {
                    if (!_.isEmpty(this.get('publishDate'))) {
                        oldEnd = moment(
                            this.get('publishDate')[1]
                        ).tz('America/Chicago').subtract({seconds: 1});
                        newEnd = oldEnd.endOf(this.intervalRoundings[newResolution]);

                        if (_.contains(['m', 'w', 'd'], currentResolution)) {
                            if (newResolution === 't') {
                                newEnd = newEnd.endOf('day').add({hours: -12, minutes: 1});
                            }
                        }

                        newStart = newEnd.clone().startOf(this.intervalRoundings[newResolution]);
                    }
                }

                this.set(
                    'publishDate',
                    (!_.isNull(newEnd)) ? [newStart.toISOString(), newEnd.toISOString()] : []
                );
            }
        },

        updatePublishDate: function(newResolution, newPublishDate) {
            var resolution = this.get('publishDateResolution'),
                roundingResolution = this.intervalRoundings[resolution],
                roughDate,
                start = null,
                end = null;

            if (newResolution === resolution) {
                if (!_.isNull(newPublishDate)) {
                    roughDate = moment(
                        newPublishDate,
                        this.dateFormats[resolution].join(' ')
                    ).tz('America/Chicago');

                    end = roughDate.endOf(roundingResolution);
                    start = end.clone().startOf(roundingResolution);

                    end.add({milliseconds: 1});
                }

                this.set(
                    {
                        publishDate: !_.isNull(end) ? [start.toISOString(), end.toISOString()] : [],
                    },
                    {}
                );
            }
        },

        generateFormattedPublishDate: function(resolutionRaw, endTimestampRaw) {
            var resolution = resolutionRaw || this.get('publishDateResolution'),
                endTimestamp = endTimestampRaw || this.get('publishDate')[1],
                endDate = moment(endTimestamp).tz('America/Chicago').subtract({seconds: 1}),
                processedDate = endDate;

            if (_.contains(['m', 'w', 'd', 't'], resolution)) {
                if (resolution === 'w') { processedDate = endDate.startOf('week'); }

                return _.map(
                    this.dateFormats[resolution],
                    function(formatString) { return processedDate.format(formatString); }
                );
            }

            return ['Invalid date'];
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
