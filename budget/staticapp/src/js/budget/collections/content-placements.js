import Backbone from 'backbone';

import ContentPlacement from '../models/content-placement';

export default Backbone.Collection.extend({
  // A boolean to track whether we've populated our collection with
  // search options for the first time
  model: ContentPlacement,

  initialize() {
    this.radio = Backbone.Wreqr.radio.channel('global');
  },

  url() {
    return this.radio.reqres.request('getSetting', 'apiEndpoints').contentPlacement;
  },

  events: {},

  comparator: 'id',

  parse(response) {
    return response.results;
  },
});
