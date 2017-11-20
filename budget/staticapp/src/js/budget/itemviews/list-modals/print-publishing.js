import _ from 'underscore';
import Backbone from 'backbone';
// import jQuery from 'jquery';
import Mn from 'backbone.marionette';
import 'daterange-picker-ex';

// import deline from '../../../vendored/deline';

export default Mn.ItemView.extend({
  initialize() {
    this.radio = Backbone.Wreqr.radio.channel('global');

    this.callbacks = this.options.callbacks || {};

    this.extraContext = this.options.extraContext || {};

    this.config = {
      modalTitle: 'Print publishing info',
      innerID: 'package-print-info',
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
            // Resume polling.
            this.callbacks.resumePolling();
            this.callbacks.close();
          },
        },
      ],
    };
  },

  extendConfig(configToAdd) {
    this.config = _.extend(this.config, configToAdd);
  },

  getConfig() {
    return this.config;
  },

  getBindings() {
    const bindings = {};

    // bindings['#print_run_date_inputs'] = {
    //   observe: 'printRunDate',
    //   events: ['setPrintRunDate'],
    //   initialize: ($el, mdl, opts) => {
    //     const startDateEl = $el.find('#print_run_date_start');
    //     const endDateEl = $el.find('#print_run_date_end');
    //
    //     const datePickerHolder = jQuery('<div class="date-range-picker">');
    //     $el.parent().append(datePickerHolder);
    //
    //     this.datePickerObj = $el.dateRangePicker({
    //       format: 'MMM D, YYYY',
    //       separator: ' to ',
    //       watchValueChange: true,
    //       container: datePickerHolder,
    //       getValue: () => {
    //         // const startDateEl = $el.find('#print_run_date_start');
    //         // const endDateEl = $el.find('#print_run_date_end');
    //
    //         if (startDateEl.val() && endDateEl.val()) {
    //           return `${startDateEl.val()} to ${endDateEl.val()}`;
    //         }
    //
    //         return '';
    //       },
    //       setValue: (s, s1, s2) => {
    //         startDateEl.val(s1[1]);
    //         endDateEl.val(s2[1]);
    //
    //         $el.trigger(opts.events[0]);
    //       },
    //       customArrowNextSymbol: '<i class="fa fa-arrow-circle-right"></i>',
    //       customArrowPrevSymbol: '<i class="fa fa-arrow-circle-left"></i>',
    //       shortcuts: this.radio.reqres.request('getSetting', 'dateRangeShortcuts'),
    //     });
    //   },
    //   update: ($el, value, mdl) => {
    //     const startDateEl = $el.find('#print_run_date_start');
    //     const endDateEl = $el.find('#print_run_date_end');
    //
    //     let startDateVal = '';
    //     let endDateVal = '';
    //
    //     const moment = this.radio.reqres.request('getSetting', 'moment');
    //
    //     if (
    //       (!_.isNull(mdl.get('printRunDate'))) &&
    //       (mdl.get('printRunDate').every(
    //         // eslint-disable-next-line comma-dangle
    //         dateStr => typeof dateStr === 'string'
    //       ))
    //     ) {
    //       startDateVal = moment(mdl.get('printRunDate')[0], 'YYYY-MM-DD')
    //           .clone()
    //           .format('MMM D, YYYY');
    //
    //       endDateVal = moment(mdl.get('printRunDate')[1], 'YYYY-MM-DD')
    //           .clone()
    //           .subtract(1, 'days')
    //           .format('MMM D, YYYY');
    //     }
    //
    //     startDateEl.val(startDateVal);
    //     endDateEl.val(endDateVal);
    //   },
    //   updateModel: val => (
    //     val.length === 2
    //   ) && (
    //     val.every(dateStr => typeof dateStr === 'string')
    //   ) && (
    //     val.every(dateStr => this.radio.reqres.request('getSetting', 'moment')(
    //         dateStr,
    //         'YYYY-MM-DD'  // eslint-disable-line comma-dangle
    //     ).isValid())
    //   ),
    //   getVal: ($el) => {
    //     const startDateEl = $el.find('#print_run_date_start');
    //     const endDateEl = $el.find('#print_run_date_end');
    //
    //     const moment = this.radio.reqres.request('getSetting', 'moment');
    //
    //     return [
    //       moment(startDateEl.val(), 'MMM D, YYYY')
    //         .format('YYYY-MM-DD'),
    //       moment(endDateEl.val(), 'MMM D, YYYY')
    //         .clone()
    //         .add(1, 'days')
    //         .format('YYYY-MM-DD'),
    //     ];
    //   },
    // };
    //
    // const printSlugName = this.radio.reqres.request('getSetting', 'printSlugName');
    // if (printSlugName !== null) {
    //   bindings['#print_system_slug'] = {
    //     observe: 'printSystemSlug',
    //   };
    // }

    // bindings['#print_publication'] = {
    //   observe: 'printSection',
    //   initialize: ($el) => {
    //     const typeOpts = {
    //       maxItems: 1,
    //       options: this.extraContext.printPlacementChoices,
    //       render: {
    //         item: dta => deline`
    //             <div data-value="${dta.value}"
    //                   class="selected-item">${
    //                       dta.name
    //                   }</div>`,
    //       },
    //     };
    //
    //     $el.selectize(_.defaults(
    //       typeOpts,
    //       // eslint-disable-next-line comma-dangle
    //       this.radio.reqres.request('getSetting', 'editDropdownOptions')
    //     ));
    //   },
    //   onGet: () => {
    //     if (_.isEmpty(this.model.get('printSection'))) { return ''; }
    //
    //     return this.extraContext.sectionPublicationMap[
    //         this.model.get('printSection')[0]
    //     ];
    //   },
    //   update: ($el, value) => {
    //     if (_.isUndefined($el[0].selectize)) {
    //       $el.val(value);
    //     } else if (_.isObject($el[0].selectize)) {
    //       $el[0].selectize.setValue(value, true);
    //     }
    //
    //     this.activePublication = value;
    //   },
    //   getVal: ($el) => {
    //     // On select, reset the selected sections to an empty list.
    //     // Use 'silent: true' to prevent changing the dropdown to
    //     // reflect a null value.
    //     this.model.set('printSection', [], { silent: true });
    //
    //     return ($el.val()) ? $el.val() : null;
    //   },
    //   set: (attr, value) => {
    //     this.activePublication = value;
    //     this.model.trigger('change:activePublication');
    //   },
    // };

    // bindings['#print_section'] = {
    //   observe: ['activePublication', 'printSection'],
    //   onGet: values => [this.activePublication, values[1]],
    //   update: ($el, values) => {
    //     const newPublication = values[0];
    //     const selectedValues = this.model.get('printSection');
    //
    //     // Clear existing toggles.
    //     $el.empty();
    //
    //     if (_.has(this.extraContext.printPublicationSections, newPublication)) {
    //       $el.show();
    //
    //       $el.append('<h5>Sections</h5>');
    //
    //       _.each(
    //         this.extraContext.printPublicationSections[newPublication],
    //         (section) => {
    //           const sectionCheckbox = jQuery(deline`
    //             <label><input id="placement-"
    //                           name="print_sections"
    //                           data-form="package"
    //                           type="checkbox"
    //                           value="${
    //                               section.id
    //                           }"><i class="helper"></i> ${
    //                               section.name
    //                           }</label>`  // eslint-disable-line comma-dangle
    //           );
    //
    //           if (_.contains(selectedValues, section.id)) {
    //             sectionCheckbox.find('input').prop('checked', true);
    //           }
    //
    //           sectionCheckbox.find('input').change((event) => {
    //             const thisEl = jQuery(event.currentTarget);
    //             const sectionID = parseInt(thisEl.val(), 10);
    //             const newSectionsRaw = _.clone(this.model.get('printSection'));
    //             const newSections = (
    //                 thisEl.prop('checked')
    //             ) ? (
    //                 _.union(newSectionsRaw, [sectionID])
    //             ) : (
    //                 _.difference(newSectionsRaw, [sectionID])
    //             );
    //
    //             // If 'newSections' is empty, apply these
    //             // changes silently.
    //             // That way, the selected publication won't
    //             // also be reset.
    //             this.model.set(
    //                 'printSection',
    //                 newSections,
    //                 // eslint-disable-next-line comma-dangle
    //                 (_.isEmpty(newSections)) ? { silent: true } : {}
    //             );
    //           });
    //
    //           $el.append(sectionCheckbox);
    //         }  // eslint-disable-line comma-dangle
    //       );
    //     } else {
    //       $el.hide();
    //     }
    //   },
    // };

    // bindings['#is_placement_finalized'] = {
    //   observe: 'isPrintPlacementFinalized',
    //   update: () => {},
    //   getVal: $el => $el.is(':checked'),
    //   attributes: [
    //     {
    //       name: 'checked',
    //       observe: 'isPrintPlacementFinalized',
    //       onGet: (value) => {
    //         const hasValue = (_.isBoolean(value)) ? value : false;
    //         return hasValue;
    //       },
    //     },
    //   ],
    // };

    return bindings;
  },
});
