define([
    'jquery',
    'marionette',
    'underscore',
    'misc/settings',
    'misc/tpl'
], function(
    $,
    Mn,
    _,
    settings,
    tpl
) {
    return Mn.ItemView.extend({
        template: tpl('list-components-print-placement-toggle'),

        ui: {
            toggleTrigger: '.toggle-holder .placement-toggle .toggle',
        },

        events: {
            'click @ui.toggleTrigger': 'toggleActivePlacement',
        },

        initialize: function() {
            this._radio = Backbone.Wreqr.radio.channel('global');
        },

        serializeData: function() {
            var allTypesTrigger = {
                    slug: 'all',
                    verboseName: 'All'
                },
                commonPrintPlacement = this._radio.reqres.request(
                    'getState',
                    this.options.stateKey,
                    'currentPrintPlacement'
                ),
                placementTypes;

            if (commonPrintPlacement == 'all') {
                allTypesTrigger.isActive = true;
            }

            placementTypes = _.map(
                settings.printPlacementTypes,
                function(placementType) {
                    var typeConfig = _.chain(placementType)
                                                .omit('order')
                                                .clone()
                                                .value();

                    if (placementType.slug == commonPrintPlacement) {
                        typeConfig.isActive = true;
                    }

                    return typeConfig;
                }.bind(this)
            );

            placementTypes.push(allTypesTrigger);

            return {
                placementTypes: placementTypes
            };
        },

        toggleActivePlacement: function(event) {
            var targetEl = $(event.currentTarget),
                newPlacementSlug = targetEl.data('placementType'),
                commonPrintPlacement = this._radio.reqres.request(
                    'getState',
                    this.options.stateKey,
                    'currentPrintPlacement'
                );

            this.ui.toggleTrigger.removeClass('active');
            targetEl.addClass('active');

            if (newPlacementSlug != commonPrintPlacement) {
                // Update internal state to reflect new placement choice.
                this._radio.commands.execute(
                    'setState',
                    this.options.stateKey,
                    'currentPrintPlacement',
                    newPlacementSlug
                );

                // Remove current placement filter from query term
                // collection, if one exists.
                this._radio.commands.execute(
                    'setState',
                    this.options.stateKey,
                    'queryTerms',
                    function(terms) {
                        terms.remove(
                            terms.where({
                                type: 'printPlacement'
                            })
                        );
                    }.bind(this)
                );

                if (newPlacementSlug != 'all') {
                    // Add new placement filter to query term collection.
                    // Handler for adding a query term.
                    this._radio.commands.execute(
                        'setState',
                        this.options.stateKey,
                        'queryTerms',
                        function(terms) {
                            terms.push({
                                type: 'printPlacement',
                                value: newPlacementSlug
                            });
                        }.bind(this)
                    );
                }
            }

            this._radio.commands.execute('updateQueryElements');
        },
    });
});
