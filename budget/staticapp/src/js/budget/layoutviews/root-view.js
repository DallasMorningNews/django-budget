import _ from 'underscore';
import Backbone from 'backbone';
import Mn from 'backbone.marionette';
import vex from 'vex-scss';

import NavbarView from './navbar';

export default Mn.LayoutView.extend({
  el: 'body',
  template: 'budget/root-view',
  regions: {
    navbar: '#navigation',
    mainContent: '#main-content',
    snackbarHolder: '#snackbar-holder',
  },

  ui: {
    modalHolder: '#modal-holder',
  },

  initialize() {
    this.radio = Backbone.Wreqr.radio.channel('global');

    this.navbarView = new NavbarView({
      currentUser: this.options.currentUser,
    });

    this.radio.commands.setHandler('switchMainView', (MainViewClass, boundData) => {
      const classConstructor = {
        currentUser: this.options.currentUser,
        data: this.options.data,
        state: this.options.state,
        initFinishedCallback: (childView) => {
          childView.isAttached = true;  // eslint-disable-line no-param-reassign
          this.showChildView('mainContent', childView);
        },
      };

      if (typeof boundData !== 'undefined') {
        if (_.has(boundData, 'collection')) {
          classConstructor.collection = boundData.collection;
          delete boundData.collection;  // eslint-disable-line no-param-reassign
        }

        if (_.has(boundData, 'model')) {
          classConstructor.model = boundData.model;
          delete boundData.model;  // eslint-disable-line no-param-reassign
        }

        if (!_.isEmpty(boundData)) {
          classConstructor.boundData = boundData;
        }
      }

      this.mainView = new MainViewClass(classConstructor);
    }, this);

    this.radio.commands.setHandler('showModal', (modalView) => {
      const viewConfig = modalView.modalConfig;

      const vexConfig = {
        appendLocation: `#${this.ui.modalHolder.attr('id')}`,
        className: 'vex-theme-plain vex-theme-stack-demo',
        unsafeContent: modalView.render().$el[0],
        showCloseButton: false,
        escapeButtonCloses: true,
        overlayClosesOnClick: true,
      };

      if (
        !_.isUndefined(viewConfig.contentClassName) &&
        !_.isNull(viewConfig.contentClassName)
      ) {
        vexConfig.contentClassName = viewConfig.contentClassName;
      }

      if (
        (!_.isUndefined(viewConfig.escapeButtonCloses)) &&
        (!_.isNull(viewConfig.escapeButtonCloses)) &&
        (viewConfig.escapeButtonCloses === false)
      ) {
        vexConfig.escapeButtonCloses = false;
      }

      if (
        (!_.isUndefined(viewConfig.overlayClosesOnClick)) &&
        (!_.isNull(viewConfig.overlayClosesOnClick)) &&
        (viewConfig.overlayClosesOnClick === false)
      ) {
        vexConfig.overlayClosesOnClick = false;
      }

      if (
        (!_.isUndefined(viewConfig.showCloseButton)) &&
        (!_.isNull(viewConfig.showCloseButton)) &&
        (viewConfig.showCloseButton === true)
      ) {
        vexConfig.showCloseButton = true;
      }

      this.modal = vex.open(vexConfig);
    }, this);

    this.radio.commands.setHandler('showSnackbar', (snackbarView) => {
      this.snackbarView = snackbarView;

      this.showChildView('snackbarHolder', this.snackbarView);
    }, this);

    this.radio.commands.setHandler('destroyModal', () => {
      this.modal.close();
    }, this);

    this.radio.commands.setHandler('clearRegion', (regionSlug) => {
      this[regionSlug].reset();
    }, this);
  },

  onRender() {
    this.showChildView('navbar', this.navbarView);
  },
});
