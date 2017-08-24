import Backbone from 'backbone';

export default Backbone.Model.extend({
  // urlRoot: settings.apiEndpoints.headlineCandidate,
  urlRoot() {
    return this.radio.reqres.request('getSetting', 'apiEndpoints').headlineCandidate;
  },

  url() {
    const apiPostfix = this.radio.reqres.request('getSetting', 'apiPostfix');
    return this.urlRoot + this.id + (apiPostfix || '/');
  },

  initialize() {
    this.radio = Backbone.Wreqr.radio.channel('global');
  },

  defaults: {
    text: '',
    winner: false,
  },
});
