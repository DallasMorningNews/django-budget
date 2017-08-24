import 'selectize';
import Backbone from 'backbone';
import Mn from 'backbone.marionette';

export default Mn.ItemView.extend({
  template: 'budget/navigation-user-info',

  initialize() {
    this.radio = Backbone.Wreqr.radio.channel('global');
  },

  onRender() {
    this.setElement(this.el.innerHTML);
  },

  serializeData() {
    return {
      currentUser: this.options.currentUser,
      links: this.radio.reqres.request('getSetting', 'navigationLinks'),
    };
  },
});
