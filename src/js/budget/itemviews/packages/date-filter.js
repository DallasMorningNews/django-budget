define([
    'backbone',
    'dateRangePicker',
    'jquery',
    'marionette',
    'moment',
    'underscore',
    'common/tpl',
], function(
    Backbone,
    dateRangePicker,
    $,
    Mn,
    moment,
    _,
    tpl
) {
    return Mn.ItemView.extend({
        // id: '',
        template: tpl('packages-list-datefilter'),

        ui: {
            rippleButton: '.button',
            dateChooser: '#date-chooser',
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

        onRender: function() {
            var commonDateRange;

            this.ui.rippleButton.addClass('click-init');

            this.ui.dateChooser.dateRangePicker({
                getValue: function() {
                    if (this.ui.datesStart.val() && this.ui.datesEnd.val()) {
                        return this.ui.datesStart.val() + ' to ' + this.ui.datesEnd.val();
                    }

                    return '';
                }.bind(this),
                setValue: function(s, s1, s2) {
                    this.ui.datesStart.val(s1);
                    this.ui.datesEnd.val(s2);
                }.bind(this),
                customOpenAnimation: function(cb) {
                    $(this).fadeIn(150, cb);
                },
                customCloseAnimation: function(cb) {
                    $(this).fadeOut(150, cb);
                },
                separator: ' to ',
                format: 'MMM D, YYYY',
                startOfWeek: 'monday',
                showShortcuts: true,
                shortcuts: null,
                customShortcuts: [
                    {
                        name: 'Today',
                        dates: function() {
                            var start = moment().startOf('day')
                                                .toDate(),
                                end = moment().startOf('day')
                                                .add(1, 'day')
                                                .subtract(1, 'second')
                                                .toDate();
                            return [start, end];
                        },
                    },
                    {
                        name: 'Tomorrow',
                        dates: function() {
                            var start = moment().startOf('day')
                                                .add(1, 'day')
                                                .toDate(),
                                end = moment().startOf('day')
                                                .add(2, 'days')
                                                .subtract(1, 'second')
                                                .toDate();
                            return [start, end];
                        },
                    },
                    {
                        name: 'This week',
                        dates: function() {
                            var start = moment().startOf('day')
                                                .toDate(),
                                end = moment().startOf('day')
                                                .add(7, 'days')
                                                .subtract(1, 'second')
                                                .toDate();
                            return [start, end];
                        },
                    },
                    {
                        name: 'This month',
                        dates: function() {
                            var start = moment().startOf('day')
                                                .toDate(),
                                end = moment().startOf('day')
                                                .add(1, 'month')
                                                .subtract(1, 'second')
                                                .toDate();
                            return [start, end];
                        },
                    },
                ],
            }).bind(
                'datepicker-apply',
                function(event, obj) {
                    var o2 = obj,
                        newDateRange;

                    if (
                        (!isNaN(o2.date1.valueOf())) &&
                        (!isNaN(o2.date2.valueOf()))
                    ) {
                        newDateRange = {
                            start: moment(
                                obj.date1
                            ).format('YYYY-MM-DD'),
                            end: moment(
                                obj.date2
                            ).format('YYYY-MM-DD'),
                        };

                        this._radio.commands.execute(
                            'switchListDates',
                            this.options.stateKey,
                            newDateRange
                        );
                    }
                }.bind(this)
            );

            commonDateRange = this._radio.reqres.request(
                'getState',
                this.options.stateKey,
                'dateRange'
            );

            if (!_.isEmpty(commonDateRange)) {
                this.ui.dateChooser.data('dateRangePicker').setDateRange(
                    moment(
                        commonDateRange.start, 'YYYY-MM-DD'
                    ).format('MMM D, YYYY'),
                    moment(
                        commonDateRange.end, 'YYYY-MM-DD'
                    ).format('MMM D, YYYY'),
                    true
                );
            } else {
                this.ui.dateChooser.data('dateRangePicker').setDateRange(
                    moment().tz('America/Chicago')
                                .format('MMM D, YYYY'),
                    moment().tz('America/Chicago').add(2, 'days')
                                .format('MMM D, YYYY'),
                    true
                );
            }
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
