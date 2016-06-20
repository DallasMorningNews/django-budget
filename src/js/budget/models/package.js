define([
    'backbone',
    'deepModel',
    'moment',
    'underscore',
    'common/settings',
],
function(
    Backbone,
    deepModel,
    moment,
    _,
    settings
) {
    'use strict';
    _.noConflict();

    return deepModel.DeepModel.extend({
        urlRoot: settings.apiEndpoints.GET.package.detail,

        defaults: {
            headlineCandidates: [],
            headlineStatus: 'drafting',
            printPlacement: {
                printPlacements: null,
                isFinalized: false,
                printRunDate: null,
                publication: null,
            },
            pubDate: {
                formatted: null,
                resolution: null,
                timestamp: null,
            },
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

        parse: function(data) {
            this.initialHeadlineStatus = data.headlineStatus;

            return data;
        },

        url: function() {
            return this.urlRoot + this.id + (settings.apiPostfix || '/');
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

            if (this.has('pubDate.resolution')) {
                resolution = this.get('pubDate.resolution');
                timestamp = this.get('pubDate.timestamp');

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
            return [
                this.generateSlugHub(),
                this.get('primaryContent.slugKey'),
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
                resolution = this.get('pubDate.resolution');
            } else {
                resolution = resolutionRaw;
            }

            if (_.isUndefined(timestampRaw)) {
                timestamp = this.get('pubDate.timestamp');
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
            // var currentPubDate = this.get('pubDate.formatted'),
            var resolution = this.get('pubDate.resolution'),
                roughDate = moment(
                    newPubDate,
                    this.dateFormats[resolution].join(' ')
                ).tz('America/Chicago'),
                finalDate;

            finalDate = roughDate.endOf(this.intervalRoundings[resolution]);

            this.set(
                {'pubDate.timestamp': finalDate.unix()},
                {
                    // silent: true
                }
            );
            this.set(
                {
                    'pubDate.formatted': this.generateFormattedPubDate(
                        resolution,
                        finalDate.unix()
                    ).join(' '),
                },
                {
                    // silent: true
                }
            );
        },

        updateHeadlineCandidate: function(updates, options) {
            var headlinesList = _.clone(this.get('headlineCandidates')),
                newAttrs = _.clone(updates),
                updateID,
                newHeds,
                setOptions;  // eslint-disable-line no-unused-vars

            newAttrs = _.omit(newAttrs, 'id');

            if (_.has(updates, 'id')) {
                updateID = updates.id;
                newHeds = _(headlinesList)
                            .chain()
                                .findWhere({id: updateID})
                                .extend(newAttrs)
                            .value();

                setOptions = options;
                if (!_.isObject(options)) {
                    setOptions = {};
                }

                this.set(
                    {headlineCandidates: newHeds},
                    options
                );
            }
        },

        resetPubDateResolution: function(newResolution) {
            var currentResolution = this.get('pubDate.resolution'),
                oldEnd,
                newEnd;

            this.set('pubDate.resolution', newResolution);

            if (currentResolution !== newResolution) {
                if (_.isNull(newResolution)) {
                    this.set('pubDate.formatted', null);
                    this.set('pubDate.timestamp', null);
                } else {
                    if (!_.isNull(this.get('pubDate.timestamp'))) {
                        oldEnd = moment.unix(
                            this.get('pubDate.timestamp')
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

                        this.set('pubDate.timestamp', newEnd.unix());
                        this.set(
                            'pubDate.formatted',
                            this.generateFormattedPubDate(
                                newResolution,
                                newEnd.unix()
                            ).join(' ')
                        );
                    } else {
                        this.set('pubDate.formatted', null);
                    }
                }
            }
        },

        generateFormattedRunDate: function(formatString, runDateValue) {
            var value = (
                !_.isUndefined(runDateValue)
            ) ? runDateValue : this.get('printPlacement.printRunDate');

            return moment(value, formatString).tz('America/Chicago').toDate();
        },

        parseRunDate: function(formatString, runDate) {
            var runMoment = moment(runDate).tz('America/Chicago');

            return runMoment.format(formatString);
        },
    });
});
