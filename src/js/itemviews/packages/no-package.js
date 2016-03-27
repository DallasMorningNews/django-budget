define(
    [
        'marionette',
        'misc/tpl'
    ],
    function(
        Mn,
        tpl
    ) {
        'use strict';

        return Mn.ItemView.extend({
            template: tpl('package-empty'),
            className: 'package-empty-view',
        });
    }
);