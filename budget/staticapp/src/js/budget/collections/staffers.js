import Backbone from 'backbone';

import Staffer from '../models/staffer';

export default Backbone.Collection.extend({
  // A boolean to track whether we've populated our collection with
  // search options for the first time
  model: Staffer,

  initialize() {
    this.radio = Backbone.Wreqr.radio.channel('global');
  },

  events: {},

  /**
   * Sort the collection by pinned status first (pinned on top) then by
   * created timestamp in reverse chronological order
   */
  // comparator(model) {
  //     var optionTypeWeights = {
  //         'person': 2,
  //         'hub': 3,
  //         'vertical': 4
  //     };
  //     return optionTypeWeights[model.get('type')] + '_' + model.get('value');
  // },

  url() {
    // return settings.apiEndpoints.staffer;
    return this.radio.reqres.request('getSetting', 'apiEndpoints').staffer;
  },

  parse(response) {
    return response;
  },
});
