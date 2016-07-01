define(
    [
        'backbone',
        'common/settings',
    ],
    function(
        Backbone,
        settings
    ) {
        'use strict';

        return Backbone.Model.extend({
            urlRoot: settings.apiEndpoints.item,

            url: function() {
                if (this.has('id')) {
                    return this.urlRoot + this.id + (settings.apiPostfix || '/');
                }

                return this.urlRoot;
            },

            defaults: {
                type: null,
                slugKey: '',
                authors: [],
                budgetLine: '',
            },
        });
    }
);
