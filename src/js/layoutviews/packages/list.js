define([
    'marionette',
    'underscore',
    'misc/tpl',
    'collections/packages',
    'collectionviews/packages/package-collection',
    'itemviews/packages/date-filter',
    'itemviews/packages/search-box',
    'misc/settings'
], function(
    Mn,
    _,
    tpl,
    PackageCollection,
    PackageCollectionView,
    DateFilterView,
    SearchBoxView,
    settings
) {
    return Mn.LayoutView.extend({
        id: 'package-archive',
        template: tpl('packages-list'),
        regions: {
            dateFilter: "#filter-holder #date-filter",
            searchBox: "#filter-holder #search-box",
            packages: "#package-list"
        },

        initialize: function() {
            this._radio = Backbone.Wreqr.radio.channel('global');

            this.options.state.dateRange = this.options.boundData.dateRange;

            this.packageCollection = new PackageCollection();

            this.loadPackages(
                function(collection, request, options) {
                    if (!_.isNull(this.options.boundData.queryTerms)) {
                        this.options.state.queryTerms.reset(
                            this.options.boundData.queryTerms
                        );
                        this.updateQuery(collection);
                    }

                    this.dateFilterView = new DateFilterView({
                        collection: collection,
                        data: this.options.data,
                        state: this.options.state,
                    });
                    this.searchBoxView = new SearchBoxView({
                        data: this.options.data,
                        state: this.options.state,
                    });

                    this.collectionView = new PackageCollectionView({
                        collection: collection,
                        currentUser: this.options.currentUser,
                        hubs: this.options.data.hubs,
                        state: this.options.state,
                    });

                    this.updateQuerystring();

                    this.options.initFinishedCallback(this);
                }.bind(this)
            );

            // Handler for updating our internal date filters.
            this._radio.commands.setHandler(
                'switchListDates',
                function(newDates) {
                    this.options.state.dateRange = newDates;

                    this.loadPackages(
                        function(collection, response, options) {
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
                function(queryObject) {
                    this.options.state.queryTerms.push(queryObject);

                    this.updateQuery(this.packageCollection);
                    this.updateQuerystring();
                },
                this
            );

            // Handler for removing a query term.
            this._radio.commands.setHandler(
                'popQueryTerm',
                function(queryValue) {
                    this.options.state.queryTerms.remove(
                        this.options.state.queryTerms.where({
                            value: queryValue
                        })
                    );

                    this.updateQuery(this.packageCollection);
                    this.updateQuerystring();
                },
                this
            );
        },

        loadPackages: function(callbackFunction) {
            var newPackagesURL = settings.urlConfig.packageEndpoint;

            if (!_.isEmpty(this.options.state.dateRange)) {
                newPackagesURL = newPackagesURL +
                                    this.options.state.dateRange.start + '/' +
                                    this.options.state.dateRange.end + '/';
            }
            this.packageCollection.url = newPackagesURL;

            this.packageCollection.fetch().done(
                function(data, textStatus, jqXHR) {
                    this.packageCollection.rebuildIndex();

                    callbackFunction(this.packageCollection, jqXHR, {});
                }.bind(this)
            );
        },

        updateQuery: function(collection) {
            var extraQueryContext = {
                    hubs: this.options.data.hubs
                },
                fullTextQueries = this.options.state.queryTerms.where({
                    type: 'fullText'
                });

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

            // Re-run the object query based on the terms.
            collection.filterAnd(
                this.options.state.queryTerms,
                extraQueryContext
            );
        },

        generateQuerystring: function() {
            var fullQuerystring = this.options.state.queryTerms.map(
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

            if (!_.isEmpty(this.options.state.dateRange)) {
                if (fullQuerystring !== '') {
                    fullQuerystring += '&';
                }

                fullQuerystring += _.chain(
                    this.options.state.dateRange
                )
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

            return fullQuerystring;
        },

        updateQuerystring: function() {
            // Generate a querystring based on the current terms selected.
            var querystring = this.generateQuerystring() + '/';

            // Navigate to that querystring.
            this._radio.commands.execute(
                'navigate',
                querystring,
                {
                    trigger: false
                }
            );
        },

        onRender: function() {
            this.showChildView('dateFilter', this.dateFilterView);
            this.showChildView('searchBox', this.searchBoxView);

            this.showChildView('packages', this.collectionView);
        }
    });
});