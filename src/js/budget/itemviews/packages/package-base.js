define(
    [
        'backbone',
        'jquery',
        'marionette',
        'moment',
        'moment-timezone',
        'underscore',
        'underscore.string',
        'budget/itemviews/modals/modal-window.js',
        'budget/itemviews/snackbars/snackbar.js',
        'common/settings',
        'misc/air-timepicker',
    ],
    function(
        Backbone,
        $,
        Mn,
        moment,
        mmtz,  // eslint-disable-line no-unused-vars
        _,
        _string_,
        ModalView,
        SnackbarView,
        settings,
        timePicker  // eslint-disable-line no-unused-vars
    ) {
        'use strict';

        return Mn.ItemView.extend({
            className: 'package-sheet-holder',

            modelEvents: {
                change: 'render',
            },

            initialize: function() {
                this._radio = Backbone.Wreqr.radio.channel('global');

                this.printPlacementChoices = this.enumeratePrintPlacementChoices();

                this.initEnd();
            },

            serializeData: function() {
                var templateContext = {};

                return templateContext;
            },

            onAttach: function() {
                this.$el.find('.might-overflow').bind('mouseenter', function() {
                    var $this = $(this);

                    if (this.offsetWidth < this.scrollWidth && !$this.attr('title')) {
                        $this.attr('title', $this.text());
                    }
                });
            },

            addButtonClickedClass: function(event) {
                var thisEl = $(event.currentTarget);
                thisEl.addClass('active-state');
                thisEl.removeClass('click-init');

                setTimeout(
                    function() {
                        thisEl.removeClass('hover').removeClass('active-state');
                    },
                    1000
                );

                setTimeout(
                    function() {
                        thisEl.addClass('click-init');
                    },
                    2000
                );
            },

            enumeratePrintPlacementChoices: function() {
                var sectionPublicationValues = [],
                    publicationSections = [],
                    placementChoices = _.compact(
                        this.options.printPublications.map(function(publication) {
                            if (publication.get('isActive') === true) {
                                // Generate a second map with this publications'
                                // section IDs and the publication's slug.
                                // This gets used on the selectize 'select' event.
                                sectionPublicationValues.push(
                                    _.map(
                                        publication.get('sections'),
                                        function(section) {
                                            return [section.id, publication.get('slug')];
                                        }
                                    )
                                );

                                publicationSections.push(
                                    [
                                        publication.get('slug'),
                                        publication.get('sections'),
                                    ]
                                );

                                return {
                                    name: publication.get('name'),
                                    value: publication.get('slug'),
                                };
                            }

                            return null;
                        })
                    );

                this.printPublicationSections = _.chain(publicationSections)
                        .compact()
                        .reject(function(mapping) { return _.isEmpty(mapping[1]); })
                        .object()
                        .value();

                this.sectionPublicationMap = _.chain(sectionPublicationValues)
                        .compact()
                        .reject(_.isEmpty)
                        .flatten(true)
                        .object()
                        .value();

                return placementChoices;
            },

            showWebInfoModal: function(e) {  // eslint-disable-line no-unused-vars
                var formRows = [],
                    webInfoModal = {
                        modalTitle: 'Web publishing info',
                        innerID: 'package-web-info',
                        contentClassName: 'package-modal',
                        escapeButtonCloses: false,
                        overlayClosesOnClick: false,
                        buttons: [
                            {
                                buttonID: 'package-web-info-save-button',
                                buttonClass: 'flat-button save-action ' +
                                                'expand-past-button save-trigger',
                                innerLabel: 'Save',
                                clickCallback: function(modalContext) {
                                    var packageSave;

                                    // First, add animation classes to the modal:
                                    modalContext.$el.parent()
                                        .addClass('waiting')
                                        .addClass('save-waiting');

                                    modalContext.$el.append(
                                        '<div class="loading-animation save-loading-animation">' +
                                            '<div class="loader">' +
                                                '<svg class="circular" viewBox="25 25 50 50">' +
                                                    '<circle class="path" cx="50" cy="50" r="20" ' +
                                                            'fill="none" stroke-width="2" ' +
                                                            'stroke-miterlimit="10"/>' +
                                                '</svg>' +
                                                '<i class="fa fa-cloud-upload fa-2x fa-fw"></i>' +
                                            '</div>' +
                                            '<p class="loading-text">Saving content...</p>' +
                                        '</div>'
                                    );

                                    setTimeout(function() {
                                        modalContext.$el.find('.loading-animation')
                                                                    .addClass('active');
                                    }.bind(this), 600);  // eslint-disable-line no-extra-bind

                                    setTimeout(
                                        function() {
                                            modalContext.$el.find('.modal-inner').css({
                                                visibility: 'hidden',
                                            });
                                        },
                                        450
                                    );

                                    setTimeout(
                                        function() {
                                            modalContext.$el.parent()
                                                .addClass('waiting')
                                                .addClass('save-waiting')
                                                .removeClass('waiting-transition')
                                                .removeClass('save-waiting-transition');
                                        },
                                        500
                                    );

                                    packageSave = this.model.save(
                                        undefined,
                                        {
                                            xhrFields: {
                                                withCredentials: true,
                                            },
                                            deepLoad: false,
                                        }
                                    );

                                    // eslint-disable-next-line no-unused-vars
                                    packageSave.done(function(mdl, resp, opts) {
                                        setTimeout(
                                            function() {
                                                // Resume polling.
                                                // eslint-disable-next-line no-underscore-dangle
                                                this._parent._poller.resume();

                                                this.infoModalSuccessCallback('web');
                                            }.bind(this),
                                            1500
                                        );
                                    }.bind(this));

                                    // eslint-disable-next-line no-unused-vars
                                    packageSave.fail(function(response, errorText) {
                                        setTimeout(
                                            function() {
                                                // Resume polling.
                                                // eslint-disable-next-line no-underscore-dangle
                                                this._parent._poller.resume();

                                                this.infoModalErrorCallback();
                                            }.bind(this),
                                            1500
                                        );
                                    }.bind(this));
                                }.bind(this),
                            },
                            {
                                buttonID: 'package-web-info-cancel-button',
                                buttonClass: 'flat-button primary-action cancel-trigger',
                                innerLabel: 'Cancel',
                                clickCallback: function(modalContext) {  // eslint-disable-line no-unused-vars,max-len
                                    // Resume polling.
                                    // eslint-disable-next-line no-underscore-dangle
                                    this._parent._poller.resume();

                                    this._radio.commands.execute('destroyModal');
                                }.bind(this),
                            },
                        ],
                    };

                // Halt polling (so subsequent fetches from the server don't
                // overwrite what a user is setting).
                this._parent._poller.pause();  // eslint-disable-line no-underscore-dangle

                formRows.push(
                    {
                        extraClasses: '',
                        fields: [
                            {
                                type: 'input',
                                widthClasses: 'small-12 medium-12 large-12',
                                labelText: 'URL',
                                inputID: 'published-url',
                                inputName: 'url',
                                inputType: 'text',
                            },
                        ],
                    }
                );

                formRows.push(
                    {
                        extraClasses: '',
                        fields: [
                            {
                                type: 'input',
                                widthClasses: 'small-6 medium-8 large-8',
                                labelText: 'Date published (online)',
                                inputID: 'publish-date',
                                inputName: 'publish_date',
                                inputType: 'text',
                            },
                            {
                                type: 'input',
                                widthClasses: 'small-6 medium-4 large-4',
                                labelText: 'Time published',
                                inputID: 'publish-time',
                                inputName: 'publish_time',
                                inputType: 'text',
                            },
                        ],
                    }
                );

                this.webAttributeBindings = {};

                this.webAttributeBindings['#published-url'] = {
                    observe: 'publishedUrl',
                };

                this.webAttributeBindings['#publish-date'] = {
                    observe: ['publishDateResolution', 'publishDate'],
                    events: ['updatePublishDate'],
                    // eslint-disable-next-line no-unused-vars
                    initialize: function($el, mdl, options) {
                        var control;

                        $el.datepicker(
                            _.defaults(
                                {
                                    onSelect: function(dateString, date, config) {
                                        config.$el.trigger('updatePublishDate');
                                    },
                                },
                                settings.datePickerOptions.t,
                                settings.datePickerOptions.default
                            )
                        );

                        control = $el.data('datepicker');

                        // Run the date-range selects line-by-line, since the
                        // datepicker's 'silent' flag apparently means nothing.
                        control.silent = true;
                        control.date = $el.data('initialDate');
                        // eslint-disable-next-line no-underscore-dangle
                        control.nav._render();
                        control.selectedDates = [$el.data('initialDate')];
                        // eslint-disable-next-line no-underscore-dangle
                        control._setInputValue();
                        // eslint-disable-next-line no-underscore-dangle
                        control.views[control.currentView]._render();
                        control.silent = false;

                        $el.removeData('initialDate');
                    },
                    update: function($el, values, mdl) {  // eslint-disable-line no-unused-vars
                        var datePckr = $el.data('datepicker'),
                            newDate;

                        if (_.isNull(values[1]) || values[1] === '') {
                            if (!_.isUndefined(datePckr)) {
                                datePckr.clear();
                            } else {
                                $el.val('');
                            }
                        } else {
                            if ((!_.isUndefined(values[0])) && (values[0] !== '')) {
                                newDate = moment(
                                    values[1][1]
                                ).tz('America/Chicago').subtract({seconds: 1});

                                if (!_.isUndefined(datePckr)) {
                                    datePckr.date = newDate.toDate();
                                    datePckr.selectDate(newDate.toDate());
                                } else {
                                    $el.data('initialDate', newDate.toDate());
                                    $el.val(
                                        this.model.generateFormattedPublishDate(
                                            't',
                                            newDate.toDate()
                                        )[0]
                                    );
                                }
                            }
                        }
                    },
                    getVal: function($el, event, options) {  // eslint-disable-line no-unused-vars
                        if ($el.val() === '') { return ['t', null]; }

                        return [
                            't',
                            [$el.val(), this.model.generateFormattedPublishDate('t')[1]].join(' '),
                        ];
                    },
                    set: function(attr, values) {
                        this.model.updatePublishDateResolution('t');
                        this.model.updatePublishDate.apply(this.model, values);
                    },
                };

                this.webAttributeBindings['#publish-time'] = {
                    observe: ['publishDateResolution', 'publishDate'],
                    events: ['blur'],
                    // eslint-disable-next-line no-unused-vars
                    initialize: function($el, mdl, options) {
                        var customOptions = {};

                        $el.timepicker(
                            _.defaults(customOptions, settings.timePickerOptions)
                        );
                    },
                    update: function($el, values, mdl) {
                        var timePckr = $el.data('timepicker'),
                            newTime;

                        if (_.isNull(values[1]) || values[1] === '') {
                            newTime = '12:00 p.m.';
                        } else {
                            newTime = mdl.generateFormattedPublishDate('t', values[1][1])[1];
                        }

                        if (!_.isUndefined(timePckr)) {
                            timePckr.selectTime(newTime);
                        } else {
                            $el.val(newTime);
                        }
                    },
                    getVal: function($el, event, options) {  // eslint-disable-line no-unused-vars
                        if (
                            (_.isUndefined(this.model.get('publishDate'))) ||
                            (_.isEmpty(this.model.get('publishDate')))
                        ) { return null; }

                        return [
                            't',
                            [
                                this.model.generateFormattedPublishDate('t')[0],
                                $el.val(),
                            ].join(' '),
                        ];
                    },
                    // eslint-disable-next-line no-unused-vars
                    set: function(attr, values) {
                        this.model.updatePublishDateResolution('t');
                        this.model.updatePublishDate.apply(this.model, values);
                    },
                };

                webInfoModal.formConfig = {rows: formRows};

                this.modalView = new ModalView({
                    modalConfig: webInfoModal,
                    model: this.model,
                    renderCallback: function(modal) {  // eslint-disable-line no-unused-vars
                        this.modalView.stickit(null, this.webAttributeBindings);
                    }.bind(this),
                });

                this._radio.commands.execute('showModal', this.modalView);
            },

            showPrintInfoModal: function(e) {  // eslint-disable-line no-unused-vars
                var formRows = [],
                    printInfoModal = {
                        modalTitle: 'Print publishing info',
                        innerID: 'package-print-info',
                        contentClassName: 'package-modal',
                        escapeButtonCloses: false,
                        overlayClosesOnClick: false,
                        buttons: [
                            {
                                buttonID: 'package-print-info-save-button',
                                buttonClass: 'flat-button save-action ' +
                                                'expand-past-button save-trigger',
                                innerLabel: 'Save',
                                clickCallback: function(modalContext) {
                                    var packageSave;

                                    // First, add animation classes to the modal:
                                    modalContext.$el.parent()
                                        .addClass('waiting')
                                        .addClass('save-waiting');

                                    modalContext.$el.append(
                                        '<div class="loading-animation save-loading-animation">' +
                                            '<div class="loader">' +
                                                '<svg class="circular" viewBox="25 25 50 50">' +
                                                    '<circle class="path" cx="50" cy="50" r="20" ' +
                                                            'fill="none" stroke-width="2" ' +
                                                            'stroke-miterlimit="10"/>' +
                                                '</svg>' +
                                                '<i class="fa fa-cloud-upload fa-2x fa-fw"></i>' +
                                            '</div>' +
                                            '<p class="loading-text">Saving content...</p>' +
                                        '</div>'
                                    );

                                    setTimeout(function() {
                                        modalContext.$el.find('.loading-animation')
                                                            .addClass('active');
                                    }.bind(this), 600);  // eslint-disable-line no-extra-bind

                                    setTimeout(
                                        function() {
                                            modalContext.$el.find('.modal-inner').css({
                                                visibility: 'hidden',
                                            });
                                        },
                                        450
                                    );

                                    setTimeout(
                                        function() {
                                            modalContext.$el.parent()
                                                .addClass('waiting')
                                                .addClass('save-waiting')
                                                .removeClass('waiting-transition')
                                                .removeClass('save-waiting-transition');
                                        },
                                        500
                                    );

                                    // Then, execute the remote save:
                                    packageSave = this.model.save(
                                        undefined,
                                        {
                                            xhrFields: {
                                                withCredentials: true,
                                            },
                                            deepLoad: false,
                                        }
                                    );

                                    // eslint-disable-next-line no-unused-vars
                                    packageSave.done(function(mdl, resp, opts) {
                                        setTimeout(
                                            function() {
                                                // Resume polling.
                                                // eslint-disable-next-line no-underscore-dangle
                                                this._parent._poller.resume();

                                                this.infoModalSuccessCallback('print');
                                            }.bind(this),
                                            1500
                                        );
                                    }.bind(this));

                                    // eslint-disable-next-line no-unused-vars
                                    packageSave.fail(function(response, errorText) {
                                        setTimeout(
                                            function() {
                                                // Resume polling.
                                                // eslint-disable-next-line no-underscore-dangle
                                                this._parent._poller.resume();

                                                this.infoModalErrorCallback();
                                            }.bind(this),
                                            1500
                                        );
                                    }.bind(this));
                                }.bind(this),
                            },
                            {
                                buttonID: 'package-print-info-cancel-button',
                                buttonClass: 'flat-button primary-action cancel-trigger',
                                innerLabel: 'Cancel',
                                clickCallback: function(modalContext) {  // eslint-disable-line no-unused-vars,max-len
                                    // Resume polling.
                                    // eslint-disable-next-line no-underscore-dangle
                                    this._parent._poller.resume();

                                    this._radio.commands.execute('destroyModal');
                                }.bind(this),
                            },
                        ],
                    };

                // Halt polling (so subsequent fetches from the server don't
                // overwrite what a user is setting).
                this._parent._poller.pause();  // eslint-disable-line no-underscore-dangle

                formRows.push(
                    {
                        extraClasses: '',
                        fields: [
                            {
                                type: 'input',
                                widthClasses: 'small-6 medium-6 large-6',
                                labelText: 'Print run date (start)',
                                inputID: 'print_run_date_start',
                                inputName: 'print_run_date_start',
                                inputType: 'text',
                            },
                            {
                                type: 'input',
                                widthClasses: 'small-6 medium-6 large-6',
                                labelText: 'Print run date (end)',
                                inputID: 'print_run_date_end',
                                inputName: 'print_run_date_end',
                                inputType: 'text',
                            },
                        ],
                    }
                );

                formRows.push(
                    {
                        extraClasses: '',
                        fields: [
                            {
                                type: 'input',
                                extraClasses: 'publication-group',
                                widthClasses: 'small-12 medium-12 large-12',
                                labelText: 'Publication',
                                inputID: 'print_publication',
                                inputName: 'print_publication',
                                inputType: 'text',
                            },
                        ],
                    }
                );

                formRows.push(
                    {
                        extraClasses: '',
                        fields: [
                            {
                                type: 'div',
                                widthClasses: 'small-12 medium-12 large-12',
                                extraClasses: 'checkbox',
                                inputID: 'print_section',
                            },
                        ],
                    }
                );

                formRows.push(
                    {
                        extraClasses: '',
                        fields: [
                            {
                                type: 'checkbox',
                                extraClasses: 'additional-checkbox-group',
                                widthClasses: 'small-12 medium-12 large-12',
                                labelText: 'Print placement finalized?',
                                inputID: 'is_placement_finalized',
                                inputName: 'is_placement_finalized',
                                inputValue: 'finalized',
                            },
                        ],
                    }
                );

                this.printAttributeBindings = {};

                this.printAttributeBindings['#print_run_date_start'] = {
                    observe: 'printRunDate',
                    events: ['setPrintRunDate'],
                    initialize: function($el, mdl, opts) {
                        var inputValue = mdl.get(opts.observe),
                            datePckr,
                            newDate;

                        $el.datepicker(
                            _.defaults(
                                settings.datePickerOptions.d,
                                settings.datePickerOptions.default
                            )
                        );

                        datePckr = $el.data('datepicker');

                        datePckr.preventDefault = false;

                        datePckr.opts.onSelect = function(
                            formattedDate,
                            date,
                            instance  // eslint-disable-line no-unused-vars
                        ) {
                            var currentRange = this.model.get('printRunDate'),
                                newStart,
                                savedEnd,
                                newDatePair;

                            if (date === '') {
                                newDatePair = {start: null};
                            } else if (!datePckr.preventDefault) {
                                newStart = moment(date).format('YYYY-MM-DD');

                                if (!_.isNull(currentRange) && currentRange.length === 2) {
                                    savedEnd = moment(
                                        currentRange[1],
                                        'YYYY-MM-DD'
                                    ).subtract({days: 1}).toDate();
                                } else if (_.isNull(currentRange)) {
                                    this.model.tempSavedStart = date;
                                    savedEnd = date;
                                }

                                newDatePair = {start: newStart};

                                if (
                                    (date.getTime() > savedEnd.getTime())
                                ) {
                                    newDatePair.end = moment(date)
                                                        .add({days: 1})
                                                        .format('YYYY-MM-DD');
                                }
                            }

                            $el.trigger('setPrintRunDate', newDatePair);

                            this.$el.find('#print_run_date_end').focus();
                        }.bind(this);

                        if (!_.isNull(inputValue) && !_.isNull(inputValue[0])) {
                            newDate = mdl.generateFormattedRunDate('YYYY-MM-DD', inputValue[0]);

                            datePckr.preventDefault = true;
                            datePckr.date = newDate;
                            datePckr.selectDate(newDate);
                            datePckr.preventDefault = false;
                        }
                    },
                    update: function($el, value, mdl) {
                        var datePckr = $el.data('datepicker'),
                            newDate;

                        if (value !== '') {
                            newDate = mdl.generateFormattedRunDate('YYYY-MM-DD', value[0]);

                            if (!_.isUndefined(datePckr)) {
                                datePckr.preventDefault = true;
                                datePckr.date = newDate;
                                datePckr.selectDate(newDate);
                                datePckr.preventDefault = false;
                            }
                        } else {
                            if (!_.isUndefined(datePckr)) {
                                datePckr.preventDefault = true;
                                datePckr.clear();
                                datePckr.preventDefault = false;
                            }
                        }
                    },
                    getVal: function($el, event, options, eventData) {
                        var inputDates = eventData[0],
                            newDates = _.clone(this.model.get('printRunDate'));

                        if (_.has(inputDates, 'start')) {
                            if (_.isNull(inputDates.start)) {
                                newDates = null;
                            } else {
                                if (_.isNull(newDates)) { newDates = [null, null]; }

                                newDates[0] = (
                                    inputDates.start !== ''
                                ) ? this.model.parseRunDate('YYYY-MM-DD', inputDates.start) : null;
                            }
                        }

                        if (_.has(inputDates, 'end')) {
                            if (_.isNull(inputDates.end)) {
                                newDates = null;
                            } else {
                                if (_.isNull(newDates)) { newDates = [null, null]; }

                                newDates[1] = (
                                    inputDates.end !== ''
                                ) ? this.model.parseRunDate('YYYY-MM-DD', inputDates.end) : null;
                            }
                        }

                        return newDates;
                    },
                };

                this.printAttributeBindings['#print_run_date_end'] = {
                    observe: 'printRunDate',
                    events: ['setPrintRunDate'],
                    initialize: function($el, mdl, opts) {
                        var inputValue = mdl.get(opts.observe),
                            datePckr,
                            newDate;

                        $el.datepicker(
                            _.defaults(
                                settings.datePickerOptions.d,
                                settings.datePickerOptions.default
                            )
                        );

                        datePckr = $el.data('datepicker');

                        datePckr.preventDefault = false;

                        datePckr.opts.onSelect = function(
                            formattedDate,
                            date,
                            instance  // eslint-disable-line no-unused-vars
                        ) {
                            var currentRange = this.model.get('printRunDate'),
                                newEnd = date,
                                savedStart,
                                newDatePair;

                            if (date === '') {
                                newDatePair = {end: null};
                            } else if (!datePckr.preventDefault) {
                                if (!_.isNull(currentRange) && currentRange.length === 2) {
                                    savedStart = moment(
                                        this.model.get('printRunDate')[0],
                                        'YYYY-MM-DD'
                                    ).toDate();
                                } else {
                                    savedStart = this.model.tempSavedStart;
                                }

                                newDatePair = {
                                    end: moment(newEnd).add({days: 1}).format('YYYY-MM-DD'),
                                };

                                if (savedStart.getTime() > newEnd.getTime()) {
                                    newDatePair.start = moment(date).format('YYYY-MM-DD');
                                }
                            }

                            $el.trigger('setPrintRunDate', newDatePair);
                        }.bind(this);

                        if (!_.isNull(inputValue) && (inputValue.length > 1)) {
                            newDate = mdl.generateFormattedRunDate(
                                'YYYY-MM-DD',
                                moment(
                                    inputValue[1],
                                    'YYYY-MM-DD'
                                ).subtract({days: 1}).format('YYYY-MM-DD')
                            );

                            datePckr.preventDefault = true;
                            datePckr.date = newDate;
                            datePckr.selectDate(newDate);
                            datePckr.preventDefault = false;
                        }
                    },
                    update: function($el, value, mdl) {
                        var datePckr = $el.data('datepicker'),
                            newDate;

                        if (value === '') {
                            if (!_.isUndefined(datePckr)) {
                                datePckr.preventDefault = true;
                                datePckr.clear();
                                datePckr.preventDefault = false;
                            }
                        } else {
                            if (value[1] !== '' && !_.isNull(value[1])) {
                                newDate = moment(
                                    value[1],
                                    'YYYY-MM-DD'
                                ).subtract({days: 1}).format('YYYY-MM-DD');

                                newDate = mdl.generateFormattedRunDate('YYYY-MM-DD', newDate);

                                if (!_.isUndefined(datePckr)) {
                                    datePckr.preventDefault = true;
                                    datePckr.date = newDate;
                                    datePckr.selectDate(newDate);
                                    datePckr.preventDefault = false;
                                }
                            } else {
                                if (!_.isUndefined(datePckr)) {
                                    datePckr.preventDefault = true;
                                    datePckr.clear();
                                    datePckr.preventDefault = false;
                                }
                            }
                        }
                    },
                    getVal: function($el, event, options, eventData) {
                        var inputDates = eventData[0],
                            newDates = _.clone(this.model.get('printRunDate'));

                        if (_.has(inputDates, 'start')) {
                            if (_.isNull(inputDates.start)) {
                                newDates = null;
                            } else {
                                if (_.isNull(newDates)) { newDates = [null, null]; }

                                newDates[0] = (
                                    inputDates.start !== ''
                                ) ? this.model.parseRunDate('YYYY-MM-DD', inputDates.start) : null;
                            }
                        }

                        if (_.has(inputDates, 'end')) {
                            if (_.isNull(inputDates.end)) {
                                newDates = null;
                            } else {
                                if (_.isNull(newDates)) { newDates = [null, null]; }

                                newDates[1] = (
                                    inputDates.end !== ''
                                ) ? this.model.parseRunDate('YYYY-MM-DD', inputDates.end) : null;
                            }
                        }

                        return newDates;
                    },
                };

                this.printAttributeBindings['#print_publication'] = {
                    observe: 'printSection',
                    initialize: function($el, mdl, options) {  // eslint-disable-line no-unused-vars
                        var typeOpts = {
                            maxItems: 1,
                            options: this.printPlacementChoices,
                            render: {
                                // eslint-disable-next-line no-unused-vars
                                item: function(dta, escape) {
                                    // eslint-disable-next-line no-unused-vars
                                    var dataType = 'fullText';

                                    if (typeof(dta.type) !== 'undefined') {
                                        dataType = dta.type;
                                    }
                                    return '<div data-value="' + dta.value +
                                                '" class="selected-item">' +
                                                dta.name +
                                            '</div>';
                                },
                            },
                        };

                        $el.selectize(_.defaults(typeOpts, settings.editDropdownOptions));
                    }.bind(this),
                    onGet: function(values, options) {  // eslint-disable-line no-unused-vars,max-len
                        if (_.isEmpty(this.model.get('printSection'))) { return ''; }

                        return this.sectionPublicationMap[
                            this.model.get('printSection')[0]
                        ];
                    }.bind(this),
                    update: function($el, value, mdl) {  // eslint-disable-line no-unused-vars
                        if (_.isUndefined($el[0].selectize)) {
                            $el.val(value);
                        } else if (_.isObject($el[0].selectize)) {
                            $el[0].selectize.setValue(value, true);
                        }

                        this.activePublication = value;
                    },
                    getVal: function($el, event, options) {  // eslint-disable-line no-unused-vars
                        // On select, reset the selected sections to an empty list.
                        // Use 'silent: true' to prevent changing the dropdown to
                        // reflect a null value.
                        this.model.set('printSection', [], {silent: true});

                        if ($el.val()) {
                            return $el.val();
                        }

                        return null;
                    },
                    // eslint-disable-next-line no-unused-vars
                    set: function(attr, value, options, config) {
                        this.activePublication = value;
                        this.model.trigger('change:activePublication');
                    },
                };

                this.printAttributeBindings['#print_section'] = {
                    observe: ['activePublication', 'printSection'],
                    // eslint-disable-next-line no-unused-vars
                    onGet: function(values, options) {
                        return [this.activePublication, values[1]];
                    },
                    update: function($el, values, mdl) {  // eslint-disable-line no-unused-vars
                        var newPublication = values[0],
                            selectedValues = this.model.get('printSection');

                        // Clear existing toggles.
                        $el.empty();

                        if (_.has(this.printPublicationSections, newPublication)) {
                            $el.show();

                            $el.append('<h5>Sections</h5>');

                            _.each(
                                this.printPublicationSections[newPublication],
                                function(section) {
                                    var sectionCheckbox = $('' +
                                            '<label>' +
                                                '<input ' +
                                                'id="placement-" ' +
                                                'name="print_sections" ' +
                                                'data-form="package" ' +
                                                'type="checkbox" ' +
                                                'value="' + section.id + '">' +
                                                    '<i class="helper"></i>' +
                                                    section.name +
                                            '</label>'
                                    );

                                    if (_.contains(selectedValues, section.id)) {
                                        sectionCheckbox.find('input').prop('checked', true);
                                    }

                                    sectionCheckbox.find('input').change(function(event) {
                                        var thisEl = $(event.currentTarget),
                                            sectionID = parseInt(thisEl.val(), 10),
                                            newSections = _.clone(this.model.get('printSection'));

                                        if (thisEl.prop('checked')) {
                                            newSections = _.union(newSections, [sectionID]);
                                        } else {
                                            newSections = _.difference(newSections, [sectionID]);
                                        }

                                        // If 'newSections' is empty, apply these
                                        // changes silently.
                                        // That way, the selected publication won't
                                        // also be reset.
                                        this.model.set(
                                            'printSection',
                                            newSections,
                                            (_.isEmpty(newSections)) ? {silent: true} : {}
                                        );
                                    }.bind(this));

                                    $el.append(sectionCheckbox);
                                }.bind(this)
                            );
                        } else {
                            $el.hide();
                        }
                    }.bind(this),
                };

                this.printAttributeBindings['#is_placement_finalized'] = {
                    observe: 'isPrintPlacementFinalized',
                    update: function($el, value, mdl) {},  // eslint-disable-line no-unused-vars
                    getVal: function($el, event, options) {  // eslint-disable-line no-unused-vars
                        return $el.is(':checked');
                    },
                    attributes: [
                        {
                            name: 'checked',
                            observe: 'isPrintPlacementFinalized',
                            onGet: function(value) {
                                return (_.isBoolean(value)) ? value : false;
                            },
                        },
                    ],
                };

                printInfoModal.formConfig = {rows: formRows};

                this.modalView = new ModalView({
                    modalConfig: printInfoModal,
                    model: this.model,
                    renderCallback: function(modal) {  // eslint-disable-line no-unused-vars
                        this.modalView.stickit(null, this.printAttributeBindings);
                    }.bind(this),
                });

                this._radio.commands.execute('showModal', this.modalView);
            },

            /*
             *   Form-submission callbacks.
             */

            infoModalSuccessCallback: function(infoType) {
                var snackbarText;

                // Close this popup and destroy it:
                setTimeout(function() {
                    this._radio.commands.execute('destroyModal');
                }.bind(this),
                500);

                // Set snackbar text:
                if (infoType === 'print') {
                    snackbarText = 'Updated print publishing info.';
                } else if (infoType === 'web') {
                    snackbarText = 'Updated web publishing info.';
                }

                // Display snackbar:
                this._radio.commands.execute(
                    'showSnackbar',
                    new SnackbarView({
                        snackbarClass: 'success',
                        text: snackbarText,
                        action: {promptText: 'Dismiss'},
                    })
                );
            },

            infoModalErrorCallback: function() {
                // Close this popup and destroy it:
                setTimeout(function() {
                    this._radio.commands.execute('destroyModal');
                }.bind(this),
                500);

                // Display snackbar:
                this._radio.commands.execute(
                    'showSnackbar',
                    new SnackbarView({
                        snackbarClass: 'failure',
                        text: 'Could not apply update. Try again later.',
                    })
                );
            },
        });
    }
);
