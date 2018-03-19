import _ from 'underscore';
import Backbone from 'backbone';
import jQuery from 'jquery';
import Mn from 'backbone.marionette';
// import 'uglydate';


import urlConfig from '../../misc/urls';
import UglyDateRangePicker from '../../../common/ugly-daterange-picker';


export default Mn.ItemView.extend({
  // id: '',
  template: 'budget/packages-list-datefilter',

  ui: {
    rippleButton: '.material-button',
    dateChooser: '#date-chooser',
    uglyStartInput: '#search-dates-start-holder input',
    uglyEndInput: '#search-dates-end-holder input',
    startPlaceholder: '#start-placeholder',
    endPlaceholder: '#end-placeholder',
    datesStart: '#budget-dates-start',
    datesStartPlaceholder: '.start-date-holder',
    datesEnd: '#budget-dates-end',
    datesEndPlaceholder: '.end-date-holder',
    createPackageTrigger: '.create-button .material-button',
  },

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

    setTimeout(() => {
      const defaultRange = this.radio.reqres.request('getSetting', 'defaultDateRange');

      this.rangePicker = new UglyDateRangePicker({
        selector: '#ugly-date-picker',
        startDateSelector: '#search-dates-start-holder',
        endDateSelector: '#search-dates-end-holder',
        allowedRange: defaultRange(),
        additionalClicksDisabled: ['#date-chooser'],
        getValues: () => { this.retrieveDateRange(); return this.dateRange; },
        onSelect: (event) => {
          const startMoment = this.moment(event.startDate);
          const endMoment = this.moment(event.endDate);

          const displayFmt = 'MMM D, YYYY';

          this.ui.datesStart.val(startMoment.format(displayFmt));
          this.ui.datesStartPlaceholder.html(startMoment.format(displayFmt));

          this.ui.datesEnd.val(endMoment.format(displayFmt));
          this.ui.datesEndPlaceholder.html(endMoment.format(displayFmt));

          this.radio.commands.execute('switchListDates', this.options.stateKey, {
            start: startMoment.format('YYYY-MM-DD'),
            end: endMoment.format('YYYY-MM-DD'),
          });
        },
      });

      this.ui.datesStart.on('focus', () => { this.rangePicker.show(); });

      this.ui.datesEnd.on('focus', () => { this.rangePicker.show(); });
    }, 20);
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
