import 'uglydate';


const defaults = {
  dayClasses: {
    all: 'js-uglydate-day',
    startDay: 'js-uglydate-is-selected-start-day',
    endDay: 'js-uglydate-is-selected-end-day',
    selectedDay: 'js-uglydate-is-selected-day',
    withinRange: 'js-uglydate-is-day-within-range',
  },
  additionalClicksDisabled: [],
};


export default class {
  constructor(opts) {
    this.config = Object.assign({}, defaults, opts);

    this.events = {
      handleOpen: this.handleOpen.bind(this),
      handleClose: this.handleClose.bind(this),
      handleChange: this.handleChange.bind(this),

      handleClickWhenOpen: this.handleClickWhenOpen.bind(this),
      handleKeydownWhenOpen: this.handleKeydownWhenOpen.bind(this),
    };

    this.minAllowedDate = this.config.allowedRange.start.format('YYYY-MM-DD');
    this.maxAllowedDate = this.config.allowedRange.end.format('YYYY-MM-DD');

    this.uglyGroups = {
      start: document.querySelector(this.config.startDateSelector),
      end: document.querySelector(this.config.endDateSelector),
    };

    this.uglyInputs = {
      start: this.uglyGroups.start.getElementsByTagName('input')[0],
      end: this.uglyGroups.end.getElementsByTagName('input')[0],
    };

    this.uglyInputs.start.setAttribute('min', this.minAllowedDate);
    this.uglyInputs.end.setAttribute('min', this.minAllowedDate);

    this.uglyInputs.start.setAttribute('max', this.maxAllowedDate);
    this.uglyInputs.end.setAttribute('max', this.maxAllowedDate);

    const initValues = this.config.getValues();

    this.uglyInputs.start.value = initValues.start.clone().format('YYYY-MM-DD');
    this.uglyInputs.end.value = initValues.end.clone().format('YYYY-MM-DD');

    this.initialize();
  }

  initialize() {
    this.uglyPicker = new window.UglyDate({
      selector: this.config.selector,
      startDateSelector: this.config.startDateSelector,
      endDateSelector: this.config.endDateSelector,
    });

    this.outerElement = this.uglyPicker.dateSelectors[0].element;

    this.dayEls = this.outerElement.getElementsByClassName(this.config.dayClasses.all);

    this.uglyPicker.addEventListener('open', this.events.handleOpen);

    this.uglyPicker.addEventListener('change', this.events.handleChange);

    this.uglyPicker.addEventListener('close', this.events.handleClose);
  }

  destroy() {
    this.uglyPicker.removeEventListener('open', this.events.handleOpen);
    this.uglyPicker.removeEventListener('change', this.events.handleChange);
    this.uglyPicker.removeEventListener('close', this.events.handleClose);
  }

  clearExistingDayHighlights() {
    const klassMap = this.config.dayClasses;
    const outerElement = this.uglyPicker.dateSelectors[0].element;

    Object.keys(klassMap).forEach((klassType) => {
      if (klassType !== 'all') {
        const klassValue = klassMap[klassType];
        const klassMatch = `${klassMap.all} ${klassValue}`;
        const elsWithKlass = outerElement.getElementsByClassName(klassMatch);

        Array.from(elsWithKlass).forEach(el => el.classList.remove(klassValue));
      }
    });
  }

  drawDayHighlights() {
    const initValues = this.config.getValues();

    const startDate = initValues.start.clone();
    const endDate = initValues.end.clone();

    const monthsDiff = startDate.clone().startOf('month').diff(this.minAllowedDate, 'months');

    if (monthsDiff >= 0) {
      this.uglyPicker.dateSelectors[0].calendar.updateVisibleMonths(monthsDiff + 1);
    }

    const dayTypes = {
      start: [
        this.config.dayClasses.startDay,
        this.config.dayClasses.selectedDay,
        this.config.dayClasses.withinRange,
      ],
      mid: [this.config.dayClasses.withinRange],
      end: [
        this.config.dayClasses.endDay,
        this.config.dayClasses.selectedDay,
        this.config.dayClasses.withinRange,
      ],
    };

    const daysBetween = endDate.diff(startDate, 'days') - 1;

    const daysToMark = [
      { dayFmt: startDate.format('MMMM D, YYYY'), classes: dayTypes.start },
      { dayFmt: endDate.format('MMMM D, YYYY'), classes: dayTypes.end },
    ];

    if (daysBetween >= 0) {
      // Put this in a conditional so it doesn't fail when 'daysBetween' is
      // -1 (i.e., when start and end date are the same).
      [...Array(daysBetween).keys()].map((k, i) =>
        startDate.clone().add(i + 1, 'days').format('MMMM D, YYYY'))
        .forEach((dayFmt) => { daysToMark.push({ dayFmt, classes: dayTypes.mid }); });
    }

    daysToMark.forEach((dayConfig) => {
      const outerElement = this.uglyPicker.dateSelectors[0].element;
      const cellsForDay = Array.from(outerElement
        .querySelectorAll(`[aria-label="${dayConfig.dayFmt}"]`))
        .filter(el => !el.classList.contains('js-uglydate-is-disabled-date'));

      cellsForDay.forEach((el) => {
        dayConfig.classes.forEach((klass) => { el.classList.add(klass); });
      });
    });
  }

  show() {
    this.uglyPicker.dateSelectors[0].calendar.open();
  }

  hide() {
    this.uglyPicker.dateSelectors[0].calendar.close();
  }

  handleOpen() {
    document.body.addEventListener('click', this.events.handleClickWhenOpen);
    document.body.addEventListener('keydown', this.events.handleKeydownWhenOpen);

    this.drawDayHighlights();
  }

  handleChange(event) {
    if (this.config.onSelect) this.config.onSelect(event);
  }

  handleClose() {
    document.body.removeEventListener('click', this.events.handleClickWhenOpen);
    document.body.removeEventListener('keydown', this.events.handleKeydownWhenOpen);

    setTimeout(() => { this.clearExistingDayHighlights(); }, 120);
  }

  handleClickWhenOpen(event) {
    const target = event.target || event.srcElement;

    const clickInCalendar = this.uglyPicker.dateSelectors[0].calendar.element.contains(target);
    const clickOtherwiseDisabled = this.config.additionalClicksDisabled
      .map(selector => document.querySelector(selector).contains(target))
      .some(i => i === true);

    if (!clickInCalendar && !clickOtherwiseDisabled) { this.hide(); }
  }

  handleKeydownWhenOpen(event) {
    if ([9, 27].includes(event.keyCode)) { this.hide(); }
  }
}
