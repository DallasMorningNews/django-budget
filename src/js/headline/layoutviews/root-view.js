import Backbone from 'backbone';
import Mn from 'backbone.marionette';

export default Mn.LayoutView.extend({
    el: 'body',
    template: 'headlines/root-view',
    regions: {
        header: '#header',
        mainContent: '#main-content',
        snackbarHolder: '#snackbar-holder',
    },

    ui: {
        modalHolder: '#modal-holder',
    },

    initialize() {
        this.radio = Backbone.Wreqr.radio.channel('global');
    },
});
