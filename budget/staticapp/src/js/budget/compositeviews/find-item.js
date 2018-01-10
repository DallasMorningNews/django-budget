import Backbone from 'backbone';
import jQuery from 'jquery';
import Mn from 'backbone.marionette';
import { ripple } from 'immaterial-ui';
// import _ from 'underscore';

// import deline from '../../../vendored/deline';

import Poller from '../../common/poller';

import PackageCollection from '../collections/packages';
// import QueryTermCollection from '../../collections/query-terms';
// import NoPackagesView from '../../itemviews/packages/no-package';
import urlConfig from '../misc/urls';


export default Mn.CompositeView.extend({
  id: 'find-item-wrapper',

  template: 'budget/find-item',

  urlBase: urlConfig.findItem.reversePattern,

  regions: {},

  isAttached: false,

  filtersRendered: false,

  events: {
    'click @ui.clearSearchTrigger': 'clearSearch',
    'submit @ui.searchForm': 'handleFormSubmit',
    // 'all': 'logEvents',
    // dataUpdated: 'onDataUpdated',
    attach: 'onAttach',
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
    searchForm: '#search-form',
    searchHolder: '#search-box',
    searchBoxEl: '#search-box #find-item-search-box',
    clearSearchTrigger: '#search-box .clear-trigger',
    searchResultsHolder: '#search-results',
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
    // return NoPackagesView;
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

    this.queryTerm = this.options.boundData.term;

    console.log('AAA 6');
    window.aaa = this;

    if (!this.isAttached) {
      this.options.initFinishedCallback(this);
    }
  },

  serializeData() {
    const context = {};

    context.initialIsBlank = (this.queryTerm === null);

    return context;
  },

  onAttach() {
    // Conditionally apply styling based on whether a term is currently being searched.
    if (this.queryTerm === null) {
      setTimeout(() => {
        this.ui.searchHolder.removeClass('hidden');
        this.ui.searchBoxEl.focus();
      }, 300);
    } else {
      this.ui.searchHolder.addClass('filled');
      this.ui.searchBoxEl.val(this.queryTerm);

      this.ui.searchResultsHolder.addClass('loading');

      // TODO(ajv): Call loading logic here.
    }

    // Then enable button ripples.
    jQuery('.btn')
        .each((i) => { ripple.Ripple.attachTo(jQuery('.btn')[i]); });
  },

  handleFormSubmit(event) {
    event.preventDefault();

    if (!this.ui.searchHolder.hasClass('filled')) {
      this.ui.searchHolder.addClass('filled');
    }

    const newURL = `${this.urlBase}${this.ui.searchForm.serialize()}/`;

    this.radio.commands.execute('navigate', newURL, { trigger: false });

    this.ui.searchResultsHolder.addClass('loading');

    // TODO(ajv): Call loading logic here.
  },

  clearSearch() {
    this.queryTerm = '';
    this.ui.searchBoxEl.val('');

    if (this.ui.searchHolder.hasClass('filled')) {
      this.ui.searchHolder.removeClass('filled').show();
    }

    this.radio.commands.execute('navigate', this.urlBase, { trigger: false });

    this.ui.searchResultsHolder.removeClass('loading');
    this.ui.searchResultsHolder.removeClass('has-results');

    // TODO(ajv): Collection-dumping logic should go here.
  },

  runQuery() {
    // TODO(ajv): Actual API query logic should go here.
  },

  onCollectionSync() {
    // console.log('OCS');
    // const wasAttached = this.isAttached;

    // if (this.rerenderFacetedLists === true) {
    //   this.renderFacetedLists();
    //   this.rerenderFacetedLists = false;
    // }
    //
    // this.poller.pause({ muteConsole: true });

    // If this view is not yet attached, finalize that process.
    // if (!this.isAttached) {
    //   this.options.initFinishedCallback(this);
    // }
  },
});
