define([
    'backbone',
    'dateRangePicker',
    'jquery',
    'marionette',
    'moment',
    'underscore',
    'misc/tpl'
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
            dateChooser: '#date-chooser',
            datesStart: '#budget-dates-start',
            datesEnd: '#budget-dates-end'
        },
        // className: 'center-content',
        // regions: {
        //     filters: "#filters",
        //     packages: "#packages"
        // },

        initialize: function() {
            this._radio = Backbone.Wreqr.radio.channel('global');

            moment.locale('en', {
                monthsShort : [
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
                    'Dec.'
                ]
            });
        },

        onRender: function() {
            this.ui.dateChooser.dateRangePicker({
                getValue: function() {
                    if (this.ui.datesStart.val() && this.ui.datesEnd.val()) {
                        return this.ui.datesStart.val() + ' to ' + this.ui.datesEnd.val();
                    } else {
                        return '';
                    }
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
                showShortcuts: true,
                shortcuts : null,
                customShortcuts: [
                    {
                        name: 'Today',
                        dates : function()
                        {
                            var start = moment().startOf('day').toDate();
                            var end = moment().startOf('day').add(1, 'day').subtract(1, 'second').toDate();
                            return [start,end];
                        }
                    },
                    {
                        name: 'Tomorrow',
                        dates : function()
                        {
                            var start = moment().startOf('day').add(1, 'day').toDate();
                            var end = moment().startOf('day').add(2, 'days').subtract(1, 'second').toDate();
                            return [start,end];
                        }
                    },
                    {
                        name: 'This week',
                        dates : function()
                        {
                            var start = moment().startOf('day').toDate();
                            var end = moment().startOf('day').add(7, 'days').subtract(1, 'second').toDate();
                            return [start,end];
                        }
                    },
                    {
                        name: 'This month',
                        dates : function()
                        {
                            var start = moment().startOf('day').toDate();
                            var end = moment().startOf('day').add(1, 'month').subtract(1, 'second').toDate();
                            return [start,end];
                        }
                    }
                ]
            }).bind(
                'datepicker-apply',
                function(event, obj) {
                    o2 = obj;
                    if (
                        (!isNaN(o2.date1.valueOf())) &&
                        (!isNaN(o2.date2.valueOf()))
                    ) {
                        var newDateRange = {
                            start: moment(
                                obj.date1
                            ).format('YYYY-MM-DD'),
                            end: moment(
                                obj.date2
                            ).format('YYYY-MM-DD')
                        };

                        this._radio.commands.execute('switchListDates', newDateRange);
                    }
                }.bind(this)
            );

            if (!_.isEmpty(this.options.state.dateRange)) {
                this.ui.dateChooser.data('dateRangePicker').setDateRange(
                    moment(
                        this.options.state.dateRange.start, 'YYYY-MM-DD'
                    ).format('MMM D, YYYY'),
                    moment(
                        this.options.state.dateRange.end, 'YYYY-MM-DD'
                    ).format('MMM D, YYYY'),
                    true
                );
            } else {
                this.ui.dateChooser.data('dateRangePicker').setDateRange(
                    moment().tz("America/Chicago").format('MMM D, YYYY'),
                    moment().tz("America/Chicago").add(2, 'days').format('MMM D, YYYY'),
                    true
                );
            }
        }
    });
});