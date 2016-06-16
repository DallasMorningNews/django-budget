define([
    'backbone',
    'marionette',
    'underscore',
    'vex',
    'common/tpl',
    'budget/layoutviews/navbar',
], function(
    Backbone,
    Mn,
    _,
    vex,
    tpl,
    NavbarView
) {
    return Mn.LayoutView.extend({
        el: 'body',
        template: tpl('root-view'),
        regions: {
            navbar: '#navigation',
            mainContent: '#main-content',
            snackbarHolder: '#snackbar-holder',
        },

        ui: {
            modalHolder: '#modal-holder',
        },

        initialize: function() {
            this._radio = Backbone.Wreqr.radio.channel('global');

            this.navbarView = new NavbarView({
                currentUser: this.options.currentUser,
            });

            this._radio.commands.setHandler('switchMainView', function(MainViewClass, boundData) {
                var classConstructor = {
                    currentUser: this.options.currentUser,
                    data: this.options.data,
                    state: this.options.state,
                    initFinishedCallback: function(childView) {
                        this.showChildView('mainContent', childView);
                    }.bind(this),
                };

                if (typeof(boundData) !== 'undefined') {
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

            this._radio.commands.setHandler('showModal', function(modalView) {
                var vexConfig,
                    viewConfig = modalView.options.modalConfig;

                vexConfig = {
                    appendLocation: this.ui.modalHolder,
                    className: 'vex-theme-plain vex-theme-stack-demo',
                    content: modalView.render().$el,
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

            this._radio.commands.setHandler('showSnackbar', function(snackbarView) {
                this.snackbarView = snackbarView;

                this.showChildView('snackbarHolder', this.snackbarView);
            }, this);

            this._radio.commands.setHandler('destroyModal', function() {
                vex.close(this.modal.data().vex.id);
            }, this);

            this._radio.commands.setHandler('clearRegion', function(regionSlug) {
                this[regionSlug].reset();
            }, this);
        },

        onRender: function() {
            this.showChildView('navbar', this.navbarView);
        },
    });
});
