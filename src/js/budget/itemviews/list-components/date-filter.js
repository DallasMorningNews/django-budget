define([
    'backbone',
    'dateRangePicker',
    'jquery',
    'marionette',
    'moment',
    'underscore',
    'common/settings',
    'common/tpl',
], function(
    Backbone,
    dateRangePicker,
    $,
    Mn,
    moment,
    _,
    settings,
    tpl
) {
    return Mn.ItemView.extend({
        // id: '',
        template: tpl('packages-list-datefilter'),

        ui: {
            rippleButton: '.button',
            dateChooser: '#date-chooser',
            startPlaceholder: '#start-placeholder',
            endPlaceholder: '#end-placeholder',
            datesStart: '#budget-dates-start',
            datesEnd: '#budget-dates-end',
            createPackageTrigger: '.create-button .button',
        },

        events: {
            'mousedown @ui.rippleButton': 'addButtonClickedClass',
            'click @ui.createPackageTrigger': 'showPackageCreate',
        },

        initialize: function() {
            this._radio = Backbone.Wreqr.radio.channel('global');

            this.dateRange = {start: null, end: null};

            moment.locale('en', {
                monthsShort: [
                    'Jan.',
                    'Feb.',
                    'March',
                    'April',
                    'May',
                    'June',
                    'July',
                    'Aug.',
                    'Sept.',
                    'Oct.',
                    'Nov.',
                    'Dec.',
                ],
            });
        },

        retrieveDateRange: function() {
            var rangeRaw = _.clone(
                this._radio.reqres.request('getState', this.options.stateKey, 'dateRange')
            );

            return {
                start: moment(rangeRaw.start, 'YYYY-MM-DD').toDate(),
                end: moment(rangeRaw.end, 'YYYY-MM-DD').toDate(),
            };
        },

        onRender: function() {
            this.ui.rippleButton.addClass('click-init');

            this.ui.datesStart.datepicker(
                _.defaults(
                    {
                        onSelect: function(fd, date) {
                            var endPicker = this.ui.datesEnd.data('datepicker');

                            this.dateRange.start = date;

                            if (this.dateRange.start > this.dateRange.end) {
                                endPicker.selectDate(this.dateRange.start);
                            } else {
                                endPicker.currentDate = this.dateRange.start;
                                endPicker.date = this.dateRange.start;
                                endPicker.update({
                                    date: this.dateRange.start,
                                    currentDate: this.dateRange.start,
                                });
                            }

                            this.ui.datesEnd.focus();
                        }.bind(this),
                    },
                    settings.datePickerOptions.default
                )
            );

            this.ui.datesEnd.datepicker(
                _.defaults(
                    {
                        onSelect: function(fd, date) {
                            var startPicker = this.ui.datesStart.data('datepicker');

                            this.dateRange.end = date;

                            if (this.dateRange.start > this.dateRange.end) {
                                startPicker.selectDate(this.dateRange.end);
                            }

                            this._radio.commands.execute(
                                'switchListDates',
                                this.options.stateKey,
                                _.mapObject(
                                    this.dateRange,
                                    // eslint-disable-next-line no-unused-vars
                                    function(val, key) { return moment(val).format('YYYY-MM-DD'); }
                                )
                            );
                        }.bind(this),
                    },
                    settings.datePickerOptions.default
                )
            );

            this.startDatepicker = this.ui.datesStart.data('datepicker');

            this.endDatepicker = this.ui.datesEnd.data('datepicker');

            this.dateRange = this.retrieveDateRange();

            // Run the date-range selects line-by-line, since the datepicker's
            // 'silent' flag apparently means nothing.
            this.startDatepicker.silent = true;
            this.startDatepicker.date = this.dateRange.start;
            // eslint-disable-next-line no-underscore-dangle
            this.startDatepicker.nav._render();
            this.startDatepicker.selectedDates = [this.dateRange.start];
            // eslint-disable-next-line no-underscore-dangle
            this.startDatepicker._setInputValue();
            // eslint-disable-next-line no-underscore-dangle
            this.startDatepicker.views[this.startDatepicker.currentView]._render();
            this.startDatepicker.silent = false;

            this.endDatepicker.silent = true;
            this.endDatepicker.date = this.dateRange.end;
            // eslint-disable-next-line no-underscore-dangle
            this.endDatepicker.nav._render();
            this.endDatepicker.selectedDates = [this.dateRange.end];
            // eslint-disable-next-line no-underscore-dangle
            this.endDatepicker._setInputValue();
            // eslint-disable-next-line no-underscore-dangle
            this.endDatepicker.views[this.endDatepicker.currentView]._render();
            this.endDatepicker.silent = false;
        },

        addButtonClickedClass: function(event) {
            var thisEl = $(event.currentTarget);
            thisEl.addClass('active-state');
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

        showPackageCreate: function(event) {
            var triggerElement;

            if (event.button === 0 && !(event.ctrlKey || event.metaKey)) {
                event.preventDefault();

                triggerElement = $(event.currentTarget);

                setTimeout(
                    function() {
                        this._radio.commands.execute(
                            'navigate',
                            triggerElement.find('a').attr('href'),
                            {trigger: true}
                        );
                    }.bind(this),
                    450
                );
            }
        },
    });
});
