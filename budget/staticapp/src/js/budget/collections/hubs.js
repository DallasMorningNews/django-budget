import Backbone from 'backbone';

import Hub from '../models/hub';

export default Backbone.Collection.extend({
  // A boolean to track whether we've populated our collection with
  // hubs for the first time
  model: Hub,

  initialize() {
    this.radio = Backbone.Wreqr.radio.channel('global');
  },

  events: {},

  /**
   * Sort the collection by pinned status first (pinned on top) then by
   * created timestamp in reverse chronological order
   */
  comparator(model) {
    return model.get('slug');
  },

  url() {
    // return settings.apiEndpoints.hub;
    return this.radio.reqres.request('getSetting', 'apiEndpoints').hub;
  },

  parse(response) {
    return response;
  },
});
