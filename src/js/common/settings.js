define(['underscore'], function(_) {
    'use strict';

    var standardSettings = {
            apiEndpoints: {
                POST: {
                    additionalItem: {
                        delete: 'http://datalab.dallasnews.com/budget/delete-additional-item/',
                    },
                    headline: {
                        submitVote: 'http://datalab.dallasnews.com/budget/headline/vote/',
                    },
                    package: {
                        delete: 'http://datalab.dallasnews.com/budget/package/delete/',
                        save: 'http://datalab.dallasnews.com/budget/package/',  // To be migrated to in the app.
                        updatePrintInfo: 'http://datalab.dallasnews.com/budget/package/print/',
                        updateWebInfo: 'http://datalab.dallasnews.com/budget/package/web/',
                    },
                },
                GET: {
                    hub: {
                        list: 'http://datalab.dallasnews.com/staff/api/hub/',
                    },
                    staffer: {
                        list: 'http://datalab.dallasnews.com/staff/api/staff/',
                    },
                    package: {
                        detail: 'http://datalab.dallasnews.com/budget/packages/',
                        list: {
                            print: 'http://datalab.dallasnews.com/budget/packages/for-print/',
                            web: 'http://datalab.dallasnews.com/budget/packages/',
                        },
                    },
                },
            },

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
                    autoClose: true,
                    classes: '',
                    clearButton: true,
                    language: 'en_us_apstyle',
                    minView: 'days',
                    navTitles: {
                        days: 'MM <i>yyyy</i>',
                        months: 'yyyy',
                        years: 'yyyy1 - yyyy2',
                    },
                    toggleSelected: false,
                    view: 'days',
                },
                m: {
                    dateFormat: 'MM yyyy',
                    minView: 'months',
                    todayButton: false,
                    view: 'months',
                },
                w: {
                    classes: 'weeks-only',
                    customKeyDownFunction: function(e) {
                        var code = e.which,
                            alreadySelected;

                        this._registerKey(code);

                        // Arrows
                        if (code === 38 || code === 40) {
                            e.preventDefault();
                            this._focusNextCell(code);
                        }

                        if (code === 37 || code === 39) {
                            e.preventDefault();
                            this._focusNextCell(code + 1);
                        }

                        // Enter
                        if (code === 13) {
                            if (this.focused) {
                                if (this._getCell(this.focused).hasClass('-disabled-')) return;

                                if (this.view !== this.opts.minView) {
                                    this.down();
                                } else {
                                    alreadySelected = this._isSelected(this.focused, this.cellType);

                                    if (!alreadySelected) {
                                        if (this.timepicker) {
                                            this.focused.setHours(this.timepicker.hours);
                                            this.focused.setMinutes(this.timepicker.minutes);
                                        }
                                        this.selectDate(this.focused);
                                    } else if (alreadySelected && this.opts.toggleSelected) {
                                        this.removeDate(this.focused);
                                    }
                                }
                            }
                        }

                        // Esc
                        if (code === 27) {
                            this.hide();
                        }
                    },
                    dateFormat: 'Week of M d, yyyy',
                    onRenderCell: function(date, cellType) {
                        var enabledDays = [1],
                            classList = '',
                            isDisabled = false;

                        if (cellType === 'day') {
                            isDisabled = enabledDays.indexOf(date.getDay()) === -1;
                            classList = '';

                            if (!isDisabled) {
                                classList = '-allowed-';
                            }
                        }

                        return {classes: classList, disabled: isDisabled};
                    },
                    todayButton: false,
                },
                d: {
                    todayButton: new Date(),
                },
                t: {
                    todayButton: new Date(),
                },
            },

            editDropdownOptions: {
                closeAfterSelect: true,
                openOnFocus: true,
                plugins: ['restore_on_backspace'],

                labelField: 'name',
                searchField: ['name'],
                valueField: 'value',

                onFocus: function() {
                    if (!this.$control.parent().hasClass('input-focused')) {
                        this.$control.parent().addClass('input-focused');
                    }
                },
                onBlur: function() {
                    if (this.$control.parent().hasClass('input-focused')) {
                        this.$control.parent().removeClass('input-focused');
                    }
                },

                onItemAdd: function(value, $item) {},  // eslint-disable-line no-unused-vars
                onItemRemove: function(value) {},  // eslint-disable-line no-unused-vars
            },

            externalURLs: {
                addVisualsRequest: 'https://sites.google.com/a/dallasnews.com/dmnutilities/add-request',
            },

            messages: {
                slugField: {
                    ajaxError: 'Could not check if that slug is unique. Try again later.',
                    defaultMessage: 'Enter a unique value.',
                    nonUniqueError: 'That slug is already taken. Please choose something else.',
                    successfullyUniqueValue: 'Your slug is unique.',
                    tooShortError: 'Slugs must be four or more characters long.',
                },
            },

            pollInterval: 20 * 1000,

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
                minutesStep: 5,
                timeFormat: 'h:mm a',
            },

            typeRankingIndex: {
                person: 1,
                hub: 5,
                vertical: 9,
            },
        },

        offlineSettings = {
            apiEndpoints: {
                POST: {
                    additionalItem: {
                        delete: null,
                    },
                    headline: {
                        submitVote: null,
                    },
                    package: {
                        delete: null,
                        save: null,
                        updatePrintInfo: null,
                        updateWebInfo: null,
                    },
                },
                GET: {
                    hub: {
                        list: '/test-data/20160610/staff.api.hub.json',
                    },
                    staffer: {
                        list: '/test-data/20160610/staff.api.staff.json',
                    },
                    package: {
                        detail: '/test-data/20160610/budget.packages/',
                        list: {
                            print: '/test-data/20160610/budget.packages.for-print.json',
                            web: '/test-data/20160610/budget.packages.json',
                        },
                    },
                },
            },

            apiPostfix: '.json',
        };

    // Return the standard and offline settings together if running under
    // gulp with the '--offline' flag.
    // Otherwise, just return the standard settings.
    return _.defaults(
        (window.isOffline === true) ? offlineSettings : {},
        standardSettings
    );
});
