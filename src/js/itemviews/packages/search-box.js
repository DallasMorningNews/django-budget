define([
    'backbone',
    'marionette',
    'misc/tpl',
    'selectize',
], function(
    Backbone,
    Mn,
    tpl,
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

        // initialize: function() {
        //     this.packageFilterView = new PackageFilterView({});
        //     this.packageCollectionView = new ({});
        // },

        // TODO: Render search options dynamically.

        onRender: function() {
            var _radio = Backbone.Wreqr.radio.channel('global');

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
                options: this.options.searchOptions.toJSON(),
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
        }
    });
});