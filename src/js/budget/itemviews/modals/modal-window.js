define([
    'backbone',
    'jquery',
    'marionette',
    'selectize',
    'underscore',
    'common/tpl',
], function(
    Backbone,
    $,
    Mn,
    selectize,
    _,
    tpl
) {
    return Mn.ItemView.extend({
        // id: '',
        template: tpl('modal-base'),

        serializeData: function() {
            return this.options.modalConfig;
        },

        ui: {
            // searchBox: '#package-search-box'
            button: '.button-holder .button',
        },

        events: {
            'mousedown @ui.button': 'addButtonClickedClass',
            'click @ui.button': 'onButtonClick',
        },

        initialize: function(options) {
            if (_.has(options, 'model')) {
                this.model = this.options.model;
            }
        },

        // className: 'center-content',
        // regions: {
        //     filters: "#filters",
        //     packages: "#packages"
        // },

        addButtonClickedClass: function(event) {
            var thisEl = $(event.currentTarget);

            thisEl.addClass('hover').addClass('active-state');
            thisEl.removeClass('click-init');

            setTimeout(
                function() {
                    thisEl.removeClass('hover').removeClass('active-state');
                },
                1000
            );

            setTimeout(
                function() {
                    thisEl.addClass('click-init');
                },
                2000
            );
        },

        onButtonClick: function(event) {
            var thisEl = $(event.currentTarget),
                modalConfig = _.findWhere(
                    this.options.modalConfig.buttons,
                    {
                        buttonID: thisEl.attr('id'),
                    }
                );

            modalConfig.clickCallback(this);
        },

        onRender: function() {
            if (_.has(this.options, 'renderCallback')) {
                this.options.renderCallback(this);
            }
        },

        // initialize: function() {
        //     this.packageFilterView = new PackageFilterView({});
        //     this.packageCollectionView = new ({});
        // },
    });
});
