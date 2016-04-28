define([
    'marionette',
    'underscore',
    'misc/settings',
    'misc/tpl'
], function(
    Mn,
    _,
    settings,
    tpl
) {
    return Mn.ItemView.extend({
        template: tpl('list-components-print-placement-toggle'),

        initialize: function() {
            this._radio = Backbone.Wreqr.radio.channel('global');
        },

        serializeData: function() {
            var allTypesTrigger = {
                    slug: 'all',
                    verboseName: 'All'
                },
                commonCurrentPlacement = this._radio.reqres.request(
                    'getState',
                    this.options.stateKey,
                    'currentPrintPlacement'
                ),
                placementTypes;

            if (commonCurrentPlacement == 'all') {
                allTypesTrigger.isActive = true;
            }

            placementTypes = _.map(
                settings.printPlacementTypes,
                function(placementType) {
                    var typeConfig = _.clone(placementType);

                    if (placementType.slug == commonCurrentPlacement) {
                        typeConfig.isActive = true;
                    }

                    return typeConfig;
                }.bind(this)
            );

            placementTypes.push(allTypesTrigger);

            window.fff = placementTypes;

            return {
                placementTypes: placementTypes
            };
        }
    });
});
