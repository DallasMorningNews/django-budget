define(
    [
        'numeral',
        'nunjucks',
        'templates'
    ],
    function() {
        'use strict';

        var env = new nunjucks.Environment();

        // Add 'numberWithCommas' filter.
        env.addFilter('numberWithCommas', function(rawNumber) {
            return numeral(rawNumber).format('0,0');
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