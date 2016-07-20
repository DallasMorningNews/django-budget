define([
    'backbone',
    'marionette',
    'common/settings',
    'common/tpl',
], function(
    Backbone,
    Mn,
    settings,
    tpl
) {
    return Mn.ItemView.extend({
        template: tpl('navigation-user-info'),

        onRender: function() {
            this.setElement(this.el.innerHTML);
        },

        serializeData: function() {
            return {
                currentUser: this.options.currentUser,
                links: settings.navigationLinks,
            };
        },
    });
});
