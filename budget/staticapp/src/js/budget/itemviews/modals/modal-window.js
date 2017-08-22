import _ from 'underscore';
import jQuery from 'jquery';
import Mn from 'backbone.marionette';
import 'selectize';

export default Mn.ItemView.extend({
    template: 'budget/modal-base',

    serializeData() {
        return this.options.modalConfig;
    },

    ui: {
        // searchBox: '#package-search-box'
        button: '.button-holder .material-button',
    },

    events: {
        'mousedown @ui.button': 'addButtonClickedClass',
        'click @ui.button': 'onButtonClick',
    },

    initialize(options) {
        if (_.has(options, 'model')) {
            this.model = this.options.model;
        }
    },

    // className: 'center-content',
    // regions: {
    //     filters: "#filters",
    //     packages: "#packages"
    // },

    addButtonClickedClass(event) {
        const thisEl = jQuery(event.currentTarget);

        thisEl.addClass('hover').addClass('active-state');
        thisEl.removeClass('click-init');

        setTimeout(
            () => { thisEl.removeClass('hover').removeClass('active-state'); },
            1000
        );

        setTimeout(
            () => { thisEl.addClass('click-init'); },
            2000
        );
    },

    onButtonClick(event) {
        const thisEl = jQuery(event.currentTarget);

        const modalConfig = _.findWhere(
            this.options.modalConfig.buttons,
            {
                buttonID: thisEl.attr('id'),
            }
        );

        modalConfig.clickCallback(this);
    },

    onRender() {
        if (_.has(this.options, 'renderCallback')) {
            this.options.renderCallback(this);
        }
    },

    // initialize() {
    //     this.packageFilterView = new PackageFilterView({});
    //     this.packageCollectionView = new ({});
    // },
});
