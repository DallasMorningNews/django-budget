import jQuery from 'jquery';
import _ from 'underscore';

import BaseSearchList from './base';
import ContentPlacementCollection from '../../collections/content-placements';
import DailyTitleView from '../../itemviews/list-components/daily-title';
import DateFilterView from '../../itemviews/list-components/date-filter';
import PackageCollection from '../../collections/packages';
import PackageItemPrintView from '../../itemviews/packages/package-print-info';
import PlacementTypeFacetedPackageView from '../faceted-results/placement-type-faceted-packages';
import PrintPlacementToggleView from '../../itemviews/list-components/print-placement-toggle';
import SearchBoxView from '../../itemviews/list-components/search-box';
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
    this.isInitialPlacementFetch = true;

    this.on('changeParams', (change) => {
      if (_.isObject(this.ui.facetedCollectionHolder)) {
        if (
          (typeof change !== 'undefined') &&
          (typeof change.term !== 'undefined') &&
          (typeof change.term.type !== 'undefined') &&
          (change.term.type === 'destination')
        ) {
          delete this.facetedCollections;
        }

        this.rerenderFacetedLists = true;
      }
    });

    // Override this method to initialize the content-placements collection
    // before it's first needed.
    if (!_.has(this, 'placements')) {
      this.matchingPlacements = new ContentPlacementCollection();
      this.matchingPlacements.on('add', () => { this.placementsChanged(this); });
      this.matchingPlacements.on('remove', () => { this.placementsChanged(this); });
      this.matchingPlacements.on('change', () => { this.placementsChanged(this); });
    }

    this.polledData = [this.matchingPlacements];
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

  placementsChanged: _.debounce((thisObj) => {
    if (thisObj.isInitialPlacementFetch === true) {
      // eslint-disable-next-line no-param-reassign
      thisObj.isInitialPlacementFetch = false;
    } else {
      thisObj.renderFacetedLists();
      thisObj.collection.forEach(model => model.trigger('setPrimary', model, {}));
    }
  }, 1000),

  generateCollectionURL() {
    return this.radio.reqres.request('getSetting', 'apiEndpoints').package;
  },

  updatePackages() {
    const fetchOptions = this.generatePlacementFetchOptions();

    if (Object.keys(fetchOptions.data).indexOf('destination') === -1) {
      fetchOptions.data.destination = this.placementDestinations.at(0).get('slug');
    }

    this.poller.requestConfig = Object.assign({}, fetchOptions, {
      success: (placementCollection) => {  // args: collection, response, options
        this.collection.fetch(this.generateCollectionFetchOptions(placementCollection));
      },
      error: () => {  // args: collection, response, options
        console.warn('ERROR: Could not load placements given the following options:');
        console.warn(fetchOptions);
      },
    });

    this.poller.get(this.polledData, this.poller.requestConfig);
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

    const currentTypes = currentSlugConfig.get('sections');

    // Sort packages in view collection by their top-priority placement type.
    this.itemsByPlacementType = this.collection
            .map((item) => {  // Get top-priority placement type for each item.
              const placementTypeArray = item.placements[0].placementTypes
                      .map(typeSlug => currentTypes.find(pType => pType.slug === typeSlug));

              const topPlacementType = placementTypeArray
                      .filter(pType => pType.isActive === true)
                      .reduce((acc, val) => {
                        const smallerValue = (acc.priority <= val.priority) ? acc : val;

                        return smallerValue;
                      });

              return [topPlacementType.id, item];
            })
            .filter(i => i !== null)
            .reduce((acc, val) => {  // Group item by top type ID.
              const sortKey = val[0];
              acc[sortKey] = acc[sortKey] || [];
              acc[sortKey].push(val[1]);
              return acc;
            }, {});

    // Render (an Underscore) collection of faceted (Backbone) collections by
    // placement type.
    if (typeof this.facetedCollections === 'undefined') {
      this.facetedCollections = currentTypes.sort((a, b) => {
        if (a.priority === b.priority) return 0;
        return (a.priority > b.priority) ? 1 : -1;
      }).map(pType => ({
        typeConfig: pType,
        placedItems: new PackageCollection(this.itemsByPlacementType[pType.id] || []),
      }));
    } else {
      this.facetedCollections.forEach((facet) => {
        const newFacetItems = this.itemsByPlacementType[facet.typeConfig.id] || [];
        facet.placedItems.reset(newFacetItems);
      });
    }

    // Mark all containers in this.ui.facetedCollectionHolder for deletion.
    this.ui.facetedCollectionHolder.find('> .facet-holder').attr('to-delete', 'true');

    // Iterate through all current facets, getting or creating new elements to
    // hold each facet's view.
    this.sectionViewHolders = this.facetedCollections
            .map((facetConfig) => {
              const facetID = `facet_${facetConfig.typeConfig.id}`;

              const existingFacetHolder = this.ui.facetedCollectionHolder
                                                      .find(`> #${facetID}`);

              const facetEl = (
                existingFacetHolder.length > 0
              ) ? (
                existingFacetHolder
              ) : (
                jQuery(`<div id=${
                  facetID
                } class="facet-holder"></div>`)
                      .appendTo(this.ui.facetedCollectionHolder)
              );

              facetEl.removeAttr('to-delete');

              return { facetID: facetConfig.typeConfig.id, facetEl };
            })
            .reduce((acc, item) => Object.assign(acc, {
              [item.facetID]: item.facetEl,
            }), {});

    // Remove all facets that still have the deletion flag.
    this.ui.facetedCollectionHolder.find('> .facet-holder[to-delete="true"]').remove();

    // Generate each of the prospective facet views.
    this.sectionViews = this.facetedCollections
            .map(facetConfig => new PlacementTypeFacetedPackageView({
              facetConfig,
              el: this.sectionViewHolders[facetConfig.typeConfig.id],
              extraContext: {
                currentTypes,
                hubConfigs: this.options.data.hubs,
                placementDestinations: this.placementDestinations,
              },
              poller: this.poller,  // Needed for poll-pausing on package views.
            }));

    return this.sectionViews;
  },
});
