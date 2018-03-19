import _ from 'underscore';
import Backbone from 'backbone';
import jQuery from 'jquery';
import Mn from 'backbone.marionette';


import deline from '../../../vendored/deline';
import UglyDateRangePicker from '../../../common/ugly-daterange-picker';


const uiElements = {
  destination: '#destination',
  runDateInputs: '#run_date_inputs',
  runDateStart: '#run_date_start',
  runDateEnd: '#run_date_end',
  externalSlug: '#external_slug',
  placementTypes: '#placement_types',
  pageNumber: '#page_number',
  placementDetails: '#placement_details',
  isFinalized: '#is_finalized',
};


export default Mn.ItemView.extend({
  ui: uiElements,

  initialize() {
    this.radio = Backbone.Wreqr.radio.channel('global');

    this.callbacks = this.options.callbacks || {};

    this.extraContext = this.options.extraContext || {};

    this.moment = this.radio.reqres.request('getSetting', 'moment');

    this.config = {
      innerID: 'content-placement-modal',
      contentClassName: 'package-modal',
      escapeButtonCloses: false,
      overlayClosesOnClick: false,
      buttons: [
        {
          buttonID: 'content-placement-save-button',
          buttonClass: 'flat-button save-action ' +
                        'expand-past-button save-trigger',
          innerLabel: 'Save',
          clickCallback: (modalContext) => {
            const validation = this.runValidation();

            validation.done(() => {
              this.clearErrorClasses();
              this.initiateSave(modalContext);
            });

            validation.fail((formErrors) => {
              this.clearErrorClasses();

              _.keys(formErrors.errors).forEach((errorField) => {
                const currentFieldGroup = (
                  this.ui[errorField].hasClass('.form-element')
                ) ? (
                  this.ui[errorField]
                ) : (
                  this.ui[errorField].closest('.form-element')
                );

                currentFieldGroup.addClass('has-error');
                currentFieldGroup.find('.form-help').text(formErrors.errors[errorField]);
              });
            });
          },
        },
        {
          buttonID: 'package-print-info-cancel-button',
          buttonClass: 'flat-button primary-action cancel-trigger',
          innerLabel: 'Cancel',
          clickCallback: () => {
            this.callbacks.close();
          },
        },
        {
          buttonID: 'package-placement-delete-button',
          buttonClass: 'flat-button delete-action delete-trigger',
          innerLabel: 'Delete',
          clickCallback: () => {
            this.callbacks.delete();
          },
          hidden: this.isDeleteButtonHidden(),
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

    this.config.extraModalHTML = deline`
      <div class="ugly-date-picker" data-uglydate-large-screen-width="585">
          <div class="search-dates-start-holder">
              <input type="date" name="start-date" placeholder="Select A Date" />
          </div>

          <div class="search-dates-end-holder">
              <input type="date" name="end-date" placeholder="Select A Date" />
          </div>
      </div>
      `;
  },

  extendConfig(configToAdd) {
    this.config = _.extend(this.config, configToAdd);
  },

  getConfig() {
    return this.config;
  },

  getFormRows() {
    const formRows = [];

    formRows.push({
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
    });

    formRows.push({
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
    });

    const printSlugName = this.radio.reqres.request('getSetting', 'printSlugName');
    if (printSlugName !== null) {
      formRows.push({
        extraClasses: '',
        fields: [
          {
            type: 'input',
            widthClasses: 'small-12 medium-12 large-12',
            labelText: printSlugName,
            inputID: 'external_slug',
            inputName: 'external_slug',
            inputType: 'text',
          },
        ],
      });
    }

    formRows.push({
      extraClasses: '',
      fields: [
        {
          type: 'div',
          widthClasses: 'small-12 medium-12 large-12',
          extraClasses: 'checkbox',
          inputID: 'placement_types',
        },
      ],
    });

    formRows.push({
      id: 'placement_info',
      extraClasses: '',
      fields: [
        {
          type: 'input',
          widthClasses: 'small-6 medium-6 large-6',
          labelText: 'Page number',
          inputID: 'page_number',
          inputName: 'page_number',
          inputType: 'number',
        },
        {
          type: 'input',
          widthClasses: 'small-6 medium-6 large-6',
          labelText: 'Placement details',
          inputID: 'placement_details',
          inputName: 'placement_details',
          inputType: 'text',
        },
      ],
    });

    formRows.push({
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
    });

    return formRows;
  },

  getBindings() {
    const bindings = {};

    bindings[uiElements.runDateInputs] = {
      observe: 'runDate',
      events: ['setRunDate'],
      initialize: ($el, mdl, opts) => {
        const startDateEl = $el.find('#run_date_start');
        const endDateEl = $el.find('#run_date_end');

        const defaultRange = this.radio.reqres.request('getSetting', 'defaultDateRange');

        setTimeout(() => {
          this.rangePicker = new UglyDateRangePicker({
            selector: '.ugly-date-picker',
            startDateSelector: '.search-dates-start-holder',
            endDateSelector: '.search-dates-end-holder',
            additionalClicksDisabled: ['#run_date_inputs'],
            allowedRange: defaultRange(),
            getValues: () => {
              const range = mdl.get('runDate').map(i => this.moment(i, 'YYYY-MM-DD'));
              return { start: range[0], end: range[1].clone().subtract(1, 'days') };
            },
            onSelect: (event) => {
              const startMoment = this.moment(event.startDate);
              const endMoment = this.moment(event.endDate);

              const displayFmt = 'MMM D, YYYY';

              startDateEl.val(startMoment.format(displayFmt));
              endDateEl.val(endMoment.format(displayFmt));

              $el.trigger(opts.events[0]);
            },
          });

          startDateEl.on('focus', () => { this.rangePicker.show(); });

          endDateEl.on('focus', () => { this.rangePicker.show(); });
        }, 20);
      },
      update: ($el, value, mdl) => {
        const startDateEl = $el.find('#run_date_start');
        const endDateEl = $el.find('#run_date_end');

        let startDateVal = '';
        let endDateVal = '';

        if (
          (!_.isNull(mdl.get('runDate'))) &&
          (mdl.get('runDate').every(dateStr => typeof dateStr === 'string'))
        ) {
          startDateVal = this.moment(mdl.get('runDate')[0], 'YYYY-MM-DD')
              .clone()
              .format('MMM D, YYYY');

          endDateVal = this.moment(mdl.get('runDate')[1], 'YYYY-MM-DD')
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
        val.every((dateStr) => {
          return this.moment(dateStr, 'YYYY-MM-DD').isValid();
        })
      ),
      getVal: ($el) => {
        const startDateEl = $el.find('#run_date_start');
        const endDateEl = $el.find('#run_date_end');

        return [
          this.moment(startDateEl.val(), 'MMM D, YYYY')
            .format('YYYY-MM-DD'),
          this.moment(endDateEl.val(), 'MMM D, YYYY')
            .clone()
            .add(1, 'days')
            .format('YYYY-MM-DD'),
        ];
      },
    };

    bindings[uiElements.destination] = {
      observe: 'destination',
      initialize: ($el) => {
        const typeOpts = {
          maxItems: 1,
          options: this.extraContext.destinations,
          render: {
            item: dta => deline`
                <div data-value="${dta.value}"
                      class="selected-item">${
                          dta.name
                      }</div>`,
          },
        };

        const dropdownOptions = this.radio.reqres
                .request('getSetting', 'editDropdownOptions');
        $el.selectize(_.defaults(typeOpts, dropdownOptions));
      },
      onGet: () => {
        // if (_.isUndefined(this.model.id)) { return ''; }

        if (!this.model.has('destination')) {
          const sortedDestinations = this.extraContext.destinationModels.sortBy('priority');

          // If no destination has been specified on the bound model, choose
          // one (in a deterministic manner) and apply it.
          const defaultDestination = (
            sortedDestinations.length > 0
          ) ? (
            sortedDestinations[0].id
          ) : (
            0
          );

          if (defaultDestination === 0) {
            console.error('ERROR: Please create a destination to save placements.');
          } else {
            this.model.set('destination', defaultDestination);
          }
        }

        const match = this.extraContext.destinationModels.findWhere({
          id: this.model.get('destination'),
        }).get('slug');

        return match;
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
        if (!_.isEmpty($el.val())) {
          const newID = this.extraContext.destinationModels.findWhere({
            slug: $el.val(),
          }).id;

          this.model.set('destination', newID, { silent: true });
        }

        // Reset placement-types array when destination changes.
        this.model.set('placementTypes', [], { silent: true });

        return ($el.val()) ? $el.val() : null;
      },
      set: (attr, value) => {
        this.activeDestination = value;
        this.model.trigger('change:activeDestination');
      },
    };

    bindings[uiElements.placementTypes] = {
      observe: ['activeDestination', 'placementTypes'],
      onGet: values => [this.activeDestination, values[1]],
      update: ($el, values) => {
        const newDestination = values[0];
        const selectedValues = this.model.get('placementTypes');

        const destinationPlacements = this.extraContext.destinationPlacements;

        // Clear existing toggles.
        $el.empty();

        if (_.has(destinationPlacements, newDestination)) {
          $el.show();

          $el.append('<h5>Placement types</h5>');

          _.each(destinationPlacements[newDestination], (placement) => {
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

            placementCheckbox.find('input').change(() => {
              const activePlacements = Array.from($el.find('input:checked'))
                                                .map(i => i.value);

              // If 'activePlacements' is empty, apply these changes silently.
              // That way, the selected destination won't also be reset.
              this.model.unset('placementTypes');

              const placementTypeOpts = (
                _.isEmpty(activePlacements)
              ) ? (
                { silent: true }
              ) : (
                {}
              );
              this.model.set('placementTypes', activePlacements, placementTypeOpts);
            });

            $el.append(placementCheckbox);
          });

          $el.append('<div class="form-help"></div>');
        } else {
          $el.hide();
        }
      },
    };

    const printSlugName = this.radio.reqres.request('getSetting', 'printSlugName');
    if (printSlugName !== null) {
      bindings[uiElements.externalSlug] = {
        observe: 'externalSlug',
      };
    }

    bindings[uiElements.pageNumber] = {
      observe: 'pageNumber',
      getVal: ($el) => {
        const correctedValue = (
          $el.val() !== ''
        ) ? (
          parseInt($el.val(), 10)
        ) : (
          null
        );
        return correctedValue;
      },
    };

    bindings[uiElements.placementDetails] = {
      observe: 'placementDetails',
    };

    bindings[uiElements.isFinalized] = {
      observe: 'isFinalized',
      update: () => {},
      getVal: $el => $el.is(':checked'),
      attributes: [
        {
          name: 'checked',
          observe: 'isFinalized',
          onGet: (value) => {
            const hasValue = (_.isBoolean(value)) ? value : false;
            return hasValue;
          },
        },
      ],
    };

    return bindings;
  },

  isDeleteButtonHidden() {
    return Object.keys(this.callbacks).indexOf('delete') === -1;
  },

  runValidation() {  // Originally named validate, which is a reserved name.
    const validationPromise = new jQuery.Deferred();

    const modelIsValid = this.model.runValidation();

    const formErrors = {};

    modelIsValid.done(() => {
      if (this.ui.destination.val() === '') {
        formErrors.destination = 'This field cannot be blank.';
      }

      if (_.isEmpty(formErrors)) {
        validationPromise.resolve();
      } else {
        validationPromise.reject({ failType: 'form', errors: formErrors });
      }
    });

    modelIsValid.fail((modelErrors) => {
      const blankPlacementMessage = 'Please select at least one placement type.';

      if (
        _.has(modelErrors, 'placementTypes') &&
        (modelErrors.placementTypes === blankPlacementMessage)
      ) {
        const rawDestination = this.model.get('destination');
        const destination = this.extraContext.destinationModels.get(rawDestination);
        const destinationSlug = destination.get('slug');
        const placementsByDestination = this.extraContext.destinationPlacements;

        if (
          (
            (_.has(placementsByDestination, destinationSlug)) &&
            (placementsByDestination[destinationSlug].length === 0)
          ) || (
            (!_.has(placementsByDestination, destinationSlug))
          )
        ) {
          validationPromise.reject({
            failType: 'form',
            errors: Object.assign({}, _.omit(modelErrors, 'placementTypes'), {
              destination: 'Please select a destination with at least one placement type.',
            }),
          });
        } else if (this.ui.destination.val() === '') {
          formErrors.destination = 'This field cannot be blank.';
          validationPromise.reject({ failType: 'form', errors: formErrors });
        } else {
          validationPromise.reject({ failType: 'model', errors: modelErrors });
        }
      } else {
        validationPromise.reject({ failType: 'model', errors: modelErrors });
      }
    });

    return validationPromise;
  },

  initiateSave(modalContext) {
    // First, add animation classes to the modal:
    modalContext.$el.parent()
        .addClass('waiting')
        .addClass('save-waiting');

    modalContext.$el.append('' +
    '<div class="loading-animation save-loading-animation">' +
        '<div class="loader">' +
            '<svg class="circular" viewBox="25 25 50 50">' +
                '<circle class="path" cx="50" cy="50" r="20" ' +
                        'fill="none" stroke-width="2" ' +
                        'stroke-miterlimit="10"/>' +
            '</svg>' +
            '<i class="fa fa-cloud-upload fa-2x fa-fw"></i>' +
        '</div>' +
        '<p class="loading-text">Saving placement...</p>' +
    '</div>');

    setTimeout(() => {
      modalContext.$el.find('.loading-animation')
                          .addClass('active');
    }, 600);

    setTimeout(() => {
      modalContext.$el.find('.modal-inner')
          .css({ visibility: 'hidden' });
    }, 450);

    setTimeout(() => {
      modalContext.$el.parent()
          .addClass('waiting')
          .addClass('save-waiting')
          .removeClass('waiting-transition')
          .removeClass('save-waiting-transition');
    }, 500);

    this.callbacks.save();
  },

  clearErrorClasses() {
    this.$el.find('.form-group').removeClass('has-error');
    this.$el.find('.form-group .form-help').text('');
  },
});
