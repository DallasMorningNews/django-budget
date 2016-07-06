define([
    'backbone',
    'jquery',
    'marionette',
    'moment',
    'underscore',
    'common/poller',
    'common/settings',
    'common/tpl',
    'budget/collections/packages',
    'budget/collections/query-terms',
    'budget/itemviews/packages/no-package',
], function(
    Backbone,
    $,
    Mn,
    moment,
    _,
    Poller,
    settings,
    tpl,
    PackageCollection,
    QueryTermCollection,
    NoPackagesView
) {
    return Mn.CompositeView.extend({
        id: 'package-archive',

        regions: {},

        filterViews: [],

        queryTerms: [],

        isAttached: false,

        filtersRendered: false,

        events: {
            // 'all': 'logEvents',
            dataUpdated: 'onDataUpdated',
        },

        // Initialize the collection.
        collection: new PackageCollection(),

        collectionEvents: {
            sync: 'onCollectionSync',
        },

        childEvents: {
            'dom:refresh': 'onChildRender',
        },

        ui: {
            filterHolder: '#filter-holder',
            facetedCollectionHolder: '#faceted-packages',
            collectionHolder: '#package-list div',
        },

        childViewOptions: function(model, index) {  // eslint-disable-line no-unused-vars
            return {
                currentUser: this.options.currentUser,
                hubConfigs: this.options.data.hubs,
            };
        },

        getEmptyView: function() {
            // custom logic
            return NoPackagesView;
        },

        initialize: function() {
            // Initialize the Wreqr channel.
            this._radio = Backbone.Wreqr.radio.channel('global');

            // Initialize the poller and the list of polled data.
            this._poller = new Poller();
            this.polledData = [this.collection];

            // Initialize additional regions.
            this.extraViewInstances = {};

            // Parse querystring to get initial state.
            this.initialState = this.parseQueryString(this.options.boundData.querystring);

            // Bind radio event handlers.
            this.bindRadioEvents();

            // If the view's initial date range is saved, defer to that value.
            if (_.isUndefined(this._radio.reqres.request('getState', this.stateKey, 'dateRange'))) {
                // If there's no saved date range and no given range, fall through to the default.
                if (_.isEmpty(this.initialState.dateRange)) {
                    this.initialState.dateRange = this.generateDefaultDateRange();
                }

                // Cache this view's date range for future requests.
                this._radio.commands.execute(
                    'setState',
                    this.stateKey,
                    'dateRange',
                    this.initialState.dateRange
                );
            }

            // If no cached term collection exists, create and cache the
            // collection where they will be stored.
            if (_.isUndefined(
                this._radio.reqres.request('getState', this.stateKey, 'queryTerms')
            )) {
                this._radio.commands.execute(
                    'setState',
                    this.stateKey,
                    'queryTerms',
                    new QueryTermCollection()
                );
            }

            // If there have been initial query terms specified in the URL,
            // apply those.
            if (!_.isEmpty(this.initialState.queryTerms)) {
                this._radio.commands.execute(
                    'setState',
                    this.stateKey,
                    'queryTerms',
                    function(terms) {
                        terms.reset();
                        _.each(
                            this.initialState.queryTerms,
                            function(queryValue) { terms.add(queryValue); }
                        );
                    }.bind(this)
                );
            }

            // Initialize all filters on this page.
            this.filters = {};
            this.filterIDs = {};
            _.each(this.filterViews, function(filterConfig) {
                this.filterIDs[filterConfig.slug] = filterConfig.elementID;

                this.filters[filterConfig.slug] = new filterConfig.ViewClass({
                    collection: this.collection,
                    data: this.options.data,
                    stateKey: this.stateKey,
                });
            }.bind(this));

            // Set the appropriate data URL for this query.
            this.collection.url = this.generateCollectionURL();

            // Retrieve packages based on the current query parameters.
            this.updatePackages();

            // On subsequent data updates after initial load, the 'dataUpdated'
            // event will be triggered. Bind that to the `onDataUpdated()` fn.
            this.on('dataUpdated', this.onDataUpdated);

            // Run overrides to init method.
            if (!_.isUndefined(this.extendInitialize)) {
                this.extendInitialize();
            }
        },

        bindRadioEvents: function() {
            // Handler for updating our internal date filters.
            this._radio.commands.setHandler(
                'switchListDates',
                function(stateKey, newDates) {
                    this._radio.commands.execute('setState', stateKey, 'dateRange', newDates);

                    this.updatePackages();
                    this.updateQuerystring();
                    this.trigger('changeParams');
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

                    this.updatePackages();
                    this.updateQuerystring();
                    this.trigger('changeParams');
                },
                this
            );

            // Handler for removing a query term.
            this._radio.commands.setHandler(
                'popQueryTerm',
                function(stateKey, queryValue, options) {
                    var opts = options || {silent: false};

                    this._radio.commands.execute(
                        'setState',
                        stateKey,
                        'queryTerms',
                        function(terms) {
                            terms.remove(terms.where({value: queryValue}));
                        }.bind(this)  // eslint-disable-line no-extra-bind
                    );

                    if ((opts.silent === false)) {
                        this.updatePackages();
                        this.updateQuerystring();
                        this.trigger('changeParams');
                    }
                },
                this
            );
        },

        generateCollectionURL: function() { return settings.apiEndpoints.package; },

        generateCollectionFetchOptions: function() { return {}; },

        generateDefaultDateRange: function() {
            var currentDate = moment().tz('America/Chicago').startOf('day');

            return {
                start: currentDate.format('YYYY-MM-DD'),
                end: currentDate.clone().add({days: 3}).format('YYYY-MM-DD'),
            };
        },

        generateFacetedCollections: function() {
            return [];
        },

        parseQueryString: function(querystring, returnValue) {  // eslint-disable-line no-unused-vars,max-len
            var parsedQueryTerms = [],
                parsedDateRange = {},
                extraContext = {},
                invalidTerms = [],
                dateQueryTerms = ['startDate', 'endDate'];

            if (!_.isNull(querystring)) {
                parsedQueryTerms = _.chain(querystring.split('&'))
                    .map(function(component) {
                        var termParts = _.map(component.split('='), decodeURIComponent);

                        if (_.contains(dateQueryTerms, termParts[0])) {
                            parsedDateRange[termParts[0].slice(0, -4)] = moment(
                                termParts[1]
                            ).format('YYYY-MM-DD');

                            return null;
                        } else if (
                            _.contains(_.pluck(this.queryTerms, 'urlSlug'), termParts[0])
                        ) {
                            return {type: termParts[0], value: termParts[1]};
                        }

                        invalidTerms.push({type: termParts[0], value: termParts[1]});

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

        generateQuerystring: function() {
            var terms = this._radio.reqres.request('getState', this.stateKey, 'queryTerms'),
                dateRange = this._radio.reqres.request('getState', this.stateKey, 'dateRange'),
                fullQuerystring = terms.filter(
                    function(termValue) {
                        return !_.contains(
                            _.pluck(this.extraQueryTerms, 'urlSlug'),
                            termValue.get('type')
                        );
                    }.bind(this)
                ).map(
                    function(term) {
                        var termType = encodeURIComponent(term.get('type')),
                            termValue = encodeURIComponent(term.get('value').replace('&', '+'));
                        return termType + '=' + termValue;
                    }
                ).reduce(function(memo, queryComponent, index) {
                    var newAddition = (index !== 0) ? '&' : '';
                    newAddition += queryComponent;
                    return memo + newAddition;
                }, '');

            if (!_.isEmpty(dateRange)) {
                if (fullQuerystring !== '') {
                    fullQuerystring += '&';
                }

                fullQuerystring += _.chain(dateRange)
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
            this._radio.commands.execute('navigate', newURL, {trigger: false});
        },

        renderFilters: function() {
            // Create DOM elements for all unrendered filter objects, then
            // attach them.
            _.each(
                this.filters,
                function(filterObj, filterName) {
                    var filterEl = $(
                        '<div id="' + this.filterIDs[filterName] + '"></div>'
                    ).appendTo(this.ui.filterHolder);

                    filterObj.setElement(filterEl[0]);
                }.bind(this)
            );

            // Render all filters.
            // eslint-disable-next-line newline-per-chained-call,max-len
            _.chain(this.filters).values().invoke('render').value();

            // if (!this.filtersRendered) {
                // Set this flag to true, so this step is only called once.
                // this.filtersRendered = true;
            // }
        },

        renderFacetedLists: function() {
            // Create each faceted list.
            this.facetedCollections = this.generateFacetedCollections();

            // Render each of the faceted collections.
            _.invoke(this.facetedCollections, 'render');
        },

        updatePackages: function() {
            // Configure poller with fetch options.
            // This includes all querystring arguments (the `data` option sent
            // to `sync()`).
            this._poller.requestConfig = this.generateCollectionFetchOptions();

            // Retrieve collection from the server.
            this._poller.get(this.polledData, this._poller.requestConfig);
        },

        onCollectionSync: function() {
            // When collection is synced with the server get all related items,
            // render child views and restart poller.
            var packageRelatedDeferred = [],
                wasAttached = this.isAttached;

            if (this.rerenderFacetedLists === true) {
                this.renderFacetedLists();
                this.rerenderFacetedLists = false;
            }

            this._poller.pause({muteConsole: true});

            // If this view is not yet attached, finalize that process.
            if (!this.isAttached) {
                this.options.initFinishedCallback(this);
            }

            this.collection.each(function(package) {
                var loadDeferred = package.loadRelatedItems(
                    package.toJSON(),
                    {muteConsole: true}
                );

                packageRelatedDeferred.push(loadDeferred);

                loadDeferred.done(function() {
                    package.trigger('change', package, {});
                }.bind(this));  // eslint-disable-line no-extra-bind
            }.bind(this));  // eslint-disable-line no-extra-bind

            $.when.apply($, packageRelatedDeferred).done(function() {
                // If this view is not yet attached, finalize that process.
                if (wasAttached) {
                    this.trigger('dataUpdated');
                }

                // Resume polling. In 30 seconds the app will sync with the server again.
                this._poller.resume({muteConsole: true});
            }.bind(this));
        },

        onChildRender: function(childView) {
            if ((!childView.model.isNew()) && (!childView.model.primaryContentItem.isNew())) {
                if (!childView.hasPrimary) {
                    childView.hasPrimary = true;  // eslint-disable-line no-param-reassign

                    if (!childView.$el.find('.package-sheet').hasClass('has-primary')) {
                        setTimeout(function() {
                            childView.$el.find('.package-sheet').addClass('has-primary');
                        }, 100);
                    }
                }
            }

            childView.model.trigger('setPrimary', childView.model, {});
        },

        onDataUpdated: function() {
            // console.log('ODU.');
        },

        attachBuffer: function(collectionView, buffer) {
            this.ui.collectionHolder.append(buffer);
        },

        _insertBefore: function(childView, index) {
            var currentView,
                findPosition = this.getOption('sort') && (index < this.children.length - 1);

            if (findPosition) {
                // Find the view after this one
                currentView = this.children.find(function(view) {
                    return view._index === index + 1;  // eslint-disable-line no-underscore-dangle
                });
            }

            if (currentView) {
                currentView.$el.before(childView.el);
                return true;
            }

            return false;
        },

        // Internal method. Append a view to the end of the $el
        _insertAfter: function(childView) {
            this.ui.collectionHolder.append(childView.el);
        },

        onAttach: function() {
            this.renderFacetedLists();
        },

        onRender: function() {
            this.$el.addClass(this.outerClass);

            this.renderFilters();

            // if (!_.isEmpty(this.extraChildViews)) {
            //     // TODO: Destroy old views.
            //     this.extraViewInstances = {};
            //
            //     _.each(
            //         this.extraChildViews,
            //         function(ViewClass, region) {
            //             var viewInstance = new ViewClass({
            //                 data: this.options.data,
            //                 stateKey: this.stateKey,
            //             });
            //
            //             this.extraViewInstances[region] = viewInstance;
            //             this.showChildView(region, viewInstance);
            //         }.bind(this)
            //     );
            // }
            //
            // this.showChildView('dateFilter', this.dateFilterView);
            // this.showChildView('searchBox', this.searchBoxView);
            //
            // this.showChildView('packages', this.collectionView);
        },

        onBeforeDestroy: function() {
            this._poller.destroy();
        },
    });
});
