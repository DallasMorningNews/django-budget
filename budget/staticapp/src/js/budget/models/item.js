import Backbone from 'backbone';

export default Backbone.Model.extend({
  // urlRoot: settings.apiEndpoints.item,
  urlRoot() {
    return this.radio.reqres.request('getSetting', 'apiEndpoints').item;
  },

  url() {
    if (this.has('id')) {
      const apiPostfix = this.radio.reqres.request('getSetting', 'apiPostfix');
      return this.urlRoot + this.id + (apiPostfix || '/');
    }

    return this.urlRoot;
  },

  initialize() {
    this.radio = Backbone.Wreqr.radio.channel('global');
  },

  defaults: {
    type: null,
    slugKey: '',
    authors: [],
    budgetLine: '',
  },
});
