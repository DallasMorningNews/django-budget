define(function() {
    'use strict';

    return {
        autoClose: true,
        customCloseAnimation: function(cb) {
            $(this).fadeOut(150, cb);
        },
        customOpenAnimation: function(cb) {
            $(this).fadeIn(150, cb);
        },
        customTopBar: ' ',
        format: 'MMM D, YYYY',
        separator: ' to ',
        showShortcuts: false,
        singleMonth: true,
        startOfWeek: 'monday'
    };
});