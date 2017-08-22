import _ from 'underscore';
import Backbone from 'backbone';
import jQuery from 'jquery';
import Mn from 'backbone.marionette';
import 'daterange-picker-ex';

import settings from '../../../common/settings';

export default Mn.ItemView.extend({
    // id: '',
    template: 'budget/packages-list-datefilter',

    ui: {
        rippleButton: '.material-button',
        dateChooser: '#date-chooser',
        startPlaceholder: '#start-placeholder',
        endPlaceholder: '#end-placeholder',
        datesStart: '#budget-dates-start',
        datesEnd: '#budget-dates-end',
        createPackageTrigger: '.create-button .material-button',
    },

    events: {
        'mousedown @ui.rippleButton': 'addButtonClickedClass',
        'click @ui.createPackageTrigger': 'showPackageCreate',
    },

    initialize() {
        this.radio = Backbone.Wreqr.radio.channel('global');

        this.dateRange = { start: null, end: null };

        settings.moment.locale('en-us-apstyle');
    },

    retrieveDateRange() {
        const rangeRaw = _.clone(
            this.radio.reqres.request('getState', this.options.stateKey, 'dateRange')
        );

        this.dateRange = {
            start: settings.moment(rangeRaw.start, 'YYYY-MM-DD'),
            end: settings.moment(rangeRaw.end, 'YYYY-MM-DD'),
        };
    },

    onRender() {
        // Fill date range inputs with appropriate values.
        // if (this.dateRange.start === null) {
        this.retrieveDateRange();

        this.ui.datesStart.val(
            this.dateRange.start.format('MMM D, YYYY')
        );
        this.ui.datesEnd.val(
            this.dateRange.end.clone().format('MMM D, YYYY')
        );
        // }

        this.ui.rippleButton.addClass('click-init');

        this.ui.dateChooser.dateRangePicker({
            format: 'MMM D, YYYY',
            separator: ' to ',
            watchValueChange: true,
            getValue: () => {
                const startDateEl = this.ui.datesStart;
                const endDateEl = this.ui.datesEnd;

                if (startDateEl.val() && endDateEl.val()) {
                    return `${startDateEl.val()} to ${endDateEl.val()}`;
                }

                return '';
            },
            setValue: (s, s1, s2) => {
                this.ui.datesStart.val(s1[1]);
                this.ui.datesEnd.val(s2[1]);

                this.radio.commands.execute(
                    'switchListDates',
                    this.options.stateKey,
                    {
                        start: settings.moment(s1[1], 'MMM D, YYYY')
                                            .format('YYYY-MM-DD'),
                        end: settings.moment(s2[1], 'MMM D, YYYY')
                                            // .clone().add(1, 'day')
                                            .format('YYYY-MM-DD'),
                    }
                );
            },
            customArrowNextSymbol: '<i class="fa fa-arrow-circle-right"></i>',
            customArrowPrevSymbol: '<i class="fa fa-arrow-circle-left"></i>',
            shortcuts: {
                custom: {
                    Yesterday: presentDay => [
                        presentDay.clone().subtract(1, 'days').toDate(),
                        presentDay.clone().subtract(1, 'days').toDate(),
                    ],
                    Today: presentDay => [
                        presentDay.toDate(),
                        presentDay.toDate(),
                    ],
                    'Next 3 days': presentDay => [
                        presentDay.toDate(),
                        presentDay.clone().add(2, 'days').toDate(),
                    ],
                    'This week': presentDay => [
                        presentDay.clone().startOf('week').toDate(),
                        presentDay.clone().endOf('week').toDate(),
                    ],
                    'Next week': presentDay => [
                        presentDay.clone().add(7, 'days').startOf('week').toDate(),
                        presentDay.clone().add(7, 'days').endOf('week').toDate(),
                    ],
                    'This month': presentDay => [
                        presentDay.clone().startOf('month').toDate(),
                        presentDay.clone().endOf('month').toDate(),
                    ],
                },
            },
        });

        // // Run the date-range selects line-by-line, since the datepicker's
        // // 'silent' flag apparently means nothing.
        // this.startDatepicker.silent = true;
        // this.startDatepicker.date = this.dateRange.start;
        // // eslint-disable-next-line no-underscore-dangle
        // this.startDatepicker.nav._render();
        // this.startDatepicker.selectedDates = [this.dateRange.start];
        // // eslint-disable-next-line no-underscore-dangle
        // this.startDatepicker._setInputValue();
        // // eslint-disable-next-line no-underscore-dangle
        // this.startDatepicker.views[this.startDatepicker.currentView]._render();
        // this.startDatepicker.silent = false;
        //
        // this.endDatepicker.silent = true;
        // this.endDatepicker.date = this.dateRange.end;
        // // eslint-disable-next-line no-underscore-dangle
        // this.endDatepicker.nav._render();
        // this.endDatepicker.selectedDates = [this.dateRange.end];
        // // eslint-disable-next-line no-underscore-dangle
        // this.endDatepicker._setInputValue();
        // // eslint-disable-next-line no-underscore-dangle
        // this.endDatepicker.views[this.endDatepicker.currentView]._render();
        // this.endDatepicker.silent = false;
    },

    addButtonClickedClass(event) {
        const thisEl = jQuery(event.currentTarget);
        thisEl.addClass('active-state');
        thisEl.removeClass('click-init');

        setTimeout(
            () => {
                thisEl.removeClass('hover').removeClass('active-state');
            },
            1000
        );

        setTimeout(
            () => {
                thisEl.addClass('click-init');
            },
            2000
        );
    },

    showPackageCreate(event) {
        let triggerElement;

        if (event.button === 0 && !(event.ctrlKey || event.metaKey)) {
            event.preventDefault();

            triggerElement = jQuery(event.currentTarget);

            setTimeout(
                () => {
                    this.radio.commands.execute(
                        'navigate',
                        triggerElement.find('a').attr('href'),
                        { trigger: true }
                    );
                },
                450
            );
        }
    },
});
