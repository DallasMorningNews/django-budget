define([
    'backbone',
    'marionette',
    'misc/tpl',
    'layoutviews/navbar'
], function(
    Backbone,
    Mn,
    tpl,
    NavbarView
) {
    return Mn.LayoutView.extend({
        el: 'body',
        template: tpl('root-view'),
        regions: {
            navbar: '#navigation',
            mainContent: '#main-content',
            modalHolder: '#modal-holder',
            snackbarHolder: '#snackbar-holder',
        },

        initialize: function() {
            var _radio = Backbone.Wreqr.radio.channel('global');

            this.navbarView = new NavbarView({
                currentUser: this.options.currentUser
            });

            _radio.commands.setHandler('switchMainView', function(MainViewClass) {
                this.mainView = new MainViewClass({
                    data: this.options.data,
                    state: this.options.state,
                });

                this.showChildView('mainContent', this.mainView);
            }, this);

            _radio.commands.setHandler('showModal', function(modalView) {
                this.showChildView('modalHolder', modalView);

                this.modal = new Foundation.Reveal(modalView.$el.parent());

                this.modal.open();
            }, this);

            _radio.commands.setHandler('showSnackbar', function(snackbarView) {
                this.snackbarView = snackbarView;

                this.showChildView('snackbarHolder', this.snackbarView);
            }, this);

            _radio.commands.setHandler('destroyModal', function() {
                // delete(this.modal);
            }, this);

            _radio.commands.setHandler('clearRegion', function(regionSlug) {
                app.rootView[regionSlug].reset();
            });
        },

        onRender: function() {
            this.showChildView('navbar', this.navbarView);
        }
    });
});