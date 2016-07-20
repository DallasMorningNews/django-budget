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
            urlRoot: settings.apiEndpoints.headlineCandidate,

            url: function() {
                return this.urlRoot + this.id + (settings.apiPostfix || '/');
            },

            defaults: {
                text: '',
                winner: false,
            },
        });
    }
);
