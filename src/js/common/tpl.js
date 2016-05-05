define(
    [
        'nunjucks',
        'templates'
    ],
    function() {
        'use strict';

        var env = new nunjucks.Environment();

        var _string_ = require('underscore.string');

        // Add 'numberWithCommas' filter.
        env.addFilter('numberWithCommas', function(rawNumber) {
            return _string_.numberFormat(rawNumber);
        });

        /**
         * A helper to return Marionette-like template functions using pre-
         * rendered Nunjucks templates
         * @param string name - the name of the template (template.html would be
         *   template)
         * @return function - a template function that take the context and
         *   returns HTML like Marionette expects
         */
        return function(name) {
            return function(context) {
                return env.render(name, context);
            };
        };

    }
);