import _ from 'underscore';
import Backbone from 'backbone';
import Mn from 'backbone.marionette';

export default Mn.ItemView.extend({
  template: 'budget/navigation-logo',

  initialize() {
    this.radio = Backbone.Wreqr.radio.channel('global');
  },

  onRender() {
    this.setElement(this.el.innerHTML);
  },

  serializeData() {
    const brandingOpts = this.radio.reqres.request('getSetting', 'branding');

    const navLinks = this.radio.reqres.request('getSetting', 'navigationLinks');
    const homeView = _.findWhere(navLinks, { name: 'Home' });

    return {
      homeViewLink: homeView.destination,
      mastheadLogoAltText: brandingOpts.mastheadLogoAltText,
      mastheadLogoURL: brandingOpts.mastheadLogoURL,
      siteLogoAltText: brandingOpts.siteLogoAltText,
      siteLogoURL: brandingOpts.siteLogoURL,
    };
  },
});
