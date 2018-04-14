import _ from 'underscore';
import Backbone from 'backbone';
import jQuery from 'jquery';
import Mn from 'backbone.marionette';
import MDDateTimePicker from 'md-date-time-picker';


import deline from '../../../vendored/deline';
import MaterialDatePicker from '../../../common/material-datepicker';


const findNextTabStop = (el) => {
  const universe = document.querySelectorAll('input, button, select, textarea, a[href]');
  const list = Array.prototype.filter.call(universe, item => item.tabIndex >= '0');
  const index = list.indexOf(el);
  return list[index + 1] || list[0];
};

const findPreviousTabStop = (el) => {
  const universe = document.querySelectorAll('input, button, select, textarea, a[href]');
  const list = Array.prototype.filter.call(universe, item => item.tabIndex >= '0');
  const index = list.indexOf(el);
  return (index > 0)
    ? list[index - 1]
    : list[list.length - 1];
};


export default Mn.ItemView.extend({
  initialize() {
    this.radio = Backbone.Wreqr.radio.channel('global');
    this.moment = this.radio.reqres.request('getSetting', 'moment');
    this.defaultTimezone = this.radio.reqres.request('getSetting', 'defaultTimezone');

    this.ui = this.options.parentUI || {};
    this.uiElements = this.options.uiElements || {};

    this.extraContext = this.options.extraContext || {};
  },
  getBindings() {
    const bindings = {};

    const extraContext = this.extraContext;
    const model = this.model;
    const ui = this.ui;
    const uiElements = this.uiElements;

    bindings[uiElements.hubDropdown] = {
      observe: 'hub',
      observeErrors: 'hub',
      errorTranslations: {
        'This field is required.': 'Select a hub.',
      },
      initialize($el) {
        const hubOpts = {
          maxItems: 1,

          options: extraContext.hubChoices.options,
          optgroupField: 'type',

          optgroups: extraContext.hubChoices.optgroups,
          optgroupLabelField: 'name',
          optgroupValueField: 'value',

          render: {
            item: (dta) => {
              const dataType = (
                typeof dta.type !== 'undefined'
              ) ? dta.type : 'fullText';

              return deline`
              <div data-value="${dta.value}"
                   data-type="${dataType}"
                   class="selected-item">${dta.name}</div>`;
            },
          },
        };

        $el.selectize(_.defaults(
          hubOpts,
          // eslint-disable-next-line comma-dangle
          this.radio.reqres.request('getSetting', 'editDropdownOptions')
        ));
      },
      update($el, value) {
        if (_.isUndefined($el[0].selectize)) {
          $el.val(value);
        } else if (_.isObject($el[0].selectize)) {
          $el[0].selectize.setValue(value, true);
        }
      },
      getVal($el) {
        if ($el.val()) {
          return $el.val();
        }

        return null;
      },
    };

    bindings[uiElements.typeDropdown] = {
      observe: 'primaryContent.type',
      observeErrors: 'primaryContent.type',
      errorTranslations: {
        'This field may not be null.': 'Select a content type.',
      },
      initialize($el) {
        const typeOpts = {
          maxItems: 1,

          options: extraContext.typeChoices,

          render: {
            item: dta => deline`
                <div data-value="${dta.value}"
                     class="selected-item">${dta.name}</div>`,
          },
        };

        $el.selectize(_.defaults(
          typeOpts,
          // eslint-disable-next-line comma-dangle
          this.radio.reqres.request('getSetting', 'editDropdownOptions')
        ));
      },
      onGet: () => model.primaryContentItem.get('type'),
      update($el, value) {
        if (_.isUndefined($el[0].selectize)) {
          $el.val(value);
        } else if (_.isObject($el[0].selectize)) {
          $el[0].selectize.setValue(value, true);
        }
      },
      getVal($el) {
        if ($el.val()) {
          return $el.val();
        }

        return null;
      },
      set(attr, value) {
        model.primaryContentItem.set('type', value);
      },
    };

    bindings[uiElements.lengthGroup] = {
      observe: 'primaryContent.type',
      onGet: () => model.primaryContentItem.get('type'),
      update($el, value) {
        const field = $el.find('input');
        const contentTypes = this.radio.reqres.request('getSetting', 'contentTypes');

        if (value && contentTypes[value].usesLengthAttribute) {
          if (field.prop('disabled')) {
            field.prop('disabled', false);
          }
        } else if (!field.prop('disabled')) {
          field.prop('disabled', true);
        }
      },
      attributes: [
        {
          name: 'field-active',
          observe: 'primaryContent.type',
          onGet: () => {
            const val = model.primaryContentItem.get('type');
            const contentTypes = this.radio.reqres.request('getSetting', 'contentTypes');

            return (
              val && contentTypes[val].usesLengthAttribute
            ) ? 'true' : 'false';
          },
        },
      ],
    };

    bindings[uiElements.lengthField] = {
      observe: 'primaryContent.length',
      onGet: () => model.primaryContentItem.get('length'),
      getVal($el) { return ($el.val()) ? $el.val() : null; },
      set(attr, value) { model.primaryContentItem.set('length', value); },
    };

    bindings[uiElements.pitchLinkGroup] = {
      observe: 'primaryContent.type',
      onGet: () => model.primaryContentItem.get('type'),
      update() {},
      attributes: [
        {
          name: 'field-active',
          observe: 'primaryContent.type',
          onGet: () => {
            const val = model.primaryContentItem.get('type');
            const contentTypes = this.radio.reqres.request('getSetting', 'contentTypes');

            return (
              val &&
              contentTypes[val].usesPitchSystem
            ) ? 'true' : 'false';
          },
        },
      ],
    };

    bindings[uiElements.pubDateResolution] = {
      observe: 'publishDateResolution',
      observeErrors: 'publishDate',
      errorTranslations: {
        'Incorrect format. Expected an Array with two items.': '' +
                'Select a time format.',
      },
      initialize($el) {
        const resolutionOpts = {
          maxItems: 1,

          options: [
            { name: 'Month only', value: 'm' },
            { name: 'Week only', value: 'w' },
            { name: 'Day only', value: 'd' },
            { name: 'Day & time', value: 't' },
          ],

          render: {
            item(dta) {
              return deline`
                  <div data-value="${dta.value}"
                       class="selected-item">${dta.name}</div>`;
            },
          },
        };

        $el.selectize(_.defaults(
          resolutionOpts,
          // eslint-disable-next-line comma-dangle
          this.radio.reqres.request('getSetting', 'editDropdownOptions')
        ));
      },
      update($el, value) {
        if (_.isUndefined($el[0].selectize)) {
          $el.val(value);
        } else if (_.isObject($el[0].selectize)) {
          $el[0].selectize.setValue(value, true);
        }
      },
      getVal($el) { return ($el.val()) ? $el.val() : null; },
    };

    bindings[uiElements.pubDateGroup] = {
      observe: 'publishDateResolution',
      update: ($el, value) => {
        const newMode = _.contains(['m', 'w', 'd', 't'], value) ? value : '';

        const control = (
            _.has(ui.pubDateField.data(), 'datePicker')
        ) ? ui.pubDateField.data('datePicker') : null;

        if (!_.isNull(control)) {
          try {
            control.destroy();
          } catch (e) {
            if (e.message !== 'Already destroyed') {
              // eslint-disable-next-line no-console
              console.error(e.message);
            }
          }
        }

        if (newMode !== '') {
          const modeConfig = this.radio.reqres.request(
              'getSetting',
              'dateGranularities'  // eslint-disable-line comma-dangle
            )[value];

          /*  */
          /* Update the stored publication date to fit the current date mode. */
          /*  */
          let oldMode = (
            _.contains(['m', 'w', 'd', 't'], $el.attr('date-mode'))
          ) ? (
            $el.attr('date-mode')
          ) : (
            ''
          );
          const currentValue = ui.pubDateField.val();

          // Treat day-and-time mode as day mode for rounding purposes.
          if (oldMode === 't') { oldMode = 'd'; }

          let addCurrentDate = false;
          if ((currentValue !== '') && (oldMode !== '')) {
            const oldModeConfig = this.radio.reqres.request(
                'getSetting',
                'dateGranularities'  // eslint-disable-line comma-dangle
            )[oldMode];
            const initialDate = this.moment(currentValue, oldModeConfig.format[0]);

            if (initialDate.isValid()) {
              const roundedDate = (
                oldModeConfig.roundTo === 'end'
              ) ? (
                initialDate.clone().endOf(oldModeConfig.rounding)
              ) : (
                initialDate.clone().startOf(oldModeConfig.rounding)
              );

              // Now that we have our starting date, get the
              // beginning of the new mode's time period that
              // contains this date.
              const newStartFormatted = roundedDate
                        .clone()
                        .startOf(modeConfig.rounding)
                        .format(modeConfig.format[0]);

              ui.pubDateField.val(newStartFormatted);
              ui.pubDateField.trigger('changePublishDate');
            } else {
              addCurrentDate = true;
            }
          } else {
            addCurrentDate = true;
          }

          if (addCurrentDate === true) {
            const newStartFormatted = this.moment()
                        .startOf(modeConfig.rounding)
                        .format(modeConfig.format[0]);

            ui.pubDateField.val(newStartFormatted);
            ui.pubDateField.trigger('changePublishDate');
          }

          /*  */
          /* Construct the appropriate widget for the chosen date mode. */
          /*  */
          const datePicker = new MaterialDatePicker({
            modeConfig,
            mode: value,
            boundField: ui.pubDateField,
            overlayParent: document.body,
            onChangeEvent: 'changePublishDate',
          });

          ui.pubDateField.on('focus', () => { datePicker.picker.show(); });
          ui.pubDateField.on('blur', () => { datePicker.picker.hide(); });
        }

        $el.attr('date-mode', newMode);
      },
      attributes: [
        {
          name: 'field-active',
          observe: 'publishDateResolution',
          onGet(value) { return (!_.isNull(value)) ? 'true' : 'false'; },
        },
      ],
    };

    bindings[uiElements.pubDateField] = {
      observe: 'publishDate',
      events: ['changePublishDate'],
      update($el, value, mdl) {
        const mode = mdl.get('publishDateResolution');

        if (_.contains(['m', 'w', 'd', 't'], mode)) {
          const dateGranularities = this.radio.reqres.request(
            'getSetting',
            'dateGranularities'  // eslint-disable-line comma-dangle
          );
          // const datePicker = $el.data('datePicker');

          const currentDateFormat = dateGranularities[mode].format[0];

          const fmtDate = this.moment
            .tz(value[0], this.defaultTimezone)
            .format(currentDateFormat);

          $el.val(fmtDate);

          // datePicker.setMoment(this.moment(fmtDate, currentDateFormat));
        }
      },
      getVal($el) {
        if ($el.val() === '') { return [ui.pubDateResolution.val(), null]; }

        if (model.get('publishDateResolution') === 't') {
          return [
            ui.pubDateResolution.val(),
            [$el.val(), model.generateFormattedPublishDate()[1]].join(' '),
          ];
        }

        return [ui.pubDateResolution.val(), $el.val()];
      },
      set(attr, values) {
        model.updatePublishDate(...values);

        // Simulate slug keyword change to reset slug dates.
        model.trigger('change:slugKey');
      },
      attributes: [
        {
          name: 'disabled',
          observe: 'publishDateResolution',
          onGet: value => _.isNull(value),
        },
      ],
    };

    bindings[uiElements.pubTimeGroup] = {
      observe: 'publishDateResolution',
      update($el, value) {
        const newMode = _.contains(['m', 'w', 'd', 't'], value) ? value : '';

        const currentValue = ui.pubTimeField.val();

        // const control = (
        //   _.has(ui.pubTimeField.data(), 'TDEx')
        // ) ? ui.pubTimeField.data('TDEx') : null;
        //
        // if (!_.isNull(control)) {
        //   try {
        //     control.destroy();
        //   } catch (e) {
        //     if (e.message !== 'Already destroyed') {
        //       // eslint-disable-next-line no-console
        //       console.error(e.message);
        //     }
        //   }
        // }

        if (newMode === 't') {
          // Show time picker.
          const dateGranularities = this.radio.reqres.request(
            'getSetting',
            'dateGranularities' // eslint-disable-line comma-dangle
          );
          const modeConfig = dateGranularities[value];

          /*  */
          /* Check to see if there's a present, valid time value. */
          /*  */

          let addDefaultTime = false;
          if ((currentValue !== '')) {
            const initialTime = this.moment(currentValue, modeConfig.format[1]);

            if (initialTime.isValid()) {
              // Now that we have our starting time, get the
              // beginning of the time's minute.
              const newStartFormatted = initialTime
                      .clone()
                      .startOf(modeConfig.rounding)
                      .format(modeConfig.format[1]);

              ui.pubTimeField.val(newStartFormatted);
              ui.pubTimeField.trigger('changePublishTime');
            } else {
              addDefaultTime = true;
            }
          } else {
            addDefaultTime = true;
          }

          if (addDefaultTime === true) {
            const newStart = this.moment('12:00:00', 'HH:mm:ss');
            const newStartFormatted = newStart
                    .startOf(modeConfig.rounding)
                    .format(modeConfig.format[1]);

            ui.pubTimeField.val(newStartFormatted);
            ui.pubTimeField.trigger('changePublishTime');

            if (typeof this.timePicker !== 'undefined') {
              this.timePicker.time = newStart;
            }
          }
        } else if (
          (ui.pubTimeField.val() !== '')
        ) {
          ui.pubTimeField.val('');
        }

        $el.attr('time-mode', newMode);
      },
      attributes: [
        {
          name: 'field-active',
          observe: 'publishDateResolution',
          onGet(value) {
            return (value === 't') ? 'true' : 'false';
          },
        },
      ],
    };

    bindings[uiElements.pubTimeField] = {
      observe: 'publishDate',
      events: ['changePublishTime'],
      initialize($el, mdl) {
        const dateGranularities = this.radio.reqres.request(
          'getSetting',
          'dateGranularities'  // eslint-disable-line comma-dangle
        );

        const timeFormat = dateGranularities.t.format[1];

        this.timePicker = new MDDateTimePicker({
          type: 'time',
          trigger: $el[0],
          init: this.moment($el.val(), timeFormat),
          // mode: true,
          // inner24: true,
        });

        $el.on('keydown', (event) => {
          const keyCode = event.keyCode || event.which;

          if (keyCode === 9) {
            event.preventDefault();

            if (event.shiftKey) {
              this.timePicker.hide();
              $el.removeClass('picker-shown');
              findPreviousTabStop($el[0]).focus();
            } else {
              this.timePicker.hide();
              $el.removeClass('picker-shown');
              findNextTabStop($el[0]).focus();
            }
          }
        });

        $el.on('blur', (event) => {
          if ($el.hasClass('picker-shown')) {
            event.preventDefault();
          }
        });

        $el.on('focus', () => {
          if (!$el.hasClass('picker-shown')) {
            $el.addClass('picker-shown');

            const initialValue = this.moment($el.val(), timeFormat);

            this.timePicker.show();

            // Override default meridiem-setting, since the default behavior has
            // several logic issues. [Part 1 of 2]

            // eslint-disable-next-line no-underscore-dangle
            const sDialog = this.timePicker._sDialog;
            const hourEls = sDialog.hourView.querySelectorAll('span');
            const activeMClass = 'mddtp-picker__color--active';

            sDialog.AM.addEventListener('click', () => {
              $el.attr('meridiemOverride', 'a.m.');
              sDialog.AM.classList.add(activeMClass);
              sDialog.PM.classList.remove(activeMClass);
            });

            sDialog.PM.addEventListener('click', () => {
              $el.attr('meridiemOverride', 'p.m.');
              sDialog.AM.classList.remove(activeMClass);
              sDialog.PM.classList.add(activeMClass);
            });

            if (initialValue.format('a') === 'a.m.') {
              sDialog.AM.click();

              hourEls.forEach((el) => {
                el.setAttribute('isCorrected', 'false');

                el.addEventListener('click', () => {
                  if (el.getAttribute('isCorrected') !== 'true') {
                    el.setAttribute('isCorrected', 'true');

                    sDialog.AM.click();
                  }
                });
              });
            } else {
              sDialog.PM.click();

              hourEls.forEach((el) => {
                el.setAttribute('isCorrected', 'false');

                el.addEventListener('click', () => {
                  if (el.getAttribute('isCorrected') !== 'true') {
                    el.setAttribute('isCorrected', 'true');

                    sDialog.PM.click();
                  }
                });
              });
            }
          }
        });

        $el.on('onCancel', () => {
          $el.removeClass('picker-shown');
          findNextTabStop($el[0]).focus();
        });

        $el.on('onOk', () => {
          $el.removeClass('picker-shown');
          findNextTabStop($el[0]).focus();

          let newTimeString = this.timePicker.time.format(timeFormat);

          // Override default meridiem-setting, since the default behavior has
          // several logic issues. [Part 2 of 2]
          const meridiemOverride = $el.attr('meridiemOverride');
          if ((typeof meridiemOverride !== 'undefined') && (meridiemOverride !== false)) {
            if (newTimeString.indexOf(meridiemOverride) === -1) {
              const meridiemlessTime = (meridiemOverride === 'a.m.')
                ? newTimeString.replace(' p.m.', '')
                : newTimeString.replace(' a.m.', '');

              newTimeString = `${meridiemlessTime} ${meridiemOverride}`;
            }
          }

          $el.val(newTimeString);
          $el.trigger('changePublishTime');
        });
      },
      update($el, value, mdl) {
        const mode = mdl.get('publishDateResolution');

        const defaultTZ = this.radio.reqres
          .request('getSetting', 'defaultTimezone');

        const dateGranularities = this.radio.reqres.request(
          'getSetting',
          'dateGranularities'  // eslint-disable-line comma-dangle
        );

        if (mode === 't') {
          const newVal = this.moment.tz(value[0], defaultTZ)
            .format(dateGranularities[mode].format[1]);
          $el.val(newVal);
        }
      },
      getVal($el) {
        if (model.get('publishDateResolution') === 't') {
          if (
            (_.isUndefined(model.get('publishDate'))) ||
            (_.isEmpty(model.get('publishDate')))
          ) { return null; }

          return [
            ui.pubDateResolution.val(),
            [model.generateFormattedPublishDate()[0], $el.val()].join(' '),
          ];
        }

        return null;
      },
      set(attr, values) {
        model.updatePublishDate(...values);

        // Simulate slug keyword change to reset slug dates.
        model.trigger('change:slugKey');
      },
      attributes: [
        {
          name: 'disabled',
          observe: 'publishDateResolution',
          onGet(value) { return (value !== 't'); },
        },
      ],
    };

    bindings[uiElements.slugGroup] = {
      observe: [
        'hub',
        'slugKey',
        'publishDate',
      ],
      observeErrors: 'slugKey',
      errorTranslations: {
        'This field may not be blank.': 'Enter a slug keyword.',
        'Ensure this field has no more than 20 characters.': '' +
            'Use up to 20 characters for slug keywords.',
      },
      getErrorTextHolder($el) {
        return $el.closest('.form-group').find('.form-help');
      },
      initialize($el) {
        $el.on('recalculateSpacing', (event) => {
          const target = jQuery(event.currentTarget);
          const hubSlug = jQuery(event.currentTarget).find('.hub-slug-value');
          const formattedDate = target.find('.formatted-date-value');
          const inputPadding = {};

          inputPadding.left = hubSlug.width() + 5;
          inputPadding.right = formattedDate.width();

          ui.slugField.css({ left: -1 * inputPadding.left });
          ui.slugField.css({ 'padding-left': inputPadding.left });
          ui.slugField.css({ 'padding-right': inputPadding.right });
          ui.slugField.css({ width: $el.width() });
        });

        setTimeout(() => { $el.trigger('recalculateSpacing'); }, 0);
      },
      onGet: values => [
        values[0],
        model.get('slugKey'),
        values[2],
        values[3],
      ],
      update($el, value, mdl) {
        const hubSlug = $el.find('.hub-slug-value');
        const formattedDate = $el.find('.formatted-date-value');

        hubSlug.text(`${mdl.generateSlugHub()}.`);
        formattedDate.text(`.${mdl.generateSlugDate()}`);

        // TODO: Also bind 'recalculateSpacing' on browser resize.
        $el.trigger('recalculateSpacing');
      },
      getVal() {},
    };

    bindings[uiElements.slugField] = {
      observe: 'slugKey',
      initialize($el, mdl, options) {
        $el.attr('data-original-value', mdl.get(options.observe));

        $el.bind('focus', () => {
          $el.closest('.slug-group-holder').addClass('input-focused');
        });

        $el.bind('blur', () => {
          $el.closest('.slug-group-holder').removeClass('input-focused');
        });
      },
      onGet: () => model.get('slugKey'),
      set(attr, value) {
        model.set('slugKey', value);
        model.trigger('change:slugKey');
      },
    };

    bindings[uiElements.slugPlaceholder] = {
      observe: 'slugKey',
      onGet: () => model.get('slugKey'),
      update($el, value) {
        if (value !== '') {
          $el.text(value);
        } else {
          $el.text(ui.slugField.attr('placeholder'));
        }
      },
      getVal() {},
    };

    bindings[uiElements.budgetLineField] = {
      observe: 'primaryContent.budgetLine',
      observeErrors: 'primaryContent.budgetLine',
      errorTranslations: {
        'This field may not be blank.': 'Enter a budget line.',
      },
      initialize($el) {
        $el.closest('.expanding-holder').addClass('expanding-enabled');
        $el.bind('focus', () => {
          const budgetFieldHolder = $el.closest('.expanding-holder.expanding-enabled');
          budgetFieldHolder.addClass('input-focused');
        });
        $el.bind('blur', () => {
          const budgetFieldHolder = $el.closest('.expanding-holder.expanding-enabled');
          budgetFieldHolder.removeClass('input-focused');
        });
      },
      onGet: () => model.primaryContentItem.get('budgetLine'),
      update($el, value) {
        // Only update the textarea's value if it's not currently
        // focused, to prevent an instance where users can only
        // type one character at a time.
        if (!$el.is(':focus')) {
          $el.text(value);
        }
      },
      set(attr, value) {
        // Call set with {silent: true} and then explicitly call
        // the change trigger, so we're sure to re-set budget line
        // values on loss of focus as well as on keyboard inputs.
        model.primaryContentItem.set('budgetLine', value, { silent: true });
        model.trigger('change:primaryContent.budgetLine');
      },
    };

    bindings[uiElements.budgetLinePlaceholder] = {
      observe: 'primaryContent.budgetLine',
      onGet: () => model.primaryContentItem.get('budgetLine'),
      update($el, value) {
        if (value === '') {
          if ($el.closest('.expanding-holder').hasClass('has-value')) {
            $el.closest('.expanding-holder').removeClass('has-value');
          }
        } else if (!$el.closest('.expanding-holder').hasClass('has-value')) {
          $el.closest('.expanding-holder').addClass('has-value');
        }

        $el.text(value);
      },
      getVal() {},
    };

    bindings[uiElements.authorsDropdown] = {
      observe: 'primaryContent.authors',
      observeErrors: 'primaryContent.authors',
      errorTranslations: {
        'This field may not be empty.': '' +
                'Choose one or more authors.',
      },
      setOptions: { silent: true },
      initialize($el) {
        const authorOpts = {
          closeAfterSelect: false,
          plugins: ['remove_button', 'restore_on_backspace'],

          options: extraContext.stafferChoices,

          render: {
            item(dta) {
              return deline`
                  <div data-value="${dta.value}"
                       class="selected-item-multichoice">${dta.name}</div>`;
            },
          },
        };

        $el.selectize(_.defaults(
          authorOpts,
          // eslint-disable-next-line comma-dangle
          this.radio.reqres.request('getSetting', 'editDropdownOptions')
        ));
      },
      onGet: () => model.primaryContentItem.get('authors'),
      update($el, value) {
        if (_.isUndefined($el[0].selectize)) {
          $el.val(_(value).pluck('email').join(','));
        } else if (_.isObject($el[0].selectize)) {
          $el[0].selectize.clear(true);

          _(value).each((author) => { $el[0].selectize.addItem(author.email, true); });
        }
      },
      getVal($el) {
        const newAuthors = [];

        _($el.val().split(',')).each((authorKey) => {
          if (authorKey !== '') {
            newAuthors.push(
              // eslint-disable-next-line comma-dangle
              extraContext.stafferData.findWhere({ email: authorKey }).toJSON()
            );
          }
        });

        return newAuthors;
      },
      set(attr, value) {
        model.primaryContentItem.set('authors', value);
      },
    };

    bindings[uiElements.editorsDropdown] = {
      observe: 'primaryContent.editors',
      setOptions: { silent: true },
      initialize($el) {
        const editorOpts = {
          closeAfterSelect: false,
          plugins: ['remove_button', 'restore_on_backspace'],

          options: extraContext.stafferChoices,

          render: {
            item(dta, escape) {  // eslint-disable-line no-unused-vars
              return deline`
                  <div data-value="${dta.value}"
                       class="selected-item-multichoice">${dta.name}</div>`;
            },
          },
        };

        $el.selectize(_.defaults(
          editorOpts,
          // eslint-disable-next-line comma-dangle
          this.radio.reqres.request('getSetting', 'editDropdownOptions')
        ));
      },
      onGet: () => model.primaryContentItem.get('editors'),
      update($el, value) {
        if (_.isUndefined($el[0].selectize)) {
          $el.val(_(value).pluck('email').join(','));
        } else if (_.isObject($el[0].selectize)) {
          $el[0].selectize.clear(true);

          _(value).each((editor) => {
            $el[0].selectize.addItem(editor.email, true);
          });
        }
      },
      getVal($el) {
        const newEditors = [];

        _($el.val().split(',')).each((editorKey) => {
          if (editorKey !== '') {
            newEditors.push(
              extraContext.stafferData.findWhere({
                email: editorKey,
              }).toJSON()  // eslint-disable-line comma-dangle
            );
          }
        });

        return newEditors;
      },
      set(attr, value) {
        model.primaryContentItem.set('editors', value);
      },
    };

    return bindings;
  },
});
