define([
    'backbone',
    'marionette',
    'misc/tpl',
], function(
    Backbone,
    Mn,
    tpl
) {
    return Mn.ItemView.extend({
        template: tpl('navigation-user-info'),

        onRender: function() {
            this.setElement(this.el.innerHTML);
        },

        serializeData: function() {
            return {
                currentUser: this.options.currentUser
            };
        }
    });
});