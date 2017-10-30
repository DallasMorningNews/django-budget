import _ from 'underscore';
import Backbone from 'backbone';
import jQuery from 'jquery';
import Mn from 'backbone.marionette';
import 'daterange-picker-ex';

import deline from '../../../vendored/deline';

export default Mn.ItemView.extend({
  initialize() {
    this.radio = Backbone.Wreqr.radio.channel('global');

    this.callbacks = this.options.callbacks || {};

    this.extraContext = this.options.extraContext || {};

    this.destinations = this.extraContext.options.data.printPublications;

    this.config = {
      innerID: 'content-placement-modal',
      contentClassName: 'package-modal',
      escapeButtonCloses: false,
      overlayClosesOnClick: false,
      buttons: [
        // {
        //   buttonID: 'package-print-info-save-button',
        //   buttonClass: 'flat-button save-action ' +
        //                 'expand-past-button save-trigger',
        //   innerLabel: 'Save',
        //   clickCallback: (modalContext) => {
        //     // First, add animation classes to the modal:
        //     modalContext.$el.parent()
        //         .addClass('waiting')
        //         .addClass('save-waiting');
        //
        //     modalContext.$el.append(
        //       '<div class="loading-animation save-loading-animation">' +
        //           '<div class="loader">' +
        //               '<svg class="circular" viewBox="25 25 50 50">' +
        //                   '<circle class="path" cx="50" cy="50" r="20" ' +
        //                           'fill="none" stroke-width="2" ' +
        //                           'stroke-miterlimit="10"/>' +
        //               '</svg>' +
        //               '<i class="fa fa-cloud-upload fa-2x fa-fw"></i>' +
        //           '</div>' +
        //           '<p class="loading-text">Saving content...</p>' +
        //       '</div>'  // eslint-disable-line comma-dangle
        //     );
        //
        //     setTimeout(() => {
        //       modalContext.$el.find('.loading-animation')
        //                           .addClass('active');
        //     }, 600);
        //
        //     setTimeout(() => {
        //       modalContext.$el.find('.modal-inner')
        //           .css({ visibility: 'hidden' });
        //     }, 450);
        //
        //     setTimeout(() => {
        //       modalContext.$el.parent()
        //           .addClass('waiting')
        //           .addClass('save-waiting')
        //           .removeClass('waiting-transition')
        //           .removeClass('save-waiting-transition');
        //     }, 500);
        //
        //     // Then, execute the remote save:
        //     const packageSave = this.model.save(undefined, {
        //       xhrFields: {
        //         withCredentials: true,
        //       },
        //       deepLoad: false,
        //     });
        //
        //     packageSave.done(() => {
        //       setTimeout(() => {
        //         // Resume polling.
        //         this.callbacks.resumePolling();
        //
        //         this.callbacks.success();
        //       }, 1500);
        //     });
        //
        //     packageSave.fail(() => {
        //       setTimeout(() => {
        //         // Resume polling.
        //         this.callbacks.resumePolling();
        //
        //         this.callbacks.error();
        //       }, 1500);
        //     });
        //   },
        // },
        {
          buttonID: 'package-print-info-cancel-button',
          buttonClass: 'flat-button primary-action cancel-trigger',
          innerLabel: 'Cancel',
          clickCallback: () => {
            this.callbacks.close();
          },
        },
      ],
    };

    this.config.modalTitle = (
      _.isUndefined(this.model.id)
    ) ? (
      'Create content placement'
    ) : (
      'Edit content placement'
    );
  },

  extendConfig(configToAdd) {
    this.config = _.extend(this.config, configToAdd);
  },

  getConfig() {
    return this.config;
  },

  getFormRows() {
    const formRows = [
      {
        extraClasses: '',
        fields: [
          {
            type: 'input',
            extraClasses: 'publication-group',
            widthClasses: 'small-12 medium-12 large-12',
            labelText: 'Destination',
            inputID: 'destination',
            inputName: 'destination',
            inputType: 'text',
          },
        ],
      },
      {
        id: 'run_date_inputs',
        extraClasses: '',
        fields: [
          {
            type: 'input',
            widthClasses: 'small-6 medium-6 large-6',
            labelText: 'Run date (start)',
            inputID: 'run_date_start',
            inputName: 'run_date_start',
            inputType: 'text',
          },
          {
            type: 'input',
            widthClasses: 'small-6 medium-6 large-6',
            labelText: 'Run date (end)',
            inputID: 'run_date_end',
            inputName: 'run_date_end',
            inputType: 'text',
          },
        ],
      },
      {
        extraClasses: '',
        fields: [
          {
            type: 'div',
            widthClasses: 'small-12 medium-12 large-12',
            extraClasses: 'checkbox',
            inputID: 'placement_types',
          },
        ],
      },
      {
        extraClasses: '',
        fields: [
          {
            type: 'checkbox',
            extraClasses: 'additional-checkbox-group',
            widthClasses: 'small-12 medium-12 large-12',
            labelText: 'Is placement final?',
            inputID: 'is_finalized',
            inputName: 'is_finalized',
            inputValue: 'finalized',
          },
        ],
      },
    ];

    return formRows;
  },

  getBindings() {
    const bindings = {};

    bindings['#run_date_inputs'] = {
      observe: 'runDate',
      events: ['setRunDate'],
      initialize: ($el, mdl, opts) => {
        const startDateEl = $el.find('#run_date_start');
        const endDateEl = $el.find('#run_date_end');

        const datePickerHolder = jQuery('<div class="date-range-picker">');
        $el.parent().append(datePickerHolder);

        this.datePickerObj = $el.dateRangePicker({
          format: 'MMM D, YYYY',
          separator: ' to ',
          watchValueChange: true,
          container: datePickerHolder,
          getValue: () => {
            // const startDateEl = $el.find('#run_date_start');
            // const endDateEl = $el.find('#run_date_end');

            if (startDateEl.val() && endDateEl.val()) {
              return `${startDateEl.val()} to ${endDateEl.val()}`;
            }

            return '';
          },
          setValue: (s, s1, s2) => {
            startDateEl.val(s1[1]);
            endDateEl.val(s2[1]);

            $el.trigger(opts.events[0]);
          },
          customArrowNextSymbol: '<i class="fa fa-arrow-circle-right"></i>',
          customArrowPrevSymbol: '<i class="fa fa-arrow-circle-left"></i>',
          shortcuts: this.radio.reqres.request('getSetting', 'dateRangeShortcuts'),
        });
      },
      update: ($el, value, mdl) => {
        const startDateEl = $el.find('#run_date_start');
        const endDateEl = $el.find('#run_date_end');

        let startDateVal = '';
        let endDateVal = '';

        const moment = this.radio.reqres.request('getSetting', 'moment');

        if (
          (!_.isNull(mdl.get('runDate'))) &&
          (mdl.get('runDate').every(
            // eslint-disable-next-line comma-dangle
            dateStr => typeof dateStr === 'string'
          ))
        ) {
          startDateVal = moment(mdl.get('runDate')[0], 'YYYY-MM-DD')
              .clone()
              .format('MMM D, YYYY');

          endDateVal = moment(mdl.get('runDate')[1], 'YYYY-MM-DD')
              .clone()
              .subtract(1, 'days')
              .format('MMM D, YYYY');
        }

        startDateEl.val(startDateVal);
        endDateEl.val(endDateVal);
      },
      updateModel: val => (
        val.length === 2
      ) && (
        val.every(dateStr => typeof dateStr === 'string')
      ) && (
        val.every(dateStr => this.radio.reqres.request('getSetting', 'moment')(
            dateStr,
            'YYYY-MM-DD'  // eslint-disable-line comma-dangle
        ).isValid())
      ),
      getVal: ($el) => {
        const startDateEl = $el.find('#run_date_start');
        const endDateEl = $el.find('#run_date_end');

        const moment = this.radio.reqres.request('getSetting', 'moment');

        return [
          moment(startDateEl.val(), 'MMM D, YYYY')
            .format('YYYY-MM-DD'),
          moment(endDateEl.val(), 'MMM D, YYYY')
            .clone()
            .add(1, 'days')
            .format('YYYY-MM-DD'),
        ];
      },
    };

    const printSlugName = this.radio.reqres.request('getSetting', 'printSlugName');
    if (printSlugName !== null) {
      bindings['#print_system_slug'] = {
        observe: 'printSystemSlug',
      };
    }

    bindings['#destination'] = {
      observe: 'destination',
      initialize: ($el) => {
        const typeOpts = {
          maxItems: 1,
          options: this.extraContext.printPlacementChoices,
          render: {
            item: dta => deline`
                <div data-value="${dta.value}"
                      class="selected-item">${
                          dta.name
                      }</div>`,
          },
        };

        $el.selectize(_.defaults(
          typeOpts,
          // eslint-disable-next-line comma-dangle
          this.radio.reqres.request('getSetting', 'editDropdownOptions')
        ));
      },
      onGet: () => {
        if (_.isUndefined(this.model.id)) { return ''; }

        return this.destinations.findWhere({
          id: this.model.get('destination'),
        }).get('slug');
      },
      update: ($el, value) => {
        if (_.isUndefined($el[0].selectize)) {
          $el.val(value);
        } else if (_.isObject($el[0].selectize)) {
          $el[0].selectize.setValue(value, true);
        }

        this.activeDestination = value;
      },
      getVal: ($el) => {
        const newID = this.destinations.findWhere({ slug: $el.val() }).id;

        this.model.set('destination', newID, { silent: true });

        // Reset placement-types array when destination changes.
        this.model.set('placementTypes', [], { silent: true });

        return $el.val();
      },
      set: (attr, value) => {
        this.activeDestination = value;
        this.model.trigger('change:activeDestination');
      },
    };

    bindings['#placement_types'] = {
      observe: ['activeDestination', 'placementTypes'],
      onGet: values => [this.activeDestination, values[1]],
      update: ($el, values) => {
        const newDestination = values[0];
        const selectedValues = this.model.get('placementTypes');

        // Clear existing toggles.
        $el.empty();

        if (_.has(this.extraContext.printPublicationSections, newDestination)) {
          $el.show();

          $el.append('<h5>Placement types</h5>');

          _.each(
            this.extraContext.printPublicationSections[newDestination],
            (placement) => {
              const placementCheckbox = jQuery(deline`
                <label><input id="placement-type_${placement.id}"
                              name="placement_types"
                              data-form="package"
                              type="checkbox"
                              value="${
                                  placement.slug
                              }"><i class="helper"></i> ${
                                  placement.name
                              }</label>`  // eslint-disable-line comma-dangle
              );

              if (_.contains(selectedValues, placement.slug)) {
                placementCheckbox.find('input').prop('checked', true);
              }

              placementCheckbox.find('input').change((event) => {
                const thisEl = jQuery(event.currentTarget);
                const placementSlug = thisEl.val();

                const newPlacementsRaw = _.clone(this.model.get('placementTypes'));

                const newPlacements = (
                    thisEl.prop('checked')
                ) ? (
                    _.union(newPlacementsRaw, [placementSlug])
                ) : (
                    _.difference(newPlacementsRaw, [placementSlug])
                );

                // If 'placementTypes' is empty, apply these
                // changes silently.
                // That way, the selected publication won't
                // also be reset.
                this.model.set(
                    'placementTypes',
                    newPlacements,
                    // eslint-disable-next-line comma-dangle
                    (_.isEmpty(newPlacements)) ? { silent: true } : {}
                );
              });

              $el.append(placementCheckbox);
            }  // eslint-disable-line comma-dangle
          );
        } else {
          $el.hide();
        }
      },
    };

    bindings['#is_finalized'] = {
      observe: 'isFinalized',
      update: () => {},
      getVal: $el => $el.is(':checked'),
      attributes: [
        {
          name: 'checked',
          observe: 'isFinalized',
          onGet: (value) => {
            console.log(value);
            const hasValue = (_.isBoolean(value)) ? value : false;
            return hasValue;
          },
        },
      ],
    };

    return bindings;
  },
});
