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

export default Mn.CompositeView.extend({
  id: 'find-item-wrapper',

  template: 'budget/find-item',

  regions: {},

  isAttached: false,

  filtersRendered: false,

  events: {
    // 'all': 'logEvents',
    dataUpdated: 'onDataUpdated',
    attach: 'onAttach',
  },

  onAttach() {
    jQuery('.btn')
        .each((i, el) => { ripple.Ripple.attachTo(jQuery('.btn')[i]); });
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

    console.log('AAA 2');
    window.aaa = this;

    if (!this.isAttached) {
      this.options.initFinishedCallback(this);
    }
  },

  onCollectionSync() {
    console.log('OCS');
    const wasAttached = this.isAttached;

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
