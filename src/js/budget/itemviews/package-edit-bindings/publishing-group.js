import _ from 'underscore';
import deline from 'deline';
import jQuery from 'jquery';
import Mn from 'backbone.marionette';

import settings from '../../../common/settings';

export default Mn.ItemView.extend({
    initialize() {
        this.parentUI = this.options.parentUI || {};
        this.uiElements = this.options.uiElements || {};

        this.extraContext = this.options.extraContext || {};
    },

    getBindings() {
        const bindings = {};

        const extraContext = this.extraContext;
        const model = this.model;
        const uiElements = this.uiElements;

        bindings[uiElements.publishingGroup] = {
            observe: 'publishGroupHeight',
            update($el) {
                const closestCollapsibleGroup = $el.closest(
                    '.row.can-collapse'
                );
                const newHeight = (
                    18 +  // 12px for top spacer, 6 for bottom border/margin.
                    $el.outerHeight()
                );

                closestCollapsibleGroup.data('expandedHeight', newHeight);

                if (closestCollapsibleGroup.height() > 0) {
                    closestCollapsibleGroup.height(newHeight);
                }
            },
            getVal() {},
        };

        bindings[uiElements.urlField] = {
            observe: 'publishedUrl',
        };

        bindings[uiElements.printRunDatesGroup] = {
            observe: 'printRunDate',
            events: ['setPrintRunDate'],
            initialize($el, mdl, opts) {
                const startDateEl = $el.find('#print_run_date_start');
                const endDateEl = $el.find('#print_run_date_end');

                const datePickerHolder = jQuery('<div class="date-range-picker">');
                $el.parent().append(datePickerHolder);

                $el.dateRangePicker({
                    format: 'MMM D, YYYY',
                    separator: ' to ',
                    watchValueChange: true,
                    container: datePickerHolder,
                    getValue: () => {
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
                    shortcuts: settings.dateRangeShortcuts,
                });
            },
            update: ($el, value, mdl) => {
                const startDateEl = $el.find('#print_run_date_start');
                const endDateEl = $el.find('#print_run_date_end');

                let startDateVal = '';
                let endDateVal = '';

                if (
                    (!_.isNull(mdl.get('printRunDate'))) &&
                    (mdl.get('printRunDate').every(
                        dateStr => typeof dateStr === 'string'
                    ))
                ) {
                    startDateVal = settings.moment(
                        mdl.get('printRunDate')[0],
                        'YYYY-MM-DD'
                    )
                        .clone()
                        .format('MMM D, YYYY');

                    endDateVal = settings.moment(
                        mdl.get('printRunDate')[1],
                        'YYYY-MM-DD'
                    )
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
                val.every(dateStr => settings.moment(
                    dateStr,
                    'YYYY-MM-DD'
                ).isValid())
            ),
            getVal: ($el) => {
                const startDateEl = $el.find('#print_run_date_start');
                const endDateEl = $el.find('#print_run_date_end');

                return [
                    settings.moment(startDateEl.val(), 'MMM D, YYYY')
                                .format('YYYY-MM-DD'),
                    settings.moment(endDateEl.val(), 'MMM D, YYYY')
                                .clone()
                                .add(1, 'days')
                                .format('YYYY-MM-DD'),
                ];
            },
        };

        bindings[uiElements.printSystemSlugField] = {
            observe: 'printSystemSlug',
        };

        bindings[uiElements.printPublicationDropdown] = {
            observe: 'printSection',
            initialize($el) {
                const typeOpts = {
                    maxItems: 1,
                    options: extraContext.printPlacementChoices,
                    render: {
                        item(dta) {
                            return deline`
                                <div data-value="${dta.value}"
                                     class="selected-item">${dta.name}</div>`;
                        },
                    },
                };

                $el.selectize(_.defaults(typeOpts, settings.editDropdownOptions));
            },
            onGet() {
                if (_.isEmpty(model.get('printSection'))) { return ''; }

                return extraContext.sectionPublicationMap[
                    model.get('printSection')[0]
                ];
            },
            update($el, value) {
                if (_.isUndefined($el[0].selectize)) {
                    $el.val(value);
                } else if (_.isObject($el[0].selectize)) {
                    $el[0].selectize.setValue(value, true);
                }

                extraContext.setActivePublication(value);
            },
            getVal($el) {
                // On select, reset the selected sections to an empty list.
                // Use 'silent: true' to prevent changing the dropdown to
                // reflect a null value.
                model.set('printSection', [], { silent: true });

                return ($el.val()) ? $el.val() : null;
            },
            set(attr, value) {
                extraContext.setActivePublication(value);
                model.trigger('change:activePublication');
            },
        };

        bindings[uiElements.printSectionCheckboxes] = {
            observe: ['activePublication', 'printSection'],
            // eslint-disable-next-line no-unused-vars
            onGet: (values, options) => [extraContext.getActivePublication(), values[1]],
            update($el, values, mdl) {
                const newPublication = values[0];
                const selectedValues = mdl.get('printSection');

                // Clear existing toggles.
                $el.empty();

                if (_.has(extraContext.printPublicationSections, newPublication)) {
                    $el.show();

                    $el.append('<h5>Sections</h5>');

                    _.each(
                        extraContext.printPublicationSections[newPublication],
                        (section) => {
                            const sectionCheckbox = jQuery(
                                    deline`
                                    <label><input
                                              id="placement-"
                                              name="print_sections"
                                              data-form="package"
                                              type="checkbox"
                                              value="${section.id}"
                                        ><i class="helper"></i> ${section.name}</label>`
                            );

                            if (_.contains(selectedValues, section.id)) {
                                sectionCheckbox.find('input').prop('checked', true);
                            }

                            sectionCheckbox.find('input').change((event) => {
                                const thisEl = jQuery(event.currentTarget);
                                const sectionID = parseInt(thisEl.val(), 10);
                                let newSections = _.clone(mdl.get('printSection'));

                                if (thisEl.prop('checked')) {
                                    newSections = _.union(newSections, [sectionID]);
                                } else {
                                    newSections = _.difference(newSections, [sectionID]);
                                }

                                // If 'newSections' is empty, apply these
                                // changes silently.
                                // That way, the selected publication won't
                                // also be reset.
                                mdl.set(
                                    'printSection',
                                    newSections,
                                    (_.isEmpty(newSections)) ? { silent: true } : {}
                                );
                            });

                            $el.append(sectionCheckbox);
                        }
                    );
                } else {
                    $el.hide();
                }

                mdl.trigger('change:publishGroupHeight');
            },
        };

        bindings[uiElements.printFinalized] = {
            observe: 'isPrintPlacementFinalized',
            update() {},
            getVal($el) { return $el.is(':checked'); },
            attributes: [
                {
                    name: 'checked',
                    observe: 'isPrintPlacementFinalized',
                    onGet(value) {
                        return (_.isBoolean(value)) ? value : false;
                    },
                },
            ],
        };

        return bindings;
    },
});
