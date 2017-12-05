import _ from 'underscore';
import Backbone from 'backbone';
import jQuery from 'jquery';
import Mn from 'backbone.marionette';
import 'daterange-picker-ex';

import urlConfig from '../../misc/urls';

export default Mn.ItemView.extend({
  // id: '',
  template: 'budget/packages-list-datefilter',

  ui: {
    rippleButton: '.material-button',
    dateChooser: '#date-chooser',
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
    // if (this.dateRange.start === null) {
    this.retrieveDateRange();

    this.ui.datesStart.val(this.dateRange.start.format('MMM D, YYYY'));
    this.ui.datesStartPlaceholder.html(this.dateRange.start.format('MMM D, YYYY'));

    this.ui.datesEnd.val(this.dateRange.end.clone().format('MMM D, YYYY'));
    this.ui.datesEndPlaceholder.html(this.dateRange.end.clone().format('MMM D, YYYY'));
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
        this.ui.datesStartPlaceholder.html(s1[1]);

        this.ui.datesEnd.val(s2[1]);
        this.ui.datesEndPlaceholder.html(s2[1]);

        this.radio.commands.execute(
          'switchListDates',
          this.options.stateKey,
          {
            start: this.moment(s1[1], 'MMM D, YYYY')
                                .format('YYYY-MM-DD'),
            end: this.moment(s2[1], 'MMM D, YYYY')
                                // .clone().add(1, 'day')
                                .format('YYYY-MM-DD'),
          }  // eslint-disable-line comma-dangle
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
        1000  // eslint-disable-line comma-dangle
    );

    setTimeout(
      () => {
        thisEl.addClass('click-init');
      },
      2000  // eslint-disable-line comma-dangle
    );
  },

  showPackageCreate(event) {
    const createLink = urlConfig.createPage.reversePattern;

    if (event.button === 0 && !(event.ctrlKey || event.metaKey)) {
      event.preventDefault();

      setTimeout(
        () => {
          this.radio.commands.execute(
            'navigate',
            createLink,
            { trigger: true }  // eslint-disable-line comma-dangle
          );
        },
        450  // eslint-disable-line comma-dangle
      );
    }
  },
});
