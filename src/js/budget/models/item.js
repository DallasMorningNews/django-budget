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
            urlRoot: settings.apiEndpoints.GET.item,

            url: function() {
                return this.urlRoot + this.id + (settings.apiPostfix || '/');
            },
        });
    }
);
