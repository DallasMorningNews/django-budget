import Backbone from 'backbone';

import CSRFAwareModel from '../../common/csrf-aware-model';

export default CSRFAwareModel.extend({
  urlRoot() {
    return this.radio.reqres.request('getSetting', 'apiEndpoints').contentPlacement;
  },

  url() {
    const apiPostfix = this.radio.reqres.request('getSetting', 'apiPostfix');

    if (this.isNew()) return this.urlRoot();

    return this.urlRoot() + this.id + (apiPostfix || '/');
  },

  initialize() {
    this.radio = Backbone.Wreqr.radio.channel('global');
  },

  defaults: {
    placementTypes: [],
    placementDetails: '',
    externalSlug: '',
    isFinalized: false,
  },
});
