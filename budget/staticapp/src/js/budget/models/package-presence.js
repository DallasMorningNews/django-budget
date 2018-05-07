import Backbone from 'backbone';
import jQuery from 'jquery';


import CSRFAwareModel from '../../common/csrf-aware-model';


export default CSRFAwareModel.extend({
  initialize(opts) {
    this.radio = Backbone.Wreqr.radio.channel('global');

    this.pingURL = opts.pingURL;
    this.exitURL = opts.exitURL;
    this.pageLoadID = opts.pageLoadID;
  },

  urlRoot() {
    return this.radio.reqres.request('getSetting', 'apiBases').budget;
  },

  url() {
    if (this.has('pingURL')) {
      return `${this.urlRoot()}${this.pingURL}`;
    }

    return this.urlRoot();
  },

  exitPackage() {
    if (this.has('exitURL')) {
      return jQuery.getJSON({
        url: `${this.urlRoot()}${this.exitURL}`,
        data: { pageload: this.pageLoadID },
        type: 'GET',
        xhrFields: { withCredentials: true },
        // eslint-disable-next-line no-param-reassign
        beforeSend: (xhr) => { xhr.withCredentials = true; },
      });

      // exitPackage.done((data) => {
      //   if (data.status === 204) {
      //     // eslint-disable-next-line no-console
      //     console.log(`[USER PRESENCE] ${data.message}`);
      //     callbackFn();
      //   }
      // });
      // exitPackage.fail((resp, textStatus, errorThrown) => {
      //   /* eslint-disable no-console */
      //   console.error('Failed to clear user-presence marker.');
      //   console.log(`--- Response: ${resp}`);
      //   console.log(`--- Text status: ${textStatus}`);
      //   console.log(`--- Error thrown: ${errorThrown}`);
      //   /* eslint-enable no-console */
      // });
    }

    return '';
  },
});
