define([
    'backbone',
    'marionette',
    'selectize',
    'underscore',
    'common/settings',
    'common/tpl',
    'budget/collections/search-options',
    'budget/models/search-option',
], function(
    Backbone,
    Mn,
    selectize,
    _,
    settings,
    tpl,
    SearchOptionCollection,
    SearchOption
) {
    return Mn.ItemView.extend({
        template: tpl('packages-list-searchbox'),

        ui: {
            searchBox: '#package-search-box',
        },

        initialize: function() {
            this.searchOptions = new SearchOptionCollection();
        },

        onRender: function() {
            var commonQueryTerms,
                selectizeObj;

            this._radio = Backbone.Wreqr.radio.channel('global');

            this.generateSearchOptions();

            this.selectizeBox = this.ui.searchBox.selectize({
                plugins: ['remove_button', 'restore_on_backspace'],
                persist: false,
                create: function(input) {
                    this.ui.searchBox.parent().find('.selectize-dropdown').addClass('super-hidden');

                    setTimeout(
                        function() {
                            this.ui.searchBox[0].selectize.close();
                            this.ui.searchBox.parent().find('.selectize-dropdown')
                                                        .removeClass('super-hidden');
                        }.bind(this),
                        75
                    );

                    return {
                        name: input,
                        value: input,
                    };
                }.bind(this),
                hideSelected: true,
                valueField: 'value',
                labelField: 'name',
                searchField: ['name'],
                selectOnTab: true,
                closeAfterSelect: true,
                options: this.searchOptions.toJSON(),
                optgroupField: 'type',
                optgroupLabelField: 'name',
                optgroupValueField: 'value',
                optgroups: [
                    {name: 'People', value: 'person', $order: 2},
                    {name: 'Hubs', value: 'hub', $order: 3},
                    {name: 'Verticals', value: 'vertical', $order: 4},
                ],
                lockOptgroupOrder: true,
                addPrecedence: false,
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
                    option_create: function(data, escape) {
                        return '<div class="create">Search all content for <strong>"' +
                                    escape(data.input) +
                                '"</strong>&hellip;</div>';
                    },
                },
                onItemAdd: function(value, $item) {
                    var additionalParam = {};
                    additionalParam.type = $item.data('type');
                    additionalParam.value = $item.data('value');

                    this._radio.commands.execute(
                        'pushQueryTerm',
                        this.options.stateKey,
                        additionalParam
                    );
                }.bind(this),
                onItemRemove: function(value) {
                    this._radio.commands.execute(
                        'popQueryTerm',
                        this.options.stateKey,
                        value
                    );
                }.bind(this),
                // preload: true
            });

            commonQueryTerms = this._radio.reqres.request(
                'getState',
                this.options.stateKey,
                'queryTerms'
            );

            if (!commonQueryTerms.isEmpty()) {
                // Add all currently-selected fields to the selectize box.
                // Nota bene: I'm doing this manually, rather than by
                // specifying an 'items' array, because the latter way won't
                // let you add created (in our case, full-text search) options.
                selectizeObj = this.ui.searchBox[0].selectize;

                selectizeObj.off('item_add');

                commonQueryTerms.each(function(term, i) {
                    if (term.get('type') === 'fullText') {
                        selectizeObj.createItem(term.get('value'), false);
                    } else {
                        selectizeObj.addItem(term.get('value'), true);
                    }

                    if (i + 1 === commonQueryTerms.length) {
                        selectizeObj.on('item_add', selectizeObj.settings.onItemAdd);
                    }
                }.bind(this));  // eslint-disable-line no-extra-bind
            }
        },

        generateSearchOptions: function() {
            var rawOptions = {
                    hubs: [],
                    verticals: [],
                },
                addedVerticals = [];

            rawOptions.staffers = this.options.data.staffers.map(
                function(staffer, idx) {  // eslint-disable-line no-unused-vars
                    return new SearchOption({
                        name: staffer.get('fullName'),
                        value: staffer.get('email'),
                        type: 'person',
                        sortKey: staffer.get('lastName'),
                    });
                }
            );

            this.options.data.hubs.each(
                function(hub) {
                    var vertical = hub.get('vertical');

                    rawOptions.hubs.push(
                        new SearchOption({
                            name: hub.get('name'),
                            value: hub.get('slug'),
                            type: 'hub',
                        })
                    );

                    if (!_.contains(addedVerticals, vertical.slug)) {
                        addedVerticals.push(vertical.slug);

                        rawOptions.verticals.push(
                            new SearchOption({
                                name: vertical.name,
                                value: vertical.slug,
                                type: 'vertical',
                            })
                        );
                    }
                }
            );

            this.searchOptions.comparator = function(item1, item2) {
                var optionType1 = item1.get('type'),
                    optionType2 = item2.get('type'),
                    typeRanking1,
                    typeRanking2,
                    optionValue1,
                    optionValue2;

                if (optionType1 !== optionType2) {
                    typeRanking1 = settings.typeRankingIndex[optionType1];
                    typeRanking2 = settings.typeRankingIndex[optionType2];

                    return (typeRanking1 > typeRanking2) ? 1 : -1;
                }

                optionValue1 = item1.get('value').toLowerCase();
                optionValue2 = item2.get('value').toLowerCase();

                if (item1.has('sortKey')) {
                    optionValue1 = item1.get('sortKey').toLowerCase();
                }

                if (item2.has('sortKey')) {
                    optionValue2 = item2.get('sortKey').toLowerCase();
                }

                return (optionValue1 > optionValue2) ? 1 : -1;
            };

            this.searchOptions.reset();

            this.searchOptions.add(rawOptions.staffers);
            this.searchOptions.add(rawOptions.hubs);
            this.searchOptions.add(rawOptions.verticals);
        },
    });
});
