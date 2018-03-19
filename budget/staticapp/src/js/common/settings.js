import _ from 'underscore';
import jQuery from 'jquery';
import moment from 'moment';
import 'moment-timezone';

const generateEndpointsFromBases = bases => ({
  contentPlacement: `${bases.budget}content-placements/`,
  headlineCandidate: `${bases.budget}headlines/`,
  hub: `${bases.staff}hub/`,
  item: `${bases.budget}items/`,
  staffer: `${bases.staff}staff/`,
  package: `${bases.budget}packages/`,
  printPublication: `${bases.budget}print-publications/`,
  userInfo: `${bases.auth}users/me/`,
});

const generateNavigationLinks = rootURL => [
  {
    name: 'Home',
    destination: `${rootURL}`,
  },
  {
    name: 'The Daily',
    destination: `${rootURL}print/`,
  },
  {
    name: 'Add item',
    destination: `${rootURL}edit/`,
  },
];

// Initialize 'en-us-apstyle' locale.
moment.defineLocale('en-us-apstyle', {
  meridiem(hour, minute, isLowercase) {
    let meridiemString;

    if (hour < 12) {
      meridiemString = 'a.m.';
    } else {
      meridiemString = 'p.m.';
    }

    if (!isLowercase) {
      return meridiemString.toUpperCase();
    }

    return meridiemString;
  },
  monthsShort: [
    'Jan.', 'Feb.', 'March', 'April', 'May', 'June',
    'July', 'Aug.', 'Sept.', 'Oct.', 'Nov.', 'Dec.',
  ],
  week: { dow: 0 },
});


const apiBases = {
  auth: '/auth/api/',
  budget: '/budget/api/',
  staff: '/staff/api/',
};

const standardSettings = {
  // NOTE: 'adminEmail' and 'apiEndpoints' both get overridden by Django.
  // They are included here in case anyone wants to use the frontend
  // without the complementary Django backend.
  adminEmail: 'ajvestal@dallasnews.com',

  apiEndpoints: generateEndpointsFromBases(apiBases),

  buttonHideWidth: 600,

  contentTypes: {
    text: {
      icon: 'fa fa-file-text-o',
      order: 1,
      usesLengthAttribute: true,
      usesPitchSystem: false,
      verboseName: 'Article',
    },
    photo: {
      icon: 'fa fa-picture-o',
      order: 2,
      usesLengthAttribute: false,
      usesPitchSystem: true,
      verboseName: 'Photo(s)',
    },
    video: {
      icon: 'fa fa-film',
      order: 3,
      usesLengthAttribute: false,
      usesPitchSystem: true,
      verboseName: 'Video',
    },
    audio: {
      icon: 'fa fa-volume-up',
      order: 4,
      usesLengthAttribute: false,
      usesPitchSystem: false,
      verboseName: 'Audio',
    },
    graphic: {
      icon: 'fa fa-line-chart',
      order: 5,
      usesLengthAttribute: false,
      usesPitchSystem: true,
      verboseName: 'Graphic',
    },
    interactive: {
      icon: 'fa fa-info-circle',
      order: 6,
      usesLengthAttribute: false,
      usesPitchSystem: false,
      verboseName: 'Interactive page',
    },
    aggregation: {
      icon: 'fa fa-sitemap fa-rotate-90',
      order: 7,
      usesLengthAttribute: true,
      usesPitchSystem: false,
      verboseName: 'Aggregation',
    },
    other: {
      icon: 'fa fa-asterisk',
      order: 8,
      usesLengthAttribute: false,
      usesPitchSystem: false,
      verboseName: 'Other content',
    },
  },

  datePickerOptions: {
    default: {
      titlebarFormat: 'ddd, MMM D',
      i18n: {
        previousMonth: 'Previous Month',
        nextMonth: 'Next Month',
        months: [
          'January',
          'February',
          'March',
          'April',
          'May',
          'June',
          'July',
          'August',
          'September',
          'October',
          'November',
          'December',
        ],
        weekdays: [
          'Sunday',
          'Monday',
          'Tuesday',
          'Wednesday',
          'Thursday',
          'Friday',
          'Saturday',
        ],
        weekdaysShort: ['S', 'M', 'T', 'W', 'T', 'F', 'S'],
      },
    },
    m: {},
    w: {
      titlebarFormat: '[Wk of] MMM D',
      pickWholeWeek: true,
      showDaysInNextAndPreviousMonths: true,
      beforeSelect: (ui, date) => {
        const dateIsSunday = (date.getDay() === 0) ? 'y' : 'n';

        const sundayDate = date.getDate() - date.getDay();
        const previousSunday = new Date(date.setDate(sundayDate));

        const datePicker = ui.pubDateField.data('datePicker');

        if (dateIsSunday !== 'y') { datePicker.setDate(previousSunday); }
      },
    },
    d: {},
    t: {},
  },
  // datePickerOptions: {
  //   default: {
  //     watchValueChange: true,
  //     singleMonth: true,
  //     customArrowNextSymbol: '<i class="fa fa-arrow-circle-right"></i>',
  //     customArrowPrevSymbol: '<i class="fa fa-arrow-circle-left"></i>',
  //     autoClose: true,
  //     customTopBar: ' ',
  //     format: 'YYYY-MM-DD',
  //   },
  //   m: {
  //     batchMode: 'month',
  //   },
  //   w: {
  //     batchMode: 'week',
  //   },
  //   d: {
  //     singleDate: true,
  //   },
  //   t: {
  //     singleDate: true,
  //   },
  // },

  dateGranularities: {
    m: {
      name: 'Month only',
      format: ['MMMM YYYY'],
      priority: 1,
      rounding: 'month',
      roundTo: 'end',
    },
    w: {
      name: 'Week only',
      format: ['[Week of] MMM D, YYYY'],
      priority: 2,
      rounding: 'week',
      roundTo: 'start',
    },
    d: {
      name: 'Day only',
      format: ['MMM D, YYYY'],
      priority: 3,
      rounding: 'day',
      roundTo: 'end',
    },
    t: {
      name: 'Day & time',
      format: ['MMM D, YYYY', 'h:mm a'],
      priority: 4,
      rounding: 'minute',
      roundTo: 'end',
    },
  },

  dateRangeShortcuts: {
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

  defaultDateRange: () => ({
    start: moment('2016-01-01', 'YYYY-MM-DD'),
    end: moment().add(18, 'months').endOf('month'),
  }),

  defaultTimezone: 'America/Chicago',  // Will also be overridden by Django.

  editDropdownOptions: {
    closeAfterSelect: true,
    openOnFocus: true,
    plugins: ['restore_on_backspace'],

    labelField: 'name',
    searchField: ['name'],
    valueField: 'value',

    onFocus() {
      if (!this.$control.parent().hasClass('input-focused')) {
        this.$control.parent().addClass('input-focused');
      }
    },
    onBlur() {
      if (this.$control.parent().hasClass('input-focused')) {
        this.$control.parent().removeClass('input-focused');
      }
    },

    onItemAdd() {},
    onItemRemove() {},
  },

  externalURLs: {},

  messages: {
    slugField: {
      ajaxError: 'Could not check if that slug is unique. Try again later.',
      defaultMessage: 'Enter a unique value.',
      nonUniqueError: 'That slug is already taken. Please choose something else.',
      successfullyUniqueValue: 'Your slug is unique.',
      tooShortError: 'Slugs must be four or more characters long.',
    },
  },

  moment,

  navigationLinks: generateNavigationLinks('/'),

  pollInterval: 15 * 60 * 1000,

  printPlacementTypes: [
    {
      verboseName: '1A',
      slug: '1a',
      order: 1,
    },
    {
      verboseName: 'Centerpiece',
      slug: 'centerpiece',
      order: 2,
    },
    {
      verboseName: 'Section cover',
      slug: 'section-cover',
      order: 3,
    },
    {
      verboseName: 'Inside pages',
      slug: 'inside-pages',
      order: 4,
    },
    {
      verboseName: 'Other',
      slug: 'other',
      order: 5,
    },
  ],

  timePickerOptions: {
    animation: 'fade',
    dropTrigger: true,
    format: 'h:mm a',
    showLancets: true,
    autoSwitch: false,
    handleShake: true,
  },

  typeRankingIndex: {
    person: 1,
    hub: 5,
    vertical: 9,
  },
};

const offlineSettings = {
  apiEndpoints: {
    headlineCandidate: '',
    hub: '/test-data/20160610/staff.api.hub.json',
    item: '',
    staffer: '/test-data/20160610/staff.api.staff.json',
    package: '/test-data/20160610/budget.packages/',
    printPublication: '',
  },

  apiPostfix: '.json',
};

// Return the standard and offline settings together if running under
// gulp with the '--offline' flag.
// Otherwise, just return the standard settings.
export default (dynamicConfig) => {
  const configLoaded = new jQuery.Deferred();

  if (_.has(dynamicConfig, 'configURL')) {
    const configRequest = jQuery.ajax({
      dataType: 'json',
      data: { origin: window.location.origin },
      url: dynamicConfig.configURL,
    });

    configRequest.done((data) => {
      if (_.has(data, 'apiBases')) {
        standardSettings.apiEndpoints = generateEndpointsFromBases(data.apiBases);
      }

      if (_.has(data, 'externalURLs')) {
        standardSettings.externalURLs = JSON.parse(data.externalURLs);
      }

      if (_.has(data, 'rootURL')) {
        const rootPrefix = (data.rootURL === null) ? '/' : data.rootURL;
        standardSettings.navigationLinks = generateNavigationLinks(rootPrefix);
      }

      _.chain(data)
        .omit('apiBases')
        .omit('externalURLs')
        .each((value, key) => { standardSettings[key] = value; });

      configLoaded.resolve(
        _.defaults(
            (window.isOffline === true) ? offlineSettings : {},
            standardSettings  // eslint-disable-line comma-dangle
        )  // eslint-disable-line comma-dangle
      );
    });

    configRequest.fail((resp, textStatus, errorThrown) => {
      configLoaded.fail(resp, textStatus, errorThrown);
    });
  } else {
    configLoaded.resolve(
      _.defaults(
          (window.isOffline === true) ? offlineSettings : {},
          standardSettings  // eslint-disable-line comma-dangle
      )  // eslint-disable-line comma-dangle
    );
  }

  return configLoaded;
};
