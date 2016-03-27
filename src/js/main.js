require(['misc/app'], function(App) {
    'use strict';

    var $ = require('jquery');
    // var foundation = require('foundation-core');

    // Start the app
    window.app = new App({
        currentUser: window.currentUser
    });
    app.bootstrapData().done(app.start.bind(app));

    $(document).foundation();
});