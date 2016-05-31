define([
    'backbone',
    'marionette',
    'common/tpl',
], function(
    Backbone,
    Mn,
    tpl
) {
    return Mn.ItemView.extend({
        template: tpl('navigation-logo'),

        onRender: function() {
            this.setElement(this.el.innerHTML);
        }
    });
});