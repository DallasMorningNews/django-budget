define([
    'datePicker',
    'jquery',
], function(
    datePicker,
    $
) {
    $.fn.datepicker.language.en_us_apstyle = {  // eslint-disable-line no-param-reassign
        days: ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'],
        daysShort: ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'],
        daysMin: ['S', 'M', 'T', 'W', 'T', 'F', 'S'],
        months: [
            'January', 'February', 'March', 'April', 'May', 'June',
            'July', 'August', 'September', 'October', 'November', 'December',
        ],
        monthsShort: [
            'Jan.', 'Feb.', 'March', 'April', 'May', 'June',
            'July', 'Aug.', 'Sept.', 'Oct.', 'Nov.', 'Dec.',
        ],
        today: 'Today',
        clear: 'Clear',
        dateFormat: 'M d, yyyy',
        timeFormat: 'hh:ii aa',
        firstDay: 1,
    };
});
