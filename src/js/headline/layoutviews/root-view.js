define([
    'backbone',
    'marionette',
    'underscore',
    'underscore.string',
    'common/tpl',
], function(
    Backbone,
    Mn,
    _,
    _string_,
    tpl
) {
    return Mn.LayoutView.extend({
        el: 'body',
        template: tpl('headline-root-view'),
        regions: {
            header: '#header',
            mainContent: '#main-content',
            snackbarHolder: '#snackbar-holder',
        },

        ui: {
            modalHolder: '#modal-holder',
        },

        initialize: function() {
            this._radio = Backbone.Wreqr.radio.channel('global');
        },
    });
});
