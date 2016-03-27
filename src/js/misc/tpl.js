define(['templates', 'nunjucks'], function() {

    'use strict';

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
            return nunjucks.render(name, context);
        };
    };

});