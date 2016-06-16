require(
    [
        'jquery',
        'budget/misc/app',
    ],
    function(
        $,
        App
    ) {
        'use strict';

        $(document).ready(function() {
            // Initialize the app.
            var budgetApp = new App();

            // Load underlying data (including the user config), then start
            // the app.
            budgetApp.bootstrapData().done(
                budgetApp.start.bind(budgetApp)
            );

            window.app = budgetApp;

            $(document).foundation();
        });
    }
);
