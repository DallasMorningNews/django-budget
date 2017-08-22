import jQuery from 'jquery';
import _ from 'underscore';

import deline from '../../../vendored/deline';

import settings from '../../../common/settings';

import BaseSearchList from './base';
import DailyTitleView from '../../itemviews/list-components/daily-title';
import DateFilterView from '../../itemviews/list-components/date-filter';
import PackageItemPrintView from '../../itemviews/packages/package-print-info';
import PrintPlacementToggleView from '../../itemviews/list-components/print-placement-toggle';
import SearchBoxView from '../../itemviews/list-components/search-box';
import SectionPackagesCollection from '../../collectionviews/section-packages';

export default BaseSearchList.extend({
    template: 'budget/package-search-list-print',

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
            formatQueryValue: initialValue => initialValue.split('.hub')[0],
            urlSlug: 'hub',
        },
        {
            urlSlug: 'person',
        },
        {
            formatQueryValue: initialValue => initialValue.split('.v')[0],
            urlSlug: 'vertical',
        },
        {
            apiQuery: 'content_type',
            formatQueryValue: initialValue => initialValue.split('.ct')[0],
            urlSlug: 'contentType',
        },
        {
            apiQuery: 'publication',
            formatQueryValue: initialValue => initialValue.split('.pub')[0],
            urlSlug: 'printPublication',
        },
    ],

    extendInitialize() {
        this.on('changeParams', () => {
            if (_.isObject(this.ui.facetedCollectionHolder)) {
                this.ui.facetedCollectionHolder.empty();
                this.rerenderFacetedLists = true;
            }
        });
    },

    isEmpty(collection) {
        const thisPub = this.radio.reqres.request(
            'getState',
            'printSearchList',
            'queryTerms'
        ).findWhere({ type: 'printPublication' });

        const pubs = this.options.data.printPublications;

        // If no publication has been set yet, choose the first one in the list.
        // This will already be the one chosen once the view rendering ends.
        const currentSlugConfig = (
            _.isUndefined(thisPub)
        ) ? pubs.at(0) : pubs.findWhere({
            slug: thisPub.get('value').split('.pub')[0],
        });
        const publicationSectionIDs = _.pluck(
            currentSlugConfig.get('sections'),
            'id'
        );
        const collectionIsEmpty = _.chain(collection.pluck('printSection'))
                                .flatten()
                                .uniq()
                                .intersection(publicationSectionIDs)
                                .isEmpty()
                                .value();

        if (collectionIsEmpty) {
            if (!this.$el.hasClass('empty-collection')) {
                this.$el.addClass('empty-collection');
            }
        } else if (this.$el.hasClass('empty-collection')) {
            this.$el.removeClass('empty-collection');
        }

        return collectionIsEmpty;
    },

    generateCollectionFetchOptions() {
        const dateRange = this.radio.reqres.request(
            'getState',
            this.stateKey,
            'dateRange'
        );
        const currentTerms = this.radio.reqres.request(
            'getState',
            this.stateKey,
            'queryTerms'
        );

        // The API's results are exclusive of the end date.
        // In order to continue using an inclusive range in this interface
        // (for a more user-friendly experience), we add a day to the end
        // of the stored date range before querying.
        const newEnd = settings.moment(
            dateRange.end,
            'YYYY-MM-DD'
        ).add({ days: 1 }).format('YYYY-MM-DD');

        const queryOptions = {
            data: {
                has_primary: 1,
                ordering: 'print_run_date',
                print_run_date: [dateRange.start, newEnd].join(','),
            },
            deepLoad: false,
            muteConsole: true,
            xhrFields: {
                withCredentials: true,
            },
        };

        currentTerms.each((filter) => {
            let filterConfig;
            let returnKey = filter.get('type');
            let returnValue = filter.get('value');

            if (_.contains(_.pluck(this.queryTerms, 'urlSlug'), filter.get('type'))) {
                filterConfig = _.findWhere(
                  this.queryTerms,
                  { urlSlug: filter.get('type') }
                );

                if (_.has(filterConfig, 'apiQuery')) {
                    returnKey = filterConfig.apiQuery;
                }

                if (_.has(filterConfig, 'formatQueryValue')) {
                    returnValue = filterConfig.formatQueryValue(filter.get('value'));
                }

                queryOptions.data[returnKey] = returnValue;
            }
        });

        return queryOptions;
    },

    generateDefaultDateRange() {
        const currentDate = settings.moment().tz('America/Chicago').startOf('day');

        return {
            start: currentDate.clone().add(1, 'days').format('YYYY-MM-DD'),
            end: currentDate.clone().add(1, 'days').format('YYYY-MM-DD'),
            // end: currentDate.clone().add({ days: 3 }).format('YYYY-MM-DD'),
        };
    },

    generateFacetedCollections() {
        const thisPub = this.radio.reqres.request(
            'getState',
            'printSearchList',
            'queryTerms'
        ).findWhere({ type: 'printPublication' });
        const pubs = this.options.data.printPublications;
        const currentSlugConfig = (
            _.isUndefined(thisPub)
        ) ? pubs.at(0) : pubs.findWhere({
            slug: thisPub.get('value').split('.pub')[0],
        });
        const allSections = _.flatten(pubs.pluck('sections'));
        const sectionViews = _.chain(currentSlugConfig.get('sections')).map(
            (section) => {
                const sectionIDs = _.chain(
                    currentSlugConfig.get('sections')
                ).pluck('id').value();

                const facetOuterEl = jQuery(deline`
                    <div class="facet-holder">

                        <h4 class="facet-label">${section.name}</h4>

                    </div>`
                ).appendTo(this.ui.facetedCollectionHolder);

                const facetEl = jQuery(
                    `<div class="packages ${section.slug}"></div>`
                ).appendTo(facetOuterEl);

                return new SectionPackagesCollection({
                    allSections,
                    collection: this.collection,
                    el: facetEl,
                    hubConfigs: this.options.data.hubs,
                    ignoredIDs: _.first(sectionIDs, _.indexOf(sectionIDs, section.id)),
                    sectionConfig: section,
                    printPublications: this.options.data.printPublications,
                    poller: this.poller,
                });
            }
        ).value();

        return sectionViews;
    },
});
