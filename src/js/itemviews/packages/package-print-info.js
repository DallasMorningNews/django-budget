define(
    [
        'dateRangePicker',
        'jquery',
        'moment',
        'moment-timezone',
        'underscore',
        'itemviews/modals/modal-window.js',
        'itemviews/packages/package-base',
        'itemviews/snackbars/snackbar.js',
        'misc/date-picker-options',
        'misc/settings',
        'misc/tpl'
    ],
    function(
        dateRangePicker,
        $,
        moment,
        mmtz,
        _,
        ModalView,
        PackageItemView,
        SnackbarView,
        datePickerOptions,
        settings,
        tpl
    ) {
        'use strict';

        return PackageItemView.extend({
            template: tpl('package-item-print'),

            ui: {
                packageSheetOuter: '.package-sheet',
                slugBar: '.package-sheet .minimal-card .slug-bar',
                contentsBar: '.package-sheet .minimal-card .contents-bar',
                rippleButton: '.package-sheet .button',
                editPackageTrigger: '.package-sheet .edit-package',
                notesModalTrigger: '.package-sheet .view-notes',
                subscriptionModalTrigger: '.package-sheet .subscribe',
                expansionTrigger: '.package-sheet .expand-package',
                printInfoModalTrigger: '.package-sheet .print-info',
                webInfoModalTrigger: '.package-sheet .web-info',
            },

            events: {
                'click @ui.slugBar': 'expandOnMobile',
                'click @ui.contentsBar': 'expandOnMobile',
                'mousedown @ui.rippleButton': 'addButtonClickedClass',
                'click @ui.editPackageTrigger': 'showPackageEdit',
                'click @ui.notesModalTrigger': 'showNotesModal',
                'click @ui.subscriptionModalTrigger': 'showSubscriptionModal',
                'click @ui.expansionTrigger': 'expandPackageSheet',
                'click @ui.printInfoModalTrigger': 'showPrintInfoModal',
                'click @ui.webInfoModalTrigger': 'showWebInfoModal',
            },

            initEnd: function() {
                this.primaryIsExpanded = false;

                moment.locale('en', {
                    meridiem: function (hour, minute, isLowercase) {
                        var meridiemString;
                        if (hour < 12) {
                            meridiemString = "a.m.";
                        }  else {
                            meridiemString = "p.m.";
                        }

                        if (!isLowercase) {
                            return meridiemString.toUpperCase();
                        }

                        return meridiemString;
                    },
                    monthsShort : [
                        'Jan.', 'Feb.', 'March', 'April', 'May', 'June',
                        'July', 'Aug.', 'Sept.', 'Oct.', 'Nov.', 'Dec.'
                    ]
                });

                $.dateRangePickerLanguages.default['week-1'] = 'M';
                $.dateRangePickerLanguages.default['week-2'] = 'T';
                $.dateRangePickerLanguages.default['week-3'] = 'W';
                $.dateRangePickerLanguages.default['week-4'] = 'T';
                $.dateRangePickerLanguages.default['week-5'] = 'F';
                $.dateRangePickerLanguages.default['week-6'] = 'S';
                $.dateRangePickerLanguages.default['week-7'] = 'S';
            },

            serializeData: function() {
                var templateContext = {},
                    packageObj = this.model.toJSON(),
                    packageHub = this.options.hubConfigs.findWhere({
                        slug: packageObj.hub
                    });

                // Template context, in order of appearance:

                // Expanded (or not) package state.
                templateContext.primaryIsExpanded = this.primaryIsExpanded;

                // Underlying model.
                templateContext.packageObj = packageObj;

                // 'Is ready' flag.
                templateContext.packageIsReady = false;
                if (
                    (this.model.has('URL')) &&
                    (!_.isEmpty(this.model.get('URL')))
                ) {
                    templateContext.packageIsReady = true;
                }

                // Hub color and vertical slug.
                if (!_.isUndefined(packageHub)){
                    templateContext.hubDotColor = packageHub.get('color');
                    templateContext.verticalSlug = packageHub.get('vertical').slug;
                }

                // Print placement lists.
                templateContext.formattedPrintPlacements = _.chain(
                    _.map(
                        this.model.get('printPlacement').printPlacements,
                        function(placementSlug) {
                            return _.findWhere(
                                settings.printPlacementTypes,
                                {
                                    slug: placementSlug
                                }
                            );
                        }
                    )
                )
                    .sortBy('order')
                    .map(function(i) { return _.omit(i, 'order');})
                    .value();

                // Formatted print run date.
                templateContext.formattedPrintRunDate = moment(
                    this.model.get('printPlacement').printRunDate,
                    'YYYY-MM-DD'
                ).format(
                    'MMM D, YYYY'
                );

                // Editor and author lists.
                templateContext.allPeople = _.union(
                    _.pluck(this.model.get('primaryContent').editors, 'email'),
                    _.pluck(this.model.get('primaryContent').authors, 'email'),
                    _.pluck(
                        _.flatten(
                            _.pluck(
                                this.model.get('additionalContent'),
                                'editors'
                            )
                        ),
                        'email'
                    ),
                    _.pluck(
                        _.flatten(
                            _.pluck(
                                this.model.get('additionalContent'),
                                'authors'
                            )
                        ),
                        'email'
                    )
                ).join(' ');

                // Leading headline (if voting is open),
                // or winning headline if one was selected.
                if (packageObj.headlineCandidates.length > 0) {
                    templateContext.leadingHeadline = _.chain(packageObj.headlineCandidates)
                                                        .sortBy('votes')
                                                        .last()
                                                        .value()
                                                        .text;
                }

                // Verbose name and other information for primary content type icon.
                templateContext.primaryTypeMeta = settings.contentTypes[
                    this.model.get('primaryContent').type
                ];

                // Fallback function for comma-formatted length (1 of 2).
                // If used, remember to also import numeral.
                // if (_.has(packageObj.primaryContent, 'length')) {
                //     templateContext.primaryLengthFormatted = numeral(
                //         packageObj.primaryContent.length
                //     ).format('0,0');
                // }

                // List of additional content item types and icons
                // (Needed for "Includes [other icons]" list).
                templateContext.additionalItemTypes = _.map(
                    _.pluck(this.model.get('additionalContent'), 'type'),
                    function(typeSlug) {
                        var typeObj = _.clone(settings.contentTypes[typeSlug]);
                        typeObj.slug = typeSlug;
                        return typeObj;
                    }
                );

                // List of additional content items, in an object with
                // on-model ('model') and 'typemeta' attributes.
                templateContext.additionalWithTypeMetas = _.map(
                    packageObj.additionalContent,
                    function(additionalItem) {
                        var additionalConfig = {
                            model: _.clone(additionalItem),
                            typeMeta: settings.contentTypes[
                                additionalItem.type
                            ],
                        };

                        // Fallback function for comma-formatted length (2 of 2).
                        // If used, remember to also import numeral.
                        // if (_.has(additionalItem, 'length')) {
                        //     additionalConfig.model.length = numeral(
                        //         additionalItem.length
                        //     ).format('0,0');
                        // }

                        return additionalConfig;
                    }
                );

                return templateContext;
            },

            onRenderCallback: function() {
                this.ui.rippleButton.addClass('click-init');
            },


            /*
             *   Event handlers.
             */

            expandOnMobile: function(e) {
                if ($(window).width() < settings.buttonHideWidth) {
                    this.expandPackageSheet();
                }
            },

            showPackageEdit: function(event) {
                if (event.button === 0 && !(event.ctrlKey || event.metaKey)) {
                    event.preventDefault();

                    this._radio.commands.execute(
                        'navigate',
                        'edit/' + this.model.id + '/',
                        {
                            trigger: true
                        }
                    );
                }
            },

            expandPackageSheet: function(e) {
                if (this.primaryIsExpanded) {
                    // Strike the 'is-expanded' class, then remove the
                    // 'overflow-visible' class at the end of the
                    // 'is-expanded' animation.
                    this.ui.packageSheetOuter.removeClass('is-expanded');

                    this.ui.packageSheetOuter
                                .find('.primary-description')
                                .removeClass('overflow-visible');

                    this.primaryIsExpanded = false;
                } else {
                    // Add the 'is-expanded' class, then add the
                    // 'overflow-visible' class at the end of the
                    // 'is-expanded' animation.
                    this.ui.packageSheetOuter.addClass('is-expanded');

                    setTimeout(
                        function() {
                            this.ui.packageSheetOuter
                                        .find('.primary-description')
                                        .addClass('overflow-visible');
                        }.bind(this),
                        1500
                    );

                    this.primaryIsExpanded = true;
                }
            },

            showNotesModal: function(e) {
                var notesModal = {
                    'modalTitle': 'Production notes',
                    'innerID': 'production-notes-modal',
                    'contentClassName': 'package-modal',
                    'extraHTML': '<div class="mode-toggle">' +
                                 '    <div trigger-mode="read-only">Read</div>' +
                                 '    <div trigger-mode="edit">Edit</div>' +
                                 '</div>' +
                                 '<div class="modes">' +
                                 '    <div class="read-only">' + this.model.get('notes') + '</div>' +
                                 '    <div class="edit"><textarea>' + this.model.get('notes') + '</textarea></div>' +
                                 '</div>',
                    'buttons': [
                        {
                            buttonID: 'package-notes-save-button',
                            buttonClass: 'flat-button primary-action save-trigger expand-past-button',
                            innerLabel: 'Save',
                            clickCallback: function(modalContext) {},
                        },
                        {
                            buttonID: 'package-notes-close-button',
                            buttonClass: 'flat-button primary-action close-trigger',
                            innerLabel: 'Close',
                            clickCallback: function(modalContext) {
                                this._radio.commands.execute('destroyModal');
                            }.bind(this),
                        },
                    ]
                };

                this.modalView = new ModalView({
                    modalConfig: notesModal
                });

                this._radio.commands.execute('showModal', this.modalView);
            },

            showSubscriptionModal: function(e) {
                var subscriptionModal = {
                    'modalTitle': 'Coming soon',
                    'innerID': 'subscription-modal',
                    'contentClassName': 'package-modal',
                    'extraHTML': '' +
                        '<p>Soon you will be able to follow budgeted content on Slack. We&rsquo;ll keep track of everything you follow, and let you know any time it&rsquo;s updated.</p>' +
                        '<p>Check back shortly as we finish implementing this feature.</p>',
                    'buttons': [
                        {
                            buttonID: 'package-notes-close-button',
                            buttonClass: 'flat-button primary-action close-trigger',
                            innerLabel: 'Close',
                            clickCallback: function(modalContext) {
                                this._radio.commands.execute('destroyModal');
                            }.bind(this),
                        },
                    ]
                };

                this.modalView = new ModalView({
                    modalConfig: subscriptionModal
                });

                this._radio.commands.execute('showModal', this.modalView);
            },

            showWebInfoModal: function(e) {
                var parsedPubDate = moment.unix(
                        this.model.get('pubDate').timestamp
                    ).tz('America/Chicago'),
                    headlineStatus = this.model.get('headlineStatus'),
                    formRows = [],
                    headlineFields = [];

                if (this.model.get('headlineCandidates').length > 0) {
                    _.each(this.model.get('headlineCandidates'), function(hed) {
                        var radioFieldConfig = {
                            type: 'radio',
                            widthClasses: 'small-12 medium-12 large-12',
                            groupName: 'headlineChoices',
                            inputID: 'headline' + hed.id,
                            inputValue: hed.id,
                            labelText: '&ldquo;' + hed.text + '&rdquo;',
                            isDisabled: false,
                            isChecked: false,
                        };

                        if (headlineStatus == 'finalized') {
                            if (hed.winner) {
                                radioFieldConfig.isChecked = true;
                            } else {
                                radioFieldConfig.isDisabled = true;
                            }
                        }

                        headlineFields.push(radioFieldConfig);
                    });

                    var radioExtraClasses = '',
                        radioRowHeader = 'Choose a winning headline';

                    if (headlineStatus == 'finalized') {
                        radioExtraClasses += 'headlines-finalized';
                        radioRowHeader = 'Headlines (winner already chosen)';
                    }

                    formRows.push({ extraClasses: radioExtraClasses, rowType: 'radio-buttons', fields: headlineFields, rowHeader: radioRowHeader });
                }

                formRows.push(
                    {
                        extraClasses: '',
                        fields: [
                            { type: 'input', widthClasses: 'small-12 medium-12 large-12', labelText: 'URL', inputName: 'url', inputType: 'text', inputValue: this.model.get('URL') }
                        ]
                    }
                );

                formRows.push(
                    {
                        extraClasses: '',
                        fields: [
                            { type: 'input', widthClasses: 'small-6 medium-8 large-8', labelText: 'Date published (online)', inputID: 'pubDate', inputName: 'pub_date', inputType: 'text', inputValue: parsedPubDate.format('MMM D, YYYY'), },
                            { type: 'input', widthClasses: 'small-6 medium-4 large-4', labelText: 'Time published', inputID: 'pubTime', inputName: 'pub_time', inputType: 'time', inputValue: parsedPubDate.format('HH:mm'), },
                        ]
                    }
                );

                var webInfoModal = {
                    modalTitle: 'Web publishing info',
                    innerID: 'package-web-info',
                    contentClassName: 'package-modal',
                    formConfig: { rows: formRows },
                    escapeButtonCloses: false,
                    overlayClosesOnClick: false,
                    buttons: [
                        {
                            buttonID: 'package-web-info-save-button',
                            buttonClass: 'flat-button save-action expand-past-button save-trigger',
                            innerLabel: 'Save',
                            clickCallback: function(modalContext) {
                                // First, serialize the form:
                                var packageWebData = {},
                                    formValues = _.chain(modalContext.$el.find('form').serializeArray())
                                                        .map(function(i) {return [i.name, i.value];})
                                                        .object()
                                                        .value();

                                packageWebData.packageID = this.model.get('id');
                                packageWebData.packageURL = formValues.url;
                                packageWebData.pubDate = {
                                    timestamp: moment.tz(
                                                    formValues.pub_date +
                                                        ' ' +
                                                        formValues.pub_time,
                                                    'MMM D, YYYY HH:mm',
                                                    'America/Chicago'
                                                ).unix(),
                                    resolution: 't',
                                };

                                if (_.has(formValues, 'headlineChoices')) {
                                    if (headlineStatus != 'finalized') {
                                        packageWebData.headlineID = formValues.headlineChoices;
                                    }
                                }

                                // Next, add animation classes to the modal:
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
                                    modalContext.$el.find('.loading-animation').addClass('active');
                                }.bind(this), 600);

                                setTimeout(
                                    function() {
                                        modalContext.$el.find('.modal-inner').css({
                                            'visibility': 'hidden'
                                        });

                                        modalContext.$el.addClass('blue-background');
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

                                // Finally, execute the AJAX:
                                $.ajax({
                                    type: "POST",
                                    url: settings.urlConfig.postEndpoints.package.updateWebInfo,
                                    contentType: 'application/json; charset=utf-8',
                                    data: JSON.stringify(packageWebData),
                                    processData: false,
                                    success: function(data) {
                                        setTimeout(
                                            function() {
                                                if (data.success) {
                                                    this.infoModalSuccessCallback('web');
                                                } else {
                                                    this.infoModalErrorCallback();
                                                }
                                            }.bind(this),
                                            1500
                                        );
                                    }.bind(this),
                                    error: function(jqXHR, textStatus, errorThrown) {
                                        setTimeout(
                                            function() {
                                                this.infoModalErrorCallback();
                                            }.bind(this),
                                            1500
                                        );
                                    }.bind(this),
                                    dataType: 'json'
                                });
                            }.bind(this),
                        },
                        {
                            buttonID: 'package-web-info-cancel-button',
                            buttonClass: 'flat-button primary-action cancel-trigger',
                            innerLabel: 'Cancel',
                            clickCallback: function(modalContext) {
                                this._radio.commands.execute('destroyModal');
                            }.bind(this),
                        },
                    ]
                };

                this.modalView = new ModalView({
                    modalConfig: webInfoModal,
                    renderCallback: function(modal) {
                        var dayOptions = _.clone(datePickerOptions);
                        dayOptions.singleDate = true;
                        dayOptions.extraClass = 'package-web-info-date';

                        modal.$el.find('form #pubDate').dateRangePicker(dayOptions);
                    }
                });

                this._radio.commands.execute('showModal', this.modalView);
            },

            showPrintInfoModal: function(e) {
                var formattedPrintRunDate = '';
                if (!_.isNull(this.model.get('printPlacement').printIssue)) {
                    formattedPrintRunDate = moment(
                        this.model.get('printPlacement').printRunDate,
                        'YYYY-MM-DD'
                    ).format('MMM D, Y');
                }

                var placementFields = _.map(
                    settings.printPlacementTypes,
                    function(placementTypeConfig) {
                        var fieldOpts = {
                            type: 'checkbox',
                            labelText: placementTypeConfig.verboseName,
                            inputID: placementTypeConfig.slug,
                            groupName: 'pitched_placements[]',
                            inputValue: placementTypeConfig.slug,
                        };

                        if (_.contains(
                            this.model.get('printPlacement').printPlacements,
                            placementTypeConfig.slug
                        )) {

                            fieldOpts.isChecked = true;
                        }

                        return fieldOpts;
                    }.bind(this)
                );

                var finalizedOption = {
                    type: 'checkbox',
                    labelText: 'Print placement finalized?',
                    inputID: 'is_placement_finalized',
                    groupName: 'is_placement_finalized',
                    inputValue: 'finalized',
                };

                if (
                    this.model.has('printPlacement') &&
                    _.has(this.model.get('printPlacement'), 'isFinalized') &&
                    this.model.get('printPlacement').isFinalized === true
                ) {
                    finalizedOption.isChecked = true;
                }

                var printInfoModal = {
                    modalTitle: 'Print publishing info',
                    innerID: 'package-print-info',
                    contentClassName: 'package-modal',
                    formConfig: {
                        rows: [
                            {
                                extraClasses: '',
                                fields: [
                                    {
                                        type: 'input',
                                        widthClasses: 'small-12 medium-12 large-12',
                                        labelText: 'Print run date',
                                        inputID: 'print_run_date',
                                        inputName: 'print_run_date',
                                        inputType: 'text',
                                        inputValue: formattedPrintRunDate,
                                    }
                                ]
                            },
                            {
                                extraClasses: 'checkbox checkbox-group-first',
                                fields: placementFields,
                                rowHeader: 'Print placements',
                                rowHeaderExtraClasses: 'placements-header',
                            },
                            {
                                extraClasses: 'checkbox',
                                fields: [
                                    finalizedOption
                                ]
                            }
                        ]
                    },
                    escapeButtonCloses: false,
                    overlayClosesOnClick: false,
                    buttons: [
                        {
                            buttonID: 'package-print-info-save-button',
                            buttonClass: 'flat-button save-action expand-past-button save-trigger',
                            innerLabel: 'Save',
                            clickCallback: function(modalContext) {
                                // First, serialize the form:
                                var packagePrintData = {},
                                    formValues = {};
                                _.each(
                                    modalContext.$el.find('form input'),
                                    function(inputEl) {
                                        if (inputEl.name.endsWith('[]')) {
                                            var groupName = inputEl.name.substring(
                                                0,
                                                inputEl.name.length - 2
                                            );

                                            if (!_.has(formValues, groupName)) {
                                                formValues[groupName] = [];
                                            }

                                            if (inputEl.checked) {
                                                formValues[groupName].push(
                                                    inputEl.value
                                                );
                                            }
                                        } else if (inputEl.type == 'checkbox') {
                                            if (inputEl.checked) {
                                                formValues[inputEl.name] = true;
                                            } else {
                                                formValues[inputEl.name] = false;
                                            }
                                        } else {
                                            formValues[inputEl.name] = inputEl.value;
                                        }
                                    }
                                );

                                packagePrintData.packageID = this.model.get('id');

                                packagePrintData.printRunDate = moment(
                                    formValues.print_run_date,
                                    'MMM D, YYYY'
                                ).format('YYYY-MM-DD');

                                packagePrintData.pitchedPlacements = formValues.pitched_placements;

                                packagePrintData.isPlacementFinalized = formValues.is_placement_finalized;

                                // Next, add animation classes to the modal:
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
                                    modalContext.$el.find('.loading-animation').addClass('active');
                                }.bind(this), 600);

                                setTimeout(
                                    function() {
                                        modalContext.$el.find('.modal-inner').css({
                                            'visibility': 'hidden'
                                        });

                                        modalContext.$el.addClass('blue-background');
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

                                // Finally, execute the AJAX:
                                $.ajax({
                                    type: "POST",
                                    url: settings.urlConfig.postEndpoints.package.updatePrintInfo,
                                    contentType: 'application/json; charset=utf-8',
                                    data: JSON.stringify(packagePrintData),
                                    processData: false,
                                    success: function(data) {
                                        setTimeout(
                                            function() {
                                                if (data.success) {
                                                    this.infoModalSuccessCallback('print');
                                                } else {
                                                    this.infoModalErrorCallback();
                                                }
                                            }.bind(this),
                                            1500
                                        );
                                    }.bind(this),
                                    error: function(jqXHR, textStatus, errorThrown) {
                                        setTimeout(
                                            function() {
                                                this.infoModalErrorCallback();
                                            }.bind(this),
                                            1500
                                        );
                                    }.bind(this),
                                    dataType: 'json'
                                });
                            }.bind(this),
                        },
                        {
                            buttonID: 'package-print-info-cancel-button',
                            buttonClass: 'flat-button primary-action cancel-trigger',
                            innerLabel: 'Cancel',
                            clickCallback: function(modalContext) {
                                this._radio.commands.execute('destroyModal');
                            }.bind(this),
                        },
                    ]
                };

                this.modalView = new ModalView({
                    modalConfig: printInfoModal,
                    renderCallback: function(modal) {
                        var dayOptions = _.clone(datePickerOptions);
                        dayOptions.singleDate = true;
                        dayOptions.extraClass = 'package-print-info-date';

                        modal.$el.find('form #print_run_date').dateRangePicker(dayOptions);
                    }
                });

                this._radio.commands.execute('showModal', this.modalView);
            },


            /*
             *   Form-submission callbacks.
             */

            infoModalSuccessCallback: function(infoType) {
                // Close this popup and destroy it:
                setTimeout(function() {
                    this._radio.commands.execute('destroyModal');
                }.bind(this),
                500);

                // Set snackbar text:
                var snackbarText;
                if (infoType == 'print') {
                    snackbarText = 'Updated print publishing info.';
                } else if (infoType == 'web') {
                    snackbarText = 'Updated web publishing info.';
                }

                // Display snackbar:
                this._radio.commands.execute(
                    'showSnackbar',
                    new SnackbarView({
                        snackbarClass: 'success',
                        text: snackbarText,
                        action: {
                            promptText: 'Dismiss'
                        },
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