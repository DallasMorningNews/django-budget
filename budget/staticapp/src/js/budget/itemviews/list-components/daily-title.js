import Backbone from 'backbone';
import Mn from 'backbone.marionette';

export default Mn.ItemView.extend({
  template: 'budget/list-components-print-daily-title',

  initialize() {
    this.radio = Backbone.Wreqr.radio.channel('global');
  },

  serializeData() {
    const brandingOpts = this.radio.reqres.request('getSetting', 'branding');

    return {
      printLogoURL: brandingOpts.printLogoURL,
    };
  },
});
