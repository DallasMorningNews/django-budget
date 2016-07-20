define(
    [
        'nunjucks',
        'templates',
    ],
    function() {
        'use strict';

        var env = new nunjucks.Environment(),  // eslint-disable-line no-undef
            stringFn = require('underscore.string');  // eslint-disable-line global-require,import/no-unresolved,max-len

        // Add 'numberWithCommas' filter.
        env.addFilter('numberWithCommas', function(rawNumber) {
            return stringFn.numberFormat(rawNumber);
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
