import jQuery from 'jquery';
import _ from 'underscore';

import deline from '../../../vendored/deline';

import BaseSearchList from './base';
import ContentPlacementCollection from '../../collections/content-placements';
import DailyTitleView from '../../itemviews/list-components/daily-title';
import DateFilterView from '../../itemviews/list-components/date-filter';
import PackageItemPrintView from '../../itemviews/packages/package-print-info';
import PrintPlacementToggleView from '../../itemviews/list-components/print-placement-toggle';
import SearchBoxView from '../../itemviews/list-components/search-box';
import SectionPackagesCollection from '../../collectionviews/section-packages';
import urlConfig from '../../misc/urls';

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
  urlBase: urlConfig.printListPage.reversePattern,

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
      apiQuery: 'destination',
      formatQueryValue: initialValue => initialValue.split('.dest')[0],
      urlSlug: 'destination',
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
    const thisDest = this.radio.reqres.request(
      'getState',
      'printSearchList',
      'queryTerms'  // eslint-disable-line comma-dangle
    ).findWhere({ type: 'destination' });

    const placementLinkedCollection = collection.linkPlacements(this.matchingPlacements);

    const destinations = this.placementDestinations;

    // If no destination has been set yet, choose the first one in the list.
    // This will already be the one chosen once the view rendering ends.
    const currentSlugConfig = (
      _.isUndefined(thisDest)
    ) ? destinations.at(0) : destinations.findWhere({
      slug: thisDest.get('value').split('.dest')[0],
    });

    const destinationSectionSlugs = _.pluck(currentSlugConfig.get('sections'), 'slug');

    const placementsByCollection = _.flatten(placementLinkedCollection
                                                    .map(i => i.placements))
                                                .map(i => i.placementTypes);
    const collectionIsEmpty = _.chain(placementsByCollection)
        .flatten()
        .uniq()
        .intersection(destinationSectionSlugs)
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

  serializeQueryTerms() {
    const terms = {};

    const currentTerms = this.radio.reqres.request('getState', this.stateKey, 'queryTerms');

    currentTerms.each((filter) => {
      let filterConfig;
      let returnKey = filter.get('type');
      let returnValue = filter.get('value');

      if (_.contains(_.pluck(this.queryTerms, 'urlSlug'), filter.get('type'))) {
        filterConfig = _.findWhere(this.queryTerms, { urlSlug: filter.get('type') });

        if (_.has(filterConfig, 'apiQuery')) {
          returnKey = filterConfig.apiQuery;
        }

        if (_.has(filterConfig, 'formatQueryValue')) {
          returnValue = filterConfig.formatQueryValue(filter.get('value'));
        }

        terms[returnKey] = returnValue;
      }
    });

    return terms;
  },

  generateCollectionURL() {
    // Override this method to initialize the content-placements collection
    // before it's first needed.
    if (!_.has(this, 'placements')) {
      this.matchingPlacements = new ContentPlacementCollection();
    }

    return this.radio.reqres.request('getSetting', 'apiEndpoints').package;
  },

  updatePackages() {
    // First, load placements based on currently-set options.
    const fetchOptions = this.generatePlacementFetchOptions();
    this.matchingPlacements.fetch(Object.assign({}, fetchOptions, {
      success: (placementCollection) => {  // args: collection, response, options
        // Update poller config with appropriate IDs.
        this.poller.requestConfig = this.generateCollectionFetchOptions(placementCollection);

        // Retrieve collection from the server.
        this.poller.get(this.polledData, this.poller.requestConfig);
      },
      error: () => {  // args: collection, response, options
        console.warn('ERROR: Could not load placements given the following options:');
        console.warn(fetchOptions);
      },
    }));
  },

  generateCollectionFetchOptions(placements) {
    const packageIDs = placements.pluck('package');

    const queryOptions = {
      deepLoad: false,
      muteConsole: true,
      xhrFields: {
        withCredentials: true,
      },
      success: (collection) => {
        collection.linkPlacements(this.matchingPlacements);
      },
    };

    const filterTerms = this.serializeQueryTerms();

    const uniqueIDs = _.uniq(packageIDs);

    // Search for an impossible ID if no packages exist for the
    // currently-specified conditions.
    const idList = (uniqueIDs.length === 0) ? '-1' : uniqueIDs.join();

    queryOptions.data = Object.assign({}, _.omit(filterTerms, 'destination'), {
      id__in: idList,
    });

    return queryOptions;
  },

  generatePlacementFetchOptions() {
    const dateRange = this.radio.reqres.request('getState', this.stateKey, 'dateRange');

    // The API's results are exclusive of the end date.
    // In order to continue using an inclusive range in this interface
    // (for a more user-friendly experience), we add a day to the end
    // of the stored date range before querying.
    const moment = this.radio.reqres.request('getSetting', 'moment');
    const newEnd = moment(
        dateRange.end,
        'YYYY-MM-DD'  // eslint-disable-line comma-dangle
    ).add({ days: 1 }).format('YYYY-MM-DD');

    const queryOptions = {
      deepLoad: false,
      muteConsole: true,
      xhrFields: {
        withCredentials: true,
      },
    };

    const filterTerms = this.serializeQueryTerms();

    queryOptions.data = Object.assign({}, _.pick(filterTerms, 'destination'), {
      ordering: 'run_date',
      run_date: [dateRange.start, newEnd].join(','),
    });

    return queryOptions;
  },

  generateDefaultDateRange() {
    const moment = this.radio.reqres.request('getSetting', 'moment');
    const defaultTimezone = this.radio.reqres.request('getSetting', 'defaultTimezone');
    const currentDate = moment().tz(defaultTimezone).startOf('day');

    return {
      start: currentDate.clone().add(1, 'days').format('YYYY-MM-DD'),
      end: currentDate.clone().add(1, 'days').format('YYYY-MM-DD'),
      // end: currentDate.clone().add({ days: 3 }).format('YYYY-MM-DD'),
    };
  },

  generateFacetedCollections() {
    const thisDest = this.radio.reqres.request(
      'getState',
      'printSearchList',
      'queryTerms'  // eslint-disable-line comma-dangle
    ).findWhere({ type: 'destination' });

    const destinations = this.placementDestinations;

    const currentSlugConfig = (
        _.isUndefined(thisDest)
    ) ? destinations.at(0) : destinations.findWhere({
      slug: thisDest.get('value').split('.dest')[0],
    });

    const allSections = _.flatten(destinations.pluck('sections'));

    const sectionViews = _.chain(currentSlugConfig.get('sections')).map((section) => {
      const sectionSlugs = _.pluck(currentSlugConfig.get('sections'), 'slug');

      const facetOuterEl = jQuery(deline`
        <div class="facet-holder">

            <h4 class="facet-label">${section.name}</h4>

        </div>`  // eslint-disable-line comma-dangle
      ).appendTo(this.ui.facetedCollectionHolder);

      const facetEl = jQuery(`<div class="packages ${
        section.slug
      }"></div>`).appendTo(facetOuterEl);

      const sectionPackagesCollection = new SectionPackagesCollection({
        allSections,
        collection: this.collection,
        el: facetEl,
        hubConfigs: this.options.data.hubs,
        ignoredSlugs: _.first(sectionSlugs, _.indexOf(sectionSlugs, section.slug)),
        sectionConfig: section,
        placements: this.matchingPlacements,
        placementDestinations: this.placementDestinations,
        poller: this.poller,
      });

      return sectionPackagesCollection;
    }).value();

    return sectionViews;
  },
});
