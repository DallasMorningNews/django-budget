define([
    'backbone',
    'jquery',
    'marionette',
    'selectize',
    'underscore',
    'common/settings',
    'common/tpl',
], function(
    Backbone,
    $,
    Mn,
    selectize,
    _,
    settings,
    tpl
) {
    return Mn.ItemView.extend({
        template: tpl('list-components-print-placement-toggle'),

        ui: {
            toggleTrigger: '.toggle-holder .placement-toggle .toggle',
            dropdownHolder: '.toggle-holder .placement-dropdown',
        },

        events: {
            'click @ui.toggleTrigger': 'runToggle',
        },

        initialize: function() {
            this._radio = Backbone.Wreqr.radio.channel('global');
        },

        serializeData: function() {
            var allTypesTrigger = {
                    slug: 'all',
                    verboseName: 'All',
                },
                commonPrintPlacement = this._radio.reqres.request(
                    'getState',
                    this.options.stateKey,
                    'currentPrintPlacement'
                ),
                placementTypes;

            if (commonPrintPlacement === 'all') {
                allTypesTrigger.isActive = true;
            }

            placementTypes = _.map(
                settings.printPlacementTypes,
                function(placementType) {
                    var typeConfig = _.chain(placementType)
                                                .omit('order')
                                                .clone()
                                                .value();

                    if (placementType.slug === commonPrintPlacement) {
                        typeConfig.isActive = true;
                    }

                    return typeConfig;
                }.bind(this)  // eslint-disable-line no-extra-bind
            );

            placementTypes.push(allTypesTrigger);

            return {
                placementTypes: placementTypes,
            };
        },

        onRender: function() {
            var dropdownOpts = _.map(settings.printPlacementTypes, _.clone);

            dropdownOpts.push({
                verboseName: 'All',
                slug: 'all',
                order: settings.printPlacementTypes.length + 1,
            });

            this.ui.dropdownHolder.selectize({
                selectOnTab: true,
                closeAfterSelect: true,
                options: dropdownOpts,
                valueField: 'slug',
                labelField: 'verboseName',
                searchField: ['verboseName'],
                maxItems: 1,
                onItemAdd: function(value, $item) {  // eslint-disable-line no-unused-vars
                    this.toggleActivePlacement(value);

                    // Set toggle device active state accordingly.
                    this.ui.toggleTrigger.removeClass('active');
                    this.ui.toggleTrigger.filter(
                        "[data-placement-type='" + value + "']"
                    ).addClass('active');
                }.bind(this),
                onItemRemove: function(value) {  // eslint-disable-line no-unused-vars
                    this.toggleActivePlacement('all');

                    // Set toggle device active state accordingly.
                    this.ui.toggleTrigger.removeClass('active');
                    this.ui.toggleTrigger.filter(
                        "[data-placement-type='all']"
                    ).addClass('active');
                }.bind(this),
            });

            this.updateDropdown(
                this.ui.toggleTrigger.filter('.active').data('placementType')
            );
        },

        updateDropdown: function(newValue) {
            var selectizeObj = this.ui.dropdownHolder[0].selectize;

            selectizeObj.off('item_add');

            selectizeObj.addItem(newValue, true);

            selectizeObj.on('item_add', selectizeObj.settings.onItemAdd);
        },

        runToggle: function(event) {
            var targetEl = $(event.currentTarget),
                newPlacementSlug = targetEl.data('placementType');

            this.ui.toggleTrigger.removeClass('active');
            targetEl.addClass('active');

            this.toggleActivePlacement(newPlacementSlug);

            // Set dropdown device active state accordingly.
            this.updateDropdown(newPlacementSlug);
        },

        toggleActivePlacement: function(newPlacement) {
            var commonPrintPlacement = this._radio.reqres.request(
                    'getState',
                    this.options.stateKey,
                    'currentPrintPlacement'
                );

            if (newPlacement !== commonPrintPlacement) {
                // Update internal state to reflect new placement choice.
                this._radio.commands.execute(
                    'setState',
                    this.options.stateKey,
                    'currentPrintPlacement',
                    newPlacement
                );

                // Remove current placement filter from query term
                // collection, if one exists.
                this._radio.commands.execute(
                    'setState',
                    this.options.stateKey,
                    'queryTerms',
                    function(terms) {
                        terms.remove(
                            terms.where({type: 'printPlacement'})
                        );
                    }.bind(this)  // eslint-disable-line no-extra-bind
                );

                if (newPlacement !== 'all') {
                    // Add new placement filter to query term collection.
                    // Handler for adding a query term.
                    this._radio.commands.execute(
                        'setState',
                        this.options.stateKey,
                        'queryTerms',
                        function(terms) {
                            terms.push({
                                type: 'printPlacement',
                                value: newPlacement,
                            });
                        }.bind(this)  // eslint-disable-line no-extra-bind
                    );
                }
            }

            this._radio.commands.execute('updateQueryElements');
        },
    });
});
