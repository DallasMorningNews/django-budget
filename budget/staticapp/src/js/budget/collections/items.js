import Backbone from 'backbone';

import BudgetItem from '../models/item';

export default Backbone.Collection.extend({
  // A boolean to track whether we've populated our collection with
  // search options for the first time
  model: BudgetItem,

  initialize() {
    this.radio = Backbone.Wreqr.radio.channel('global');
  },

  // url: settings.apiEndpoints.item,
  url() {
    return this.radio.reqres.request('getSetting', 'apiEndpoints').item;
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

  parse(response) {
    return response.results;
  },
});
