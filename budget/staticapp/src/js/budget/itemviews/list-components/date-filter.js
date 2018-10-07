import _ from 'underscore';
import Backbone from 'backbone';
import jQuery from 'jquery';
import Lightpick from 'lightpick';
import Mn from 'backbone.marionette';
// import 'uglydate';


import urlConfig from '../../misc/urls';
// import UglyDateRangePicker from '../../../common/ugly-daterange-picker';


export default Mn.ItemView.extend({
  // id: '',
  template: 'budget/packages-list-datefilter',

  ui: {
    rippleButton: '.material-button',
    dateChooser: '#date-chooser',
    widgetStartInput: '#search-dates-start-holder input',
    widgetEndInput: '#search-dates-end-holder input',
    startPlaceholder: '#start-placeholder',
    endPlaceholder: '#end-placeholder',
    datesStart: '#budget-dates-start',
    datesStartPlaceholder: '.start-date-holder',
    datesEnd: '#budget-dates-end',
    datesEndPlaceholder: '.end-date-holder',

    // datePickerWidget: '.picker-widget',

    createPackageTrigger: '.create-button .material-button',
  },

  dateFormat: 'MMM D, YYYY',

  events: {
    'mousedown @ui.rippleButton': 'addButtonClickedClass',
    'click @ui.createPackageTrigger': 'showPackageCreate',
  },

  initialize() {
    this.radio = Backbone.Wreqr.radio.channel('global');

    this.dateRange = { start: null, end: null };

    this.moment = this.radio.reqres.request('getSetting', 'moment');

    this.moment.locale('en-us-apstyle');
  },

  retrieveDateRange() {
    const rangeRaw = _.clone(
      // eslint-disable-next-line comma-dangle
      this.radio.reqres.request('getState', this.options.stateKey, 'dateRange')
    );

    this.dateRange = {
      start: this.moment(rangeRaw.start, 'YYYY-MM-DD'),
      end: this.moment(rangeRaw.end, 'YYYY-MM-DD'),
    };
  },

  serializeData() {
    const navLinks = this.radio.reqres.request('getSetting', 'navigationLinks');
    const homeView = _.findWhere(navLinks, { name: 'Home' });
    return {
      homeViewLink: homeView.destination,
    };
  },

  onRender() {
    // Fill date range inputs with appropriate values.
    this.retrieveDateRange();

    this.ui.datesStart.val(this.dateRange.start.format('MMM D, YYYY'));
    this.ui.datesStartPlaceholder.html(this.dateRange.start.format('MMM D, YYYY'));

    this.ui.datesEnd.val(this.dateRange.end.clone().format('MMM D, YYYY'));
    this.ui.datesEndPlaceholder.html(this.dateRange.end.clone().format('MMM D, YYYY'));

    this.ui.rippleButton.addClass('click-init');

    const hidePickerCallback = (event) => { this.hidePicker(); };
    const pickerExclusionEvent = (event) => { event.stopPropagation(); };

    setTimeout(() => {
      this.rangePicker = new Lightpick({
        field: this.ui.widgetStartInput[0],
        secondField: this.ui.widgetEndInput[0],
        firstDay: 7,
        format: 'YYYY-MM-DD',
        numberOfMonths: 2,
        hideOnBodyClick: false,
        parentEl: '#date-filter .picker-widget',
        onOpen: () => {
          this.numDatesSelected = 0;

          jQuery(window).on('click', hidePickerCallback);
          this.$el.on('click', pickerExclusionEvent);
        },
        onSelect: (startDate, endDate) => {
          this.numDatesSelected += 1;

          if (this.numDatesSelected === 2) {
            const formattedDates = {
              start: this.moment(startDate.toDate()).format(this.dateFormat),
              end: this.moment(endDate.toDate()).format(this.dateFormat),
            };

            this.ui.datesStart.val(formattedDates.start);
            this.ui.datesStartPlaceholder.html(formattedDates.start);

            this.ui.datesEnd.val(formattedDates.end);
            this.ui.datesEndPlaceholder.html(formattedDates.end);

            this.radio.commands.execute('switchListDates', this.options.stateKey, {
              start: startDate.format('YYYY-MM-DD'),
              end: endDate.format('YYYY-MM-DD'),
            });
          }

          this.selectedStart = startDate;
          this.selectedEnd = endDate;
        },
        onClose: () => {
          jQuery(window).off('click', hidePickerCallback);
          this.$el.off('click', pickerExclusionEvent);

          if (this.numDatesSelected !== 2) {
            this.rangePicker.setDateRange(this.selectedStart.toDate(), this.selectedStart.toDate());
          }
        },
      });

      this.rangePicker.setDateRange(this.dateRange.start.toDate(), this.dateRange.end.toDate());

      this.ui.datesStart.on('focus', this.showPicker.bind(this));
      this.ui.datesEnd.on('focus', this.showPicker.bind(this));
    }, 20);
  },

  showPicker(event) {
    this.rangePicker.show();
  },

  hidePicker(event) {
    this.rangePicker.hide();
  },

  addButtonClickedClass(event) {
    const thisEl = jQuery(event.currentTarget);
    thisEl.addClass('active-state');
    thisEl.removeClass('click-init');

    setTimeout(() => {
      thisEl.removeClass('hover').removeClass('active-state');
    }, 1000);

    setTimeout(() => {
      thisEl.addClass('click-init');
    }, 2000);
  },

  showPackageCreate(event) {
    const createLink = urlConfig.createPage.reversePattern;

    if (event.button === 0 && !(event.ctrlKey || event.metaKey)) {
      event.preventDefault();

      setTimeout(() => {
        this.radio.commands.execute('navigate', createLink, { trigger: true });
      }, 450);
    }
  },
});
