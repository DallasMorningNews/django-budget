define([
    'backbone',
    'marionette',
    'itemviews/additional-content/additional-form'
], function(
    Backbone,
    Mn,
    AdditionalContentForm
) {
    return Mn.CollectionView.extend({
        childView: AdditionalContentForm,

        // collectionEvents: {
        //     'updateQuery': 'render'
        // },

        childViewOptions: function(model, index) {
            return {
                stafferChoices: this.options.stafferChoices,
                staffers: this.options.staffers,
                typeChoices: this.options.typeChoices
            };
        },

        // id: '',
        // template: tpl('packages-list'),
        // className: 'center-content',
        // regions: {
        //     filters: "#filters",
        //     packages: "#packages"
        // },

        // initialize: function() {
        //     this.packageFilterView = new PackageFilterView({});
        //     this.packageCollectionView = new ({});
        // },

        // onBeforeShow: function() {
        //     this.showChildView('filters', this.packageFilterView);
        //     this.showChildView('packages', this.packageCollectionView);
        // }
    });
});