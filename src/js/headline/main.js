require(['headline/misc/app'], function(App) {
    'use strict';

    var $ = require('jquery');

    $(document).ready(function() {
        // Initialize the app.
        var headlinesApp = new App();

        // Load underlying data (including the user config), then start
        // the app.
        headlinesApp.bootstrapData().done(
            headlinesApp.start.bind(headlinesApp)
        );

        window.app = headlinesApp;
    });
});