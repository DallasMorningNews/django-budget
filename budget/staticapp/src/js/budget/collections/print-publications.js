import Backbone from 'backbone';

import PrintPublication from '../models/print-publication';

export default Backbone.Collection.extend({
  // A boolean to track whether we've populated our collection with
  // search options for the first time
  model: PrintPublication,

  initialize() {
    this.radio = Backbone.Wreqr.radio.channel('global');
  },

  events: {},

  comparator: 'priority',

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
    // return settings.apiEndpoints.printPublication;
    return this.radio.reqres.request('getSetting', 'apiEndpoints').printPublication;
  },

  parse(response) {
    return response.results;
  },
});
