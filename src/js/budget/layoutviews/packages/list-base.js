define([
    'backbone',
    'marionette',
    'moment',
    'underscore',
    'common/poller',
    'common/settings',
    'common/tpl',
    'budget/collections/packages',
    'budget/collections/query-terms',
    'budget/collectionviews/packages/package-collection',
    'budget/itemviews/packages/date-filter',
    'budget/itemviews/packages/search-box',
], function(
    Backbone,
    Mn,
    moment,
    _,
    Poller,
    settings,
    tpl,
    PackageCollection,
    QueryTermCollection,
    PackageCollectionView,
    DateFilterView,
    SearchBoxView
) {
    return Mn.LayoutView.extend({
        id: 'package-archive',

        regions: {
            dateFilter: '#filter-holder #date-filter',
            searchBox: '#filter-holder #search-box',
            packages: '#package-list',
        },

        extraChildViews: {},

        extraQueryTerms: [],

        initialize: function() {
            var initialQueryTerms;

            this._radio = Backbone.Wreqr.radio.channel('global');
            this._poller = new Poller();

            this.initialState = this.parseQueryString(
                this.options.boundData.querystring
            );

            if (
                _.isUndefined(
                    this._radio.reqres.request(
                        'getState',
                        this.stateKey,
                        'dateRange'
                    )
                )
            ) {
                this._radio.commands.execute(
                    'setState',
                    this.stateKey,
                    'dateRange',
                    this.initialState.dateRange
                );
            }

            initialQueryTerms = this._radio.reqres.request(
                'getState',
                this.stateKey,
                'queryTerms'
            );

            if (_.isUndefined(initialQueryTerms)) {
                this._radio.commands.execute(
                    'setState',
                    this.stateKey,
                    'queryTerms',
                    new QueryTermCollection()
                );
            }

            this.packageCollection = new PackageCollection();

            this.extraViewInstances = {};

            if (!_.isUndefined(this.extendInitialize)) {
                this.extendInitialize();
            }

            this.loadPackages(
                function(collection, request, options) {  // eslint-disable-line no-unused-vars
                    var PackageCollectionViewForType;

                    if (!_.isUndefined(initialQueryTerms)) {
                        this.updateQuery(collection);
                    } else if (!_.isNull(this.initialState.queryTerms)) {
                        this._radio.commands.execute(
                            'setState',
                            this.stateKey,
                            'queryTerms',
                            function(terms) {
                                terms.reset(this.initialState.queryTerms);

                                if (!_.isEmpty(this.initialState.extraContext)) {
                                    _.each(
                                        this.initialState.extraContext,
                                        function(value, key) {
                                            terms.add({
                                                type: key,
                                                value: value,
                                            });
                                        }
                                    );
                                }
                            }.bind(this)
                        );

                        this.updateQuery(collection);
                    }

                    PackageCollectionViewForType = PackageCollectionView.extend({
                        childView: this.packageItemView,
                    });

                    this.dateFilterView = new DateFilterView({
                        collection: collection,
                        data: this.options.data,
                        stateKey: this.stateKey,
                    });
                    this.searchBoxView = new SearchBoxView({
                        data: this.options.data,
                        stateKey: this.stateKey,
                    });

                    this.collectionView = new PackageCollectionViewForType({
                        collection: collection,
                        currentUser: this.options.currentUser,
                        hubs: this.options.data.hubs,
                        itemView: this.packageItemView,
                        stateKey: this.stateKey,
                    });

                    this.collectionView.on('add:child', function(childView) {
                        childView.onRenderCallback();
                    });

                    this.updateQuerystring();

                    this.options.initFinishedCallback(this);
                }.bind(this)
            );

            // Handler for updating our internal date filters.
            this._radio.commands.setHandler(
                'switchListDates',
                function(stateKey, newDates) {
                    this._radio.commands.execute('setState', stateKey, 'dateRange', newDates);

                    this.loadPackages(
                        function(collection, response, options) {  // eslint-disable-line no-unused-vars,max-len
                            this.updateQuery(collection);
                        }.bind(this)
                    );

                    this.updateQuerystring();
                },
                this
            );

            // Handler for adding a query term.
            this._radio.commands.setHandler(
                'pushQueryTerm',
                function(stateKey, queryObject) {
                    this._radio.commands.execute(
                        'setState',
                        stateKey,
                        'queryTerms',
                        function(terms) {
                            terms.push(queryObject);
                        }.bind(this)  // eslint-disable-line no-extra-bind
                    );

                    this.updateQuery(this.packageCollection);
                    this.updateQuerystring();
                },
                this
            );

            // Handler for removing a query term.
            this._radio.commands.setHandler(
                'popQueryTerm',
                function(stateKey, queryValue) {
                    this._radio.commands.execute(
                        'setState',
                        stateKey,
                        'queryTerms',
                        function(terms) {
                            terms.remove(terms.where({value: queryValue}));
                        }.bind(this)  // eslint-disable-line no-extra-bind
                    );

                    this.updateQuery(this.packageCollection);
                    this.updateQuerystring();
                },
                this
            );
        },

        loadPackages: function(callbackFunction) {
            this.packageCollection.url = this.generateCollectionURL();

            this.polledData = [this.packageCollection];

            this._poller
                    .get(this.polledData)
                        .then(
                            function(data, textStatus, jqXHR) {
                                this.packageCollection.rebuildIndex();

                                callbackFunction(this.packageCollection, jqXHR, {});
                            }.bind(this)
                        );
        },

        onRender: function() {
            if (!_.isEmpty(this.extraChildViews)) {
                // TODO: Destroy old views.
                this.extraViewInstances = {};

                _.each(
                    this.extraChildViews,
                    function(ViewClass, region) {
                        var viewInstance = new ViewClass({
                            data: this.options.data,
                            stateKey: this.stateKey,
                        });

                        this.extraViewInstances[region] = viewInstance;
                        this.showChildView(region, viewInstance);
                    }.bind(this)
                );
            }

            this.showChildView('dateFilter', this.dateFilterView);
            this.showChildView('searchBox', this.searchBoxView);

            this.showChildView('packages', this.collectionView);
        },

        onBeforeDestroy: function() {
            this._poller.destroy();
        },

        parseQueryString: function(querystring, returnValue) {  // eslint-disable-line no-unused-vars,max-len
            var parsedQueryTerms = [],
                parsedDateRange = {},
                extraContext = {},
                invalidTerms = [],
                searchQueryTerms = [
                    'fullText',
                    'hub',
                    'person',
                    'vertical',
                ],
                dateQueryTerms = [
                    'startDate',
                    'endDate',
                ];

            if (!_.isNull(querystring)) {
                parsedQueryTerms = _.chain(querystring.split('&'))
                    .map(function(component) {
                        var termParts = _.map(
                                component.split('='),
                                decodeURIComponent
                            );

                        if (_.contains(searchQueryTerms, termParts[0])) {
                            return {
                                type: termParts[0],
                                value: termParts[1],
                            };
                        } else if (_.contains(dateQueryTerms, termParts[0])) {
                            parsedDateRange[
                                termParts[0].slice(0, -4)
                            ] = moment(
                                termParts[1]
                            ).format('YYYY-MM-DD');

                            return null;
                        } else if (
                            _.contains(
                                _.pluck(this.extraQueryTerms, 'urlSlug'),
                                termParts[0]
                            )
                        ) {
                            extraContext[termParts[0]] = termParts[1];
                        } else {
                            invalidTerms.push({
                                type: termParts[0],
                                value: termParts[1],
                            });
                        }

                        return null;
                    }.bind(this))
                    .compact()
                    .value();

                // Log invalid query terms.
                if (!_.isEmpty(invalidTerms)) {
                    _.each(
                        invalidTerms,
                        function(term) {
                            var message = '' +
                                'Invalid querystring term: "' +
                                encodeURIComponent(term.type) + '=' +
                                encodeURIComponent(term.value) + '" ' +
                                '(ignored)';
                            console.log(message);  // eslint-disable-line no-console
                        }
                    );
                }
            }

            return {
                queryTerms: parsedQueryTerms,
                dateRange: parsedDateRange,
                invalidTerms: invalidTerms,
                extraContext: extraContext,
            };
        },

        updateQuery: function(collection) {
            var commonQueryTerms = this._radio.reqres.request(
                    'getState',
                    this.stateKey,
                    'queryTerms'
                ),
                extraQueryContext = {hubs: this.options.data.hubs},
                fullTextQueries = commonQueryTerms.where({type: 'fullText'});

            if (!_.isEmpty(fullTextQueries)) {
                extraQueryContext.fullTextSearches = {};
                _.chain(fullTextQueries)
                    .each(function(query) {
                        extraQueryContext.fullTextSearches[
                            query.get('value')
                        ] = collection.fullTextIndex.search(query.get('value'));
                    })
                    .value();
            }

            if (!_.isEmpty(this.extraQueryTerms)) {
                extraQueryContext.extraQueryFunctions = _.chain(
                    this.extraQueryTerms
                )
                    .map(function(termProcessor) {
                        return _.values(termProcessor);
                    })
                    .object()
                    .value();
            }

            // Re-run the object query based on the terms.
            collection.filterAnd(
                commonQueryTerms,
                extraQueryContext
            );
        },

        generateQuerystring: function() {
            var commonQueryTerms = this._radio.reqres.request(
                    'getState',
                    this.stateKey,
                    'queryTerms'
                ),
                commonDateRange = this._radio.reqres.request(
                    'getState',
                    this.stateKey,
                    'dateRange'
                ),
                fullQuerystring = commonQueryTerms.filter(
                    function(termValue) {
                        return !_.contains(
                            _.pluck(this.extraQueryTerms, 'urlSlug'),
                            termValue.get('type')
                        );
                    }.bind(this)
                ).map(
                    function(term) {
                        var termType = encodeURIComponent(
                                            term.get('type')
                                        ),
                            termValue = encodeURIComponent(
                                            term.get('value').replace('&', '+')
                                        );

                        return termType + '=' + termValue;
                    }
                ).reduce(
                    function(memo, queryComponent, index) {
                        var newAddition = '';

                        if (index !== 0) {
                            newAddition += '&';
                        }

                        newAddition += queryComponent;

                        return memo + newAddition;
                    },
                    ''
                );

            if (!_.isEmpty(commonDateRange)) {
                if (fullQuerystring !== '') {
                    fullQuerystring += '&';
                }

                fullQuerystring += _.chain(commonDateRange)
                    .map(
                        function(value, key) {
                            return encodeURIComponent(key) + 'Date=' +
                                    encodeURIComponent(value);
                        }
                    )
                    .reduce(
                        function(memo, queryComponent, index) {
                            var dateAddition = '';

                            if (index !== 0) {
                                dateAddition += '&';
                            }

                            dateAddition += queryComponent;

                            return memo + dateAddition;
                        },
                        ''
                    )
                    .value();
            }

            if (!_.isUndefined(this.extendGenerateQuerystring)) {
                return this.extendGenerateQuerystring(fullQuerystring);
            }

            return fullQuerystring;
        },

        updateQuerystring: function() {
            // Generate a querystring based on the current terms selected.
            var querystring = this.generateQuerystring(),
                newURL = this.urlBase + querystring;

            if (querystring !== '') {
                newURL += '/';
            }

            // Navigate to that querystring.
            this._radio.commands.execute(
                'navigate',
                newURL,
                {trigger: false}
            );
        },
    });
});
