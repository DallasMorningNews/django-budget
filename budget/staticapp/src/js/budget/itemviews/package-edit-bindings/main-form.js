import _ from 'underscore';
import Backbone from 'backbone';
import jQuery from 'jquery';
import Mn from 'backbone.marionette';

import deline from '../../../vendored/deline';

export default Mn.ItemView.extend({
  initialize() {
    this.radio = Backbone.Wreqr.radio.channel('global');

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
            _.has(ui.pubDateField.data(), 'DRPEx')
        ) ? ui.pubDateField.data('DRPEx') : null;

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

          const moment = this.radio.reqres.request('getSetting', 'moment');

          let addCurrentDate = false;
          if ((currentValue !== '') && (oldMode !== '')) {
            const oldModeConfig = this.radio.reqres.request(
                'getSetting',
                'dateGranularities'  // eslint-disable-line comma-dangle
            )[oldMode];
            const initialDate = moment(currentValue, oldModeConfig.format[0]);

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
            const newStartFormatted = moment()
                        .startOf(modeConfig.rounding)
                        .format(modeConfig.format[0]);

            ui.pubDateField.val(newStartFormatted);
            ui.pubDateField.trigger('changePublishDate');
          }

          /*  */
          /* Construct the appropriate widget for the chosen date mode. */
          /*  */
          const datePickerOptions = this.radio.reqres.request(
            'getSetting',
            'datePickerOptions'  // eslint-disable-line comma-dangle
          );
          const singleDateMode = (
            _.has(datePickerOptions[value], 'singleDate')
          ) && (
            datePickerOptions[value].singleDate === true
          );

          ui.pubDateField.dateRangePicker(
            _.defaults(
              {
                getValue: () => {
                  if (ui.pubDateField.val()) {
                    const startDate = moment(
                      ui.pubDateField.val(),
                      modeConfig.format[0]  // eslint-disable-line comma-dangle
                    );

                    const fmtStart = startDate.format('YYYY-MM-DD');

                    if (singleDateMode === true) {
                      return fmtStart;
                    }

                    const fmtEnd = startDate
                                    .clone()
                                    .endOf(modeConfig.rounding)
                                    .format('YYYY-MM-DD');

                    return `${fmtStart} to ${fmtEnd}`;
                  }

                  return '';
                },
                setValue: (formattedValue) => {
                  const startDate = moment(
                    formattedValue.split('to')[0].trim(),
                    'YYYY-MM-DD'  // eslint-disable-line comma-dangle
                  );

                  ui.pubDateField.val(startDate.format(modeConfig.format[0]));

                  ui.pubDateField.trigger('changePublishDate');
                },
              },
              datePickerOptions[value],
              datePickerOptions.default  // eslint-disable-line comma-dangle
            )  // eslint-disable-line comma-dangle
          );
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
          const moment = this.radio.reqres.request('getSetting', 'moment');
          const dateGranularities = this.radio.reqres.request(
            'getSetting',
            'dateGranularities'  // eslint-disable-line comma-dangle
          );
          const defaultTimezone = this.radio.reqres.request(
            'getSetting',
            'defaultTimezone'  // eslint-disable-line comma-dangle
          );
          $el.val(
            moment.tz(value[0], defaultTimezone)
              // eslint-disable-next-line comma-dangle
              .format(dateGranularities[mode].format[0])
          );
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

        const control = (
          _.has(ui.pubTimeField.data(), 'TDEx')
        ) ? ui.pubTimeField.data('TDEx') : null;

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

        if (newMode === 't') {
          // Show time picker.
          const dateGranularities = this.radio.reqres.request(
            'getSetting',
            'dateGranularities' // eslint-disable-line comma-dangle
          );
          const modeConfig = dateGranularities[value];

          const moment = this.radio.reqres.request('getSetting', 'moment');

          /*  */
          /* Check to see if there's a present, valid time value. */
          /*  */

          let addDefaultTime = false;
          if ((currentValue !== '')) {
            const initialTime = moment(currentValue, modeConfig.format[1]);

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
            const newStartFormatted = moment('12:00:00', 'HH:mm:ss')
                    .startOf(modeConfig.rounding)
                    .format(modeConfig.format[1]);

            ui.pubTimeField.val(newStartFormatted);
            ui.pubTimeField.trigger('changePublishTime');
          }

          /*  */
          /* Construct the appropriate widget for the chosen date mode. */
          /*  */
          ui.pubTimeField.timeDropper(
            _.defaults(
              {
                fetchTime: () => {
                  const localizedDate = moment(ui.pubTimeField.val(), 'h:mm a');
                  return localizedDate.locale('en').format('h:mm a');
                },
                putTime: (s) => {
                  const formattedTime = moment(s, 'h:mm a', 'en')
                          .locale('en-us-apstyle').format('h:mm a');

                  if (formattedTime !== ui.pubTimeField.val()) {
                    ui.pubTimeField.val(formattedTime).change();

                    // $el.trigger(opts.events[0]);
                    ui.pubTimeField.trigger('changePublishTime');
                  }
                },
              },
              // eslint-disable-next-line comma-dangle
              this.radio.reqres.request('getSetting', 'timePickerOptions')
            )  // eslint-disable-line comma-dangle
          );
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
      update($el, value, mdl) {
        const mode = mdl.get('publishDateResolution');

        const moment = this.radio.reqres.request('getSetting', 'moment');
        const dateGranularities = this.radio.reqres.request(
          'getSetting',
          'dateGranularities'  // eslint-disable-line comma-dangle
        );
        const defaultTimezone = this.radio.reqres.request(
          'getSetting',
          'defaultTimezone'  // eslint-disable-line comma-dangle
        );

        if (mode === 't') {
          $el.val(
              moment.tz(value[0], defaultTimezone)
                  // eslint-disable-next-line comma-dangle
                  .format(dateGranularities[mode].format[1])
          );
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
