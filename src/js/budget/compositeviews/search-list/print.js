define([
    'jquery',
    'moment',
    'underscore',
    'budget/collectionviews/section-packages',
    'budget/compositeviews/search-list/base',
    'budget/itemviews/list-components/daily-title',
    'budget/itemviews/list-components/date-filter',
    'budget/itemviews/list-components/search-box',
    'budget/itemviews/list-components/print-placement-toggle',
    'budget/itemviews/packages/package-print-info',
    'common/tpl',
], function(
    $,
    moment,
    _,
    SectionPackagesCollection,
    BaseSearchList,
    DailyTitleView,
    DateFilterView,
    SearchBoxView,
    PrintPlacementToggleView,
    PackageItemPrintView,
    tpl
) {
    return BaseSearchList.extend({
        template: tpl('package-search-list-print'),

        filterViews: [
            {
                elementID: 'daily-title',
                slug: 'dailyTitle',
                ViewClass: DailyTitleView,
            },
            {
                elementID: 'date-filter',
                slug: 'dateFilter',
                ViewClass: DateFilterView,
            },
            {
                elementID: 'search-box',
                slug: 'searchBox',
                ViewClass: SearchBoxView,
            },
            {
                elementID: 'print-placement-toggle',
                slug: 'printPlacementToggle',
                ViewClass: PrintPlacementToggleView,
            },
        ],

        childView: PackageItemPrintView,
        outerClass: 'print-archive',
        stateKey: 'printSearchList',
        urlBase: '/print/',

        queryTerms: [
            {
                apiQuery: 'search',
                urlSlug: 'fullText',
            },
            {
                formatQueryValue: function(initialValue) {
                    return initialValue.split('.hub')[0];
                },
                urlSlug: 'hub',
            },
            {
                urlSlug: 'person',
            },
            {
                formatQueryValue: function(initialValue) {
                    return initialValue.split('.v')[0];
                },
                urlSlug: 'vertical',
            },
            {
                apiQuery: 'content_type',
                formatQueryValue: function(initialValue) {
                    return initialValue.split('.ct')[0];
                },
                urlSlug: 'contentType',
            },
            {
                apiQuery: 'publication',
                formatQueryValue: function(initialValue) {
                    return initialValue.split('.pub')[0];
                },
                urlSlug: 'printPublication',
            },
        ],

        extendInitialize: function() {
            this.on('changeParams', function() {
                if (_.isObject(this.ui.facetedCollectionHolder)) {
                    this.ui.facetedCollectionHolder.empty();
                    this.rerenderFacetedLists = true;
                }
            }.bind(this));
        },

        isEmpty: function(collection) {
            var thisPub = this._radio.reqres.request(
                    'getState',
                    'printSearchList',
                    'queryTerms'
                ).findWhere({type: 'printPublication'}),
                pubs = this.options.data.printPublications,
                // If no publication has been set yet, choose the first one in the list.
                // This will already be the one chosen once the view rendering ends.
                currentSlugConfig = (_.isUndefined(thisPub)) ? pubs.at(0) : pubs.findWhere({
                    slug: thisPub.get('value').split('.pub')[0],
                }),
                publicationSectionIDs = _.pluck(currentSlugConfig.get('sections'), 'id'),
                collectionIsEmpty = _.chain(collection.pluck('printSection'))
                                        .flatten()
                                        .uniq()
                                        .intersection(publicationSectionIDs)
                                        .isEmpty()
                                        .value();

            if (collectionIsEmpty) {
                if (!this.$el.hasClass('empty-collection')) {
                    this.$el.addClass('empty-collection');
                }
            } else {
                if (this.$el.hasClass('empty-collection')) {
                    this.$el.removeClass('empty-collection');
                }
            }

            return collectionIsEmpty;
        },

        generateCollectionFetchOptions: function() {
            var dateRange = this._radio.reqres.request(
                    'getState',
                    this.stateKey,
                    'dateRange'
                ),
                queryOptions,
                currentTerms = this._radio.reqres.request('getState', this.stateKey, 'queryTerms'),
                newEnd;

            // The API's results are exclusive of the end date.
            // In order to continue using an inclusive range in this interface
            // (for a more user-friendly experience), we add a day to the end
            // of the stored date range before querying.
            newEnd = moment(dateRange.end, 'YYYY-MM-DD').add({days: 1}).format('YYYY-MM-DD');

            queryOptions = {
                data: {
                    ordering: 'print_run_date',
                    print_run_date: [dateRange.start, newEnd].join(','),
                },
                deepLoad: false,
                muteConsole: true,
                xhrFields: {
                    withCredentials: true,
                },
            };

            currentTerms.each(function(filter) {
                var filterConfig,
                    returnKey = filter.get('type'),
                    returnValue = filter.get('value');

                if (_.contains(_.pluck(this.queryTerms, 'urlSlug'), filter.get('type'))) {
                    filterConfig = _.findWhere(this.queryTerms, {urlSlug: filter.get('type')});

                    if (_.has(filterConfig, 'apiQuery')) {
                        returnKey = filterConfig.apiQuery;
                    }

                    if (_.has(filterConfig, 'formatQueryValue')) {
                        returnValue = filterConfig.formatQueryValue(filter.get('value'));
                    }

                    queryOptions.data[returnKey] = returnValue;
                }
            }.bind(this));

            return queryOptions;
        },

        generateFacetedCollections: function() {
            var thisPub = this._radio.reqres.request(
                    'getState',
                    'printSearchList',
                    'queryTerms'
                ).findWhere({type: 'printPublication'}),
                pubs = this.options.data.printPublications,
                currentSlugConfig = (_.isUndefined(thisPub)) ? pubs.at(0) : pubs.findWhere({
                    slug: thisPub.get('value').split('.pub')[0],
                }),
                allSections = _.flatten(pubs.pluck('sections')),
                sectionViews = _.chain(currentSlugConfig.get('sections')).map(
                    function(section) {
                        var sectionIDs = _.chain(
                                currentSlugConfig.get('sections')
                            ).pluck('id').value(),
                            facetOuterEl = $(
                                '<div class="facet-holder">' +
                                    '<h4 class="facet-label">' + section.name + '</h1>' +
                                '</div>'
                            ).appendTo(this.ui.facetedCollectionHolder),
                            facetEl = $(
                                '<div class="packages ' + section.slug + '"></div>'
                            ).appendTo(facetOuterEl);

                        return new SectionPackagesCollection({
                            allSections: allSections,
                            collection: this.collection,
                            el: facetEl,
                            hubConfigs: this.options.data.hubs,
                            ignoredIDs: _.first(sectionIDs, _.indexOf(sectionIDs, section.id)),
                            sectionConfig: section,
                            printPublications: this.options.data.printPublications,
                            poller: this._poller,
                        });
                    }.bind(this)
                ).value();

            return sectionViews;
        },
    });
});
