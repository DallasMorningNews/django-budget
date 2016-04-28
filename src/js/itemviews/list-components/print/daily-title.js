define([
    'marionette',
    'underscore',
    'misc/tpl'
], function(
    Mn,
    _,
    tpl
) {
    return Mn.ItemView.extend({
        template: tpl('list-components-print-daily-title'),
    });
});
