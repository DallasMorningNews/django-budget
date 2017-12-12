import Backbone from 'backbone';
import jQuery from 'jquery';
import Mn from 'backbone.marionette';
import _ from 'underscore';

import deline from '../../../vendored/deline';

import Poller from '../../../common/poller';

import PackageCollection from '../../collections/packages';
import QueryTermCollection from '../../collections/query-terms';
import NoPackagesView from '../../itemviews/packages/no-package';

export default Mn.CompositeView.extend({
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

  childViewOptions(model, index) {  // eslint-disable-line no-unused-vars
    return {
      currentUser: this.options.currentUser,
      hubConfigs: this.options.data.hubs,
      placementDestinations: this.placementDestinations,
    };
  },

  getEmptyView() {
    // custom logic
    return NoPackagesView;
  },

  initialize() {
    // Initialize the Wreqr channel.
    this.radio = Backbone.Wreqr.radio.channel('global');

    // Initialize the poller and the list of polled data.
    this.poller = new Poller({
      pollInterval: this.radio.reqres.request('getSetting', 'pollInterval'),
      // isPolling: false,
    });
    this.polledData = [this.collection];

    // Initialize additional regions.
    this.extraViewInstances = {};

    // Parse querystring to get initial state.
    this.initialState = this.parseQueryString(this.options.boundData.querystring);

    // Bind radio event handlers.
    this.bindRadioEvents();

    // If the view's initial date range is saved, defer to that value.
    if (_.isUndefined(this.radio.reqres.request('getState', this.stateKey, 'dateRange'))) {
      // If there's no saved date range and no given range, fall through to the default.
      if (_.isEmpty(this.initialState.dateRange)) {
        this.initialState.dateRange = this.generateDefaultDateRange();
      }

      // Cache this view's date range for future requests.
      this.radio.commands.execute(
        'setState',
        this.stateKey,
        'dateRange',
        this.initialState.dateRange  // eslint-disable-line comma-dangle
      );
    }

    // If no cached term collection exists, create and cache the
    // collection where they will be stored.
    if (_.isUndefined(
      // eslint-disable-next-line comma-dangle
      this.radio.reqres.request('getState', this.stateKey, 'queryTerms')
    )) {
      this.radio.commands.execute(
        'setState',
        this.stateKey,
        'queryTerms',
        new QueryTermCollection()  // eslint-disable-line comma-dangle
      );
    }

    // If there have been initial query terms specified in the URL,
    // apply those.
    if (!_.isEmpty(this.initialState.queryTerms)) {
      this.radio.commands.execute(
          'setState',
          this.stateKey,
          'queryTerms',
          (terms) => {
            terms.reset();
            _.each(
              this.initialState.queryTerms,
              // eslint-disable-next-line comma-dangle
              (queryValue) => { terms.add(queryValue); }
            );
          }  // eslint-disable-line comma-dangle
      );
    }

    // Initialize all filters on this page.
    this.filters = {};
    this.filterIDs = {};
    _.each(this.filterViews, (filterConfig) => {
      this.filterIDs[filterConfig.slug] = filterConfig.elementID;

      this.filters[filterConfig.slug] = new filterConfig.ViewClass({
        collection: this.collection,
        data: this.options.data,
        stateKey: this.stateKey,
      });
    });

    // Set the appropriate data URL for this query.
    this.collection.url = this.generateCollectionURL();

    // Set up a shortcut for accessing the placement destination collection.
    this.placementDestinations = this.options.data.printPublications;

    // Run overrides to init method.
    if (!_.isUndefined(this.extendInitialize)) {
      this.extendInitialize();
    }

    // Retrieve packages based on the current query parameters.
    this.updatePackages();

    // On subsequent data updates after initial load, the 'dataUpdated'
    // event will be triggered. Bind that to the `onDataUpdated()` fn.
    this.on('dataUpdated', this.onDataUpdated);
  },

  bindRadioEvents() {
    // Handler for updating our internal date filters.
    this.radio.commands.setHandler(
      'switchListDates',
      (stateKey, newDates) => {
        this.radio.commands.execute('setState', stateKey, 'dateRange', newDates);

        this.updatePackages();
        this.updateQuerystring();
        this.trigger('changeParams');
      },
      this  // eslint-disable-line comma-dangle
    );

    // Handler for adding a query term.
    this.radio.commands.setHandler(
      'pushQueryTerm',
      (stateKey, queryObject) => {
        this.radio.commands.execute(
          'setState',
          stateKey,
          'queryTerms',
          (terms) => { terms.push(queryObject); }  // eslint-disable-line comma-dangle
        );

        this.updatePackages();
        this.updateQuerystring();
        this.trigger('changeParams', { mode: 'add', term: queryObject });
      },
      this  // eslint-disable-line comma-dangle
    );

    // Handler for removing a query term.
    this.radio.commands.setHandler(
      'popQueryTerm',
      (stateKey, queryValue, options) => {
        const opts = options || { silent: false };

        this.radio.commands.execute(
          'setState',
          stateKey,
          'queryTerms',
          (terms) => {
            terms.remove(terms.where({ value: queryValue }));
          }  // eslint-disable-line comma-dangle
        );

        if ((opts.silent === false)) {
          this.updatePackages();
          this.updateQuerystring();
          this.trigger('changeParams', { mode: 'remove', term: { value: queryValue } });
        }
      },
      this  // eslint-disable-line comma-dangle
    );
  },

  generateCollectionURL() {
    return this.radio.reqres.request('getSetting', 'apiEndpoints').package;
  },

  generateCollectionFetchOptions() { return {}; },

  generateDefaultDateRange() {
    return {};
  },

  generateFacetedCollections() {
    return [];
  },

  parseQueryString(querystring) {
    let parsedQueryTerms = [];
    const parsedDateRange = {};
    const extraContext = {};
    const invalidTerms = [];
    const dateQueryTerms = ['startDate', 'endDate'];

    if (!_.isNull(querystring)) {
      parsedQueryTerms = _.chain(querystring.split('&'))
        .map((component) => {
          const termParts = _.map(
            component.split('='),
            decodeURIComponent  // eslint-disable-line comma-dangle
          );

          const moment = this.radio.reqres.request('getSetting', 'moment');

          if (_.contains(dateQueryTerms, termParts[0])) {
            parsedDateRange[
                termParts[0].slice(0, -4)
            ] = moment(termParts[1]).format('YYYY-MM-DD');

            return null;
          } else if (
            _.contains(
              _.pluck(this.queryTerms, 'urlSlug'),
              termParts[0]  // eslint-disable-line comma-dangle
            )
          ) {
            return { type: termParts[0], value: termParts[1] };
          }

          invalidTerms.push({
            type: termParts[0],
            value: termParts[1],
          });

          return null;
        })
        .compact()
        .value();

      // Log invalid query terms.
      if (!_.isEmpty(invalidTerms)) {
        _.each(
            invalidTerms,
            (term) => {
              const message = deline`
                Invalid querystring term: "${
                    encodeURIComponent(term.type)
                }=${
                    encodeURIComponent(term.value)
                }"(ignored)`;
              console.log(message);  // eslint-disable-line no-console
            }  // eslint-disable-line comma-dangle
        );
      }
    }

    return {
      queryTerms: parsedQueryTerms,
      dateRange: parsedDateRange,
      invalidTerms,
      extraContext,
    };
  },

  generateQuerystring() {
    const terms = this.radio.reqres.request(
      'getState',
      this.stateKey,
      'queryTerms'  // eslint-disable-line comma-dangle
    );

    const dateRange = this.radio.reqres.request(
      'getState',
      this.stateKey,
      'dateRange'  // eslint-disable-line comma-dangle
    );
    let fullQuerystring = terms.filter(
      termValue => !_.contains(
        _.pluck(this.extraQueryTerms, 'urlSlug'),
        termValue.get('type')  // eslint-disable-line comma-dangle
      )  // eslint-disable-line comma-dangle
    ).map((term) => {
      const termType = encodeURIComponent(term.get('type'));
      const termValue = encodeURIComponent(term.get('value')
                          .replace('&', '+'));
      return `${termType}=${termValue}`;
    }).reduce((memo, queryComponent, index) => {
      let newAddition = (index !== 0) ? '&' : '';
      newAddition += queryComponent;
      return memo + newAddition;
    }, '');

    if (!_.isEmpty(dateRange)) {
      if (fullQuerystring !== '') {
        fullQuerystring += '&';
      }

      fullQuerystring += _.chain(dateRange)
          .map(
              (value, key) => deline`
                  ${
                    encodeURIComponent(key)
                  }Date=${
                    encodeURIComponent(value)
                  }`  // eslint-disable-line comma-dangle
          )
          .reduce(
              (memo, queryComponent, index) => {
                let dateAddition = (index !== 0) ? '&' : '';

                dateAddition += queryComponent;

                return memo + dateAddition;
              },
              ''  // eslint-disable-line comma-dangle
          )
          .value();
    }

    if (!_.isUndefined(this.extendGenerateQuerystring)) {
      return this.extendGenerateQuerystring(fullQuerystring);
    }

    return fullQuerystring;
  },

  updateQuerystring() {
    // Generate a querystring based on the current terms selected.
    const querystring = this.generateQuerystring();
    let newURL = this.urlBase + querystring;

    if (querystring !== '') {
      newURL += '/';
    }

    // Navigate to that querystring.
    this.radio.commands.execute('navigate', newURL, { trigger: false });
  },

  renderFilters() {
    // Create DOM elements for all unrendered filter objects, then
    // attach them.
    _.each(
        this.filters,
        (filterObj, filterName) => {
          const filterEl = jQuery(
            // eslint-disable-next-line comma-dangle
            `<div id="${this.filterIDs[filterName]}"></div>`
          ).appendTo(this.ui.filterHolder);

          filterObj.setElement(filterEl[0]);
        }  // eslint-disable-line comma-dangle
    );

    // Render all filters.
    // eslint-disable-next-line newline-per-chained-call,max-len
    _.chain(this.filters).values().invoke('render').value();

    // if (!this.filtersRendered) {
        // Set this flag to true, so this step is only called once.
        // this.filtersRendered = true;
    // }
  },

  renderFacetedLists() {
    // Create each faceted list.
    this.facetedCollectionViews = this.generateFacetedCollections();

    // Render each of the faceted collections.
    _.invoke(this.facetedCollectionViews, 'render');
  },

  updatePackages() {
    // Configure poller with fetch options.
    // This includes all querystring arguments (the `data` option sent
    // to `sync()`).
    this.poller.requestConfig = this.generateCollectionFetchOptions();

    // Retrieve collection from the server.
    this.poller.get(this.polledData, this.poller.requestConfig);
  },

  onCollectionSync() {
    // When collection is synced with the server get all related items,
    // render child views and restart poller.
    const wasAttached = this.isAttached;

    if (this.rerenderFacetedLists === true) {
      this.renderFacetedLists();
      this.rerenderFacetedLists = false;
    }

    this.poller.pause({ muteConsole: true });

    // If this view is not yet attached, finalize that process.
    if (!this.isAttached) {
      this.options.initFinishedCallback(this);
    }

    const primaryIDs = _.flatten(
      this.collection.map(pkg => _.chain([
        pkg.get('primaryContent'),
        // pkg.get('additionalContent'),
      ]).flatten().clone().value())  // eslint-disable-line comma-dangle
    );

    const additionalIDs = _.flatten(
      this.collection.map(pkg => _.chain([
        // pkg.get('primaryContent'),
        pkg.get('additionalContent'),
      ]).flatten().clone().value())  // eslint-disable-line comma-dangle
    );

    if (this.collection.length > 0) {
      const primariesQuery = jQuery.getJSON({
        url: this.collection.at(0).additionalContentCollection.url(),
        data: { id__in: primaryIDs.join(',') },
        type: 'GET',
        xhrFields: {
          withCredentials: true,
        },
        beforeSend: (xhr) => {
          xhr.withCredentials = true;  // eslint-disable-line no-param-reassign
        },
      });

      primariesQuery.done((data) => {
        this.collection.each((pkg) => {
          const primaryDetails = _.findWhere(data.results, {
            id: pkg.get('primaryContent'),
          });

          if (typeof primaryDetails !== 'undefined') {
            pkg.primaryContentItem.set(primaryDetails);

            pkg.trigger('change', pkg, {});
            pkg.bindPrimaryItem();
          } else {
            /* eslint-disable no-console */
            console.error(
              `ERROR: Primary item with PK '${pkg.get('primaryContent')}' was ` +
              'requested by view, but wasn\'t found.'  // eslint-disable-line comma-dangle
            );
            /* eslint-enable no-console */
          }
        });

        let additionalsQuery;

        if (additionalIDs.length > 0) {
          additionalsQuery = jQuery.getJSON({
            url: this.collection.at(0).additionalContentCollection.url(),
            data: { id__in: additionalIDs.join(',') },
            type: 'GET',
            xhrFields: {
              withCredentials: true,
            },
            beforeSend: (xhr) => {
              xhr.withCredentials = true;  // eslint-disable-line no-param-reassign
            },
          });
        } else {
          additionalsQuery = new jQuery.Deferred();
          additionalsQuery.resolve({ additionalData: [] });
        }

        additionalsQuery.done((additionalData) => {
          this.collection.each((pkg) => {
            const additionalDetails = _.filter(
              additionalData.results,
              // eslint-disable-next-line comma-dangle
              i => _.contains(pkg.get('additionalContent'), i.id)
            );
            pkg.additionalContentCollection.reset(additionalDetails);
            pkg.trigger('change', pkg, {});
          });

          this.poller.resume({ muteConsole: false });
          // this.poller.resume({ muteConsole: true });

          if (wasAttached) {
            this.trigger('dataUpdated');
          }
        });

        additionalsQuery.fail((resp, textStatus, errorThrown) => {
          /* eslint-disable no-console */
          console.error('Failed to load additional content items.');
          console.log(`--- Response: ${resp}`);
          console.log(`--- Text status: ${textStatus}`);
          console.log(`--- Error thrown: ${errorThrown}`);
          /* eslint-enable no-console */
        });
      });
      primariesQuery.fail((resp, textStatus, errorThrown) => {
        /* eslint-disable no-console */
        console.error('Failed to load budgeted items.');
        console.log(`--- Response: ${resp}`);
        console.log(`--- Text status: ${textStatus}`);
        console.log(`--- Error thrown: ${errorThrown}`);
        /* eslint-enable no-console */
      });
    }
  },

  onChildRender(childView) {
    if ((!childView.model.isNew()) && (!childView.model.primaryContentItem.isNew())) {
      if (!childView.hasPrimary) {
        childView.hasPrimary = true;  // eslint-disable-line no-param-reassign

        if (!childView.$el.find('.package-sheet').hasClass('has-primary')) {
          setTimeout(() => {
            childView.$el.find('.package-sheet').addClass('has-primary');
          }, 100);
        }
      }
    }

    childView.model.trigger('setPrimary', childView.model, {});
  },

  onDataUpdated() {},

  attachBuffer(collectionView, buffer) {
    this.ui.collectionHolder.append(buffer);
  },

  _insertBefore(childView, index) {
    let currentView;

    if (this.getOption('sort') && (index < this.children.length - 1)) {
      // Find the view after this one
      // eslint-disable-next-line no-underscore-dangle
      currentView = this.children.find(view => view._index === index + 1);
    }

    if (currentView) {
      currentView.$el.before(childView.el);
      return true;
    }

    return false;
  },

  // Internal method. Append a view to the end of the $el
  _insertAfter(childView) {
    this.ui.collectionHolder.append(childView.el);
  },

  onAttach() {
    this.renderFacetedLists();
  },

  onRender() {
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

  onBeforeDestroy() {
    this.poller.destroy();
  },
});
