import Backbone from 'backbone';
import Pikaday from 'pikaday';


const defaults = {};


export default class {
  constructor(opts) {
    this.overlay = null;
    this.picker = null;

    this.radio = Backbone.Wreqr.radio.channel('global');
    this.datePickerOptions = this.radio.reqres.request('getSetting', 'datePickerOptions');
    this.moment = this.radio.reqres.request('getSetting', 'moment');

    this.options = Object.assign({}, defaults, opts);

    this.boundField = this.options.boundField;
    this.modeConfig = opts.modeConfig;
    this.mode = opts.mode;
    this.overlayParent = this.options.overlayParent;

    this.init();
  }

  init() {
    this.config = Object.assign(this.getConfigDefaults(), this.generateConfig());

    this.picker = new Pikaday(this.config);

    this.boundField.data('datePicker', this.picker);

    this.picker.hide();

    this.createOverlay();
    this.attachPickerAndOverlay();
  }

  createOverlay() {
    this.overlay = document.createElement('div');
    this.overlay.classList.add('mdp-overlay');
  }

  attachPickerAndOverlay() {
    this.overlayParent.appendChild(this.overlay);

    this.overlay.appendChild(this.picker.el);

    this.overlayClickEvent = (e) => {
      if (!this.picker.el.contains(e.target)) {
        this.picker.config().hideEvent();
      }
    };

    this.overlay.addEventListener('click', this.overlayClickEvent);
  }

  destroy() {
    this.picker.removeEventListener('click', this.overlayClickEvent);
  }

  getConfigDefaults() {
    return Object.assign(this.datePickerOptions.default, this.datePickerOptions[this.mode]);
  }

  generateConfig() {
    return {
      // field: this.boundField[0],
      bound: false,
      format: this.modeConfig.format[0],
      drawTop: (picker) => {
        const currDate = picker.getMoment();
        const lendarEl = picker.el.querySelector('.pika-lendar');

        const titlebarFormat = picker.config().titlebarFormat;

        lendarEl.setAttribute('data-selected-date', currDate.format(titlebarFormat));
        lendarEl.setAttribute('data-selected-year', currDate.format('Y'));
      },
      drawButtons: (picker) => {
        const lendarEl = picker.el.querySelector('.pika-lendar');
        const actionsEl = document.createElement('div');

        actionsEl.classList.add('datepicker-actions');

        actionsEl.innerHTML = [
          '<span class="right-side-buttons">',
          '    <button type="button" class="today-action">Today</button>',
          '</span>',
          '<span class="right-side-buttons">',
          '    <button type="button" class="cancel-action">Cancel</button>',
          '    <button type="button" class="ok-action">OK</button>',
          '</span>',
        ].join('');

        actionsEl.querySelector('.cancel-action')
          .addEventListener('click', picker.config().hideEvent);

        actionsEl.querySelector('.ok-action')
          .addEventListener('click', picker.config().submitEvent);

        lendarEl.appendChild(actionsEl);
      },
      submitEvent: () => {
        const currentDateFormat = this.modeConfig.format[0];

        this.boundField.val(this.picker.getMoment().format(currentDateFormat));
        this.picker.hide();
        if (this.overlay !== null) this.overlay.classList.remove('shown');

        this.boundField.trigger(this.options.onChangeEvent);
      },
      hideEvent: () => {
        if (this.picker !== null) this.picker.hide();
      },
      keydownFn: (event) => {
        if (event.keyCode !== 9) event.preventDefault();

        if (this.picker !== null) {
          if (event.keyCode === 13) { // Enter key.
            this.picker.config().submitEvent();
          }

          if ([9, 27].includes(event.keyCode)) { // Tab, escape key.
            this.picker.config().hideEvent();
          }
        }
      },
      onOpen: () => {
        const currentDateFormat = this.modeConfig.format[0];
        const currentMoment = this.moment(this.boundField.val(), currentDateFormat);

        if (this.picker !== null) {
          if (!this.picker.getMoment().isSame(currentMoment)) {
            this.picker.setMoment(currentMoment);
          } else {
            this.picker.gotoDate(currentMoment.toDate());
          }

          window.addEventListener('keydown', this.picker.config().keydownFn);
        }

        if (this.overlay !== null) this.overlay.classList.add('shown');
      },
      onDraw: (picker) => {
        picker.config().drawTop(picker);
        picker.config().drawButtons(picker);
      },
      onSelect: (date) => {
        if (typeof this.datePickerOptions[this.mode].beforeSelect !== 'undefined') {
          this.datePickerOptions[this.mode].beforeSelect(date);
        }
      },
      onClose: () => {
        if (this.overlay !== null) this.overlay.classList.remove('shown');

        if (this.picker !== null) {
          const actionsEl = this.picker.el.querySelector('.datepicker-actions');

          actionsEl.querySelector('.cancel-action')
            .removeEventListener('click', this.picker.config().hideEvent);

          actionsEl.querySelector('.ok-action')
            .removeEventListener('click', this.picker.config().submitEvent);

          window.removeEventListener('keydown', this.picker.config().keydownFn);
        }
      },
    };
  }
}
