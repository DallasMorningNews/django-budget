import _ from 'underscore';
import jQuery from 'jquery';
import Mn from 'backbone.marionette';
import 'selectize';

export default Mn.ItemView.extend({
  template: 'budget/modal-base',

  serializeData() {
    return this.modalConfig;
  },

  ui: {
    // searchBox: '#package-search-box'
    modalInner: '.modal-inner',
    button: '.button-holder .material-button',
  },

  events: {
    'mousedown @ui.button': 'addButtonClickedClass',
    'click @ui.button': 'onButtonClick',
  },

  initialize(options) {
    if (_.has(options, 'model')) {
      this.model = this.options.model;
    }

    if (_.has(options, 'view')) {
      this.view = this.options.view;
      this.modalConfig = this.view.getConfig();
    } else if (_.has(options, 'modalConfig')) {
      this.modalConfig = this.options.modalConfig;
    }
  },

  addButtonClickedClass(event) {
    const thisEl = jQuery(event.currentTarget);

    thisEl.addClass('hover').addClass('active-state');
    thisEl.removeClass('click-init');

    setTimeout(() => {
      thisEl.removeClass('hover').removeClass('active-state');
    }, 1000);

    setTimeout(() => {
      thisEl.addClass('click-init');
    }, 2000);
  },

  onButtonClick(event) {
    const thisEl = jQuery(event.currentTarget);

    const modalConfig = _.findWhere(
      this.modalConfig.buttons,
      { buttonID: thisEl.attr('id') }  // eslint-disable-line comma-dangle
    );

    modalConfig.clickCallback(this);
  },

  onRender() {
    if (_.has(this, 'view')) {
      this.view.setElement(this.ui.modalInner);
      this.stickit(null, this.view.getBindings());
      this.view.bindUIElements();
    }

    if (_.has(this.options, 'renderCallback')) {
      this.options.renderCallback(this);
    }
  },
});
