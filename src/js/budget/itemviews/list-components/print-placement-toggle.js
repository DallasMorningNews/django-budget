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
            searchBox: '#publication-search-box',
        },

        events: {
            'click @ui.toggleTrigger': 'runToggle',
        },

        initialize: function() {
            this._radio = Backbone.Wreqr.radio.channel('global');

            this.printPlacementChoices = this.enumeratePrintPlacementChoices();

            this.initialRender = false;

            this.noInitialPublication = _.isUndefined(
                this._radio.reqres.request(
                    'getState',
                    'printSearchList',
                    'queryTerms'
                ).findWhere({type: 'printPublication'})
            );
        },

        enumeratePrintPlacementChoices: function() {
            var sectionPublicationValues = [],
                publicationSections = [],
                placementChoices = _.compact(
                    this.options.data.printPublications.map(function(publication) {
                        if (publication.get('isActive') === true) {
                            // Generate a second map with this publications'
                            // section IDs and the publication's slug.
                            // This gets used on the selectize 'select' event.
                            sectionPublicationValues.push(
                                _.map(
                                    publication.get('sections'),
                                    function(section) {
                                        return [section.id, publication.get('slug')];
                                    }
                                )
                            );

                            publicationSections.push(
                                [
                                    publication.get('slug'),
                                    publication.get('sections'),
                                ]
                            );

                            return {
                                name: publication.get('name'),
                                value: publication.get('slug') + '.pub',
                            };
                        }

                        return null;
                    })
                );

            this.printPublicationSections = _.chain(publicationSections)
                    .compact()
                    .reject(function(mapping) { return _.isEmpty(mapping[1]); })
                    .object()
                    .value();

            this.sectionPublicationMap = _.chain(sectionPublicationValues)
                    .compact()
                    .reject(_.isEmpty)
                    .flatten(true)
                    .object()
                    .value();

            return placementChoices;
        },

        onRender: function() {
            var selectizeObj,
                commonPublication = this._radio.reqres.request(
                    'getState',
                    'printSearchList',
                    'queryTerms'
                ).findWhere({type: 'printPublication'});

            if (!this.initialRender) {
                if (this.noInitialPublication) {
                    this._radio.commands.execute(
                        'pushQueryTerm',
                        this.options.stateKey,
                        {
                            type: 'printPublication',
                            value: this.printPlacementChoices[0].value,
                        }
                    );

                    commonPublication = this._radio.reqres.request(
                        'getState',
                        'printSearchList',
                        'queryTerms'
                    ).findWhere({type: 'printPublication'});
                }

                this.initialRender = true;
            }

            this.selectizeBox = this.ui.searchBox.selectize({
                addPrecedence: false,
                closeAfterSelect: true,
                create: false,
                labelField: 'name',
                maxItems: 1,
                options: this.printPlacementChoices,
                persist: false,
                plugins: ['restore_on_backspace'],
                searchField: ['name'],
                selectOnTab: true,
                valueField: 'value',
                render: {
                    item: function(data, escape) {  // eslint-disable-line no-unused-vars
                        var dataType = 'fullText';
                        if (typeof(data.type) !== 'undefined') {
                            dataType = data.type;
                        }

                        return '<div data-value="' + data.value + '" data-type="' +
                                    dataType + '" class="item">' +
                                    data.name +
                                '</div>';
                    },
                },
                onItemAdd: function(value, $item) {},  // eslint-disable-line no-unused-vars
                onChange: function(value) {
                    var currentPublication = this._radio.reqres.request(
                            'getState',
                            'printSearchList',
                            'queryTerms'
                        ).findWhere({type: 'printPublication'});

                    if (!_.isUndefined(currentPublication)) {
                        this._radio.commands.execute(
                            'popQueryTerm',
                            this.options.stateKey,
                            currentPublication.get('value'),
                            {silent: true}
                        );
                    }

                    this._radio.commands.execute(
                        'pushQueryTerm',
                        this.options.stateKey,
                        {
                            type: 'printPublication',
                            value: value,
                        }
                    );
                }.bind(this),
                onItemRemove: function(value) {},  // eslint-disable-line no-unused-vars
            });

            // If an initial publication has been specified, show it as active
            // in the (dropdown) UI.
            if (!_.isUndefined(commonPublication)) {
                selectizeObj = this.ui.searchBox[0].selectize;
                selectizeObj.off('item_add');
                selectizeObj.addItem(commonPublication.get('value'), true);
                selectizeObj.on('item_add', selectizeObj.settings.onItemAdd);
            }
        },
    });
});
