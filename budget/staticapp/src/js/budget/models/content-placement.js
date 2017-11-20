import _ from 'underscore';
import Backbone from 'backbone';
import jQuery from 'jquery';

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

  runValidation() {  // Originally named validate, which is a reserved name.
    const validationPromise = new jQuery.Deferred();

    const modelErrors = {};

    if (this.get('placementTypes').length === 0) {
      modelErrors.placementTypes = 'Please select at least one placement type.';
    }

    if (_.isEmpty(modelErrors)) {
      validationPromise.resolve();
    } else {
      validationPromise.reject(modelErrors);
    }

    return validationPromise;
  },

  defaults: {
    placementTypes: [],
    placementDetails: '',
    externalSlug: '',
    isFinalized: false,
  },
});
