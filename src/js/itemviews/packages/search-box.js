define([
    'backbone',
    'marionette',
    'collections/search-options',
    'misc/settings',
    'misc/tpl',
    'models/search-option',
    'selectize'
], function(
    Backbone,
    Mn,
    SearchOptionCollection,
    settings,
    tpl,
    SearchOption,
    selectize
) {
    return Mn.ItemView.extend({
        // id: '',
        template: tpl('packages-list-searchbox'),

        ui: {
            searchBox: '#package-search-box'
        },
        // className: 'center-content',
        // regions: {
        //     filters: "#filters",
        //     packages: "#packages"
        // },

        initialize: function() {
            this.searchOptions = new SearchOptionCollection();
        //     this.packageFilterView = new PackageFilterView({});
        //     this.packageCollectionView = new ({});
        },

        // TODO: Render search options dynamically.

        onRender: function() {
            var _radio = Backbone.Wreqr.radio.channel('global');

            this.generateSearchOptions();

            this.selectizeBox = this.ui.searchBox.selectize({
                plugins: ['remove_button', 'restore_on_backspace'],
                persist: false,
                create: function(input) {
                    return {
                        name: input,
                        value: input
                    };
                },
                hideSelected: true,
                valueField: 'value',
                labelField: 'name',
                searchField: ['name',],
                selectOnTab: true,
                closeAfterSelect: true,
                options: this.searchOptions.toJSON(),
                optgroupField: 'type',
                optgroupLabelField: 'name',
                optgroupValueField: 'value',
                optgroups: [
                    {name: 'People', value: 'person', $order: 2},
                    {name: 'Hubs', value: 'hub', $order: 3},
                    {name: 'Verticals', value: 'vertical', $order: 4}
                ],
                lockOptgroupOrder: true,
                addPrecedence: false,
                render: {
                    item: function(data, escape) {
                        var dataType = 'fullText';
                        if (typeof(data.type) != "undefined") {
                            dataType = data.type;
                        }
                        return '<div data-value="' + data.value + '" data-type="' + dataType + '" class="item">' + data.name + '</div>';
                    },
                    option_create: function(data, escape) {
                        return '<div class="create">Search all content for <strong>"' + escape(data.input) + '"</strong>&hellip;</div>';
                    }
                },
                onItemAdd: function(value, $item) {
                    var additionalParam = {};
                    additionalParam.type = $item.data('type');
                    additionalParam.value = $item.data('value');
                    // this.chaperone.chaperone.narrowVisiblePackages(additionalParam);

                    _radio.commands.execute('pushQueryTerm', additionalParam);
                }.bind(this),
                onItemRemove: function(value) {
                    // this.chaperone.chaperone.broadenVisiblePackages(value);

                    _radio.commands.execute('popQueryTerm', value);
                }.bind(this)
                // preload: true
            });
        },

        generateSearchOptions: function() {
            var rawOptions = {
                    hubs: [],
                    verticals: []
                },
                addedVerticals = [];

            rawOptions.staffers = this.options.data.staffers.map(
                function(staffer, idx) {
                    return new SearchOption({
                        name: staffer.get('fullName'),
                        value: staffer.get('email'),
                        type: 'person',
                        sortKey: staffer.get('lastName')
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
                            type: 'hub'
                        })
                    );

                    if (!_.contains(addedVerticals, vertical.slug)) {
                        addedVerticals.push(vertical.slug);

                        rawOptions.verticals.push(
                            new SearchOption({
                                name: vertical.name,
                                value: vertical.slug,
                                type: 'vertical'
                            })
                        );
                    }
                }
            );

            this.searchOptions.comparator = function(item1, item2) {
                var optionType1 = item1.get('type'),
                    optionType2 = item2.get('type');

                if (optionType1 != optionType2) {
                    var typeRanking1 = settings.typeRankingIndex[optionType1],
                        typeRanking2 = settings.typeRankingIndex[optionType2];

                    return (typeRanking1 > typeRanking2) ? 1 : -1;
                } else {
                    var optionValue1 = item1.get('value').toLowerCase(),
                        optionValue2 = item2.get('value').toLowerCase();

                    if (item1.has('sortKey')) {
                        optionValue1 = item1.get('sortKey').toLowerCase();
                    }

                    if (item2.has('sortKey')) {
                        optionValue2 = item2.get('sortKey').toLowerCase();
                    }

                    return (optionValue1 > optionValue2) ? 1 : -1;
                }
            };

            this.searchOptions.reset();

            this.searchOptions.add(rawOptions.staffers);
            this.searchOptions.add(rawOptions.hubs);
            this.searchOptions.add(rawOptions.verticals);
        }
    });
});