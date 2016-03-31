define(
    [
        'backbone',
        'dateRangePicker',
        'jquery',
        'marionette',
        'moment',
        'moment-timezone',
        'underscore',
        'itemviews/modals/modal-window.js',
        'itemviews/snackbars/snackbar.js',
        'misc/date-picker-options',
        'misc/settings',
        'misc/tpl'
    ],
    function(
        Backbone,
        dateRangePicker,
        $,
        Mn,
        moment,
        mmtz,
        _,
        ModalView,
        SnackbarView,
        datePickerOptions,
        settings,
        tpl
    ) {
        'use strict';

        return Mn.ItemView.extend({
            template: tpl('package-item'),

            className: 'package-sheet-holder',

            ui: {
                packageSheetOuter: '.package-sheet',
                slugHeadlineHolder: '.package-sheet .slug-headline-holder',
                primaryMarkReadyTrigger: '.package-sheet .mark-ready',
                expansionTrigger: '.package-sheet .expand-package',
                notesModalTrigger: '.package-sheet .notes',
                printInfoModalTrigger: '.package-sheet .print-info',
                webInfoModalTrigger: '.package-sheet .web-info',
                additionalMarkReadyTrigger: '.extra-sheet .mark-ready',
            },

            events: {
                'click @ui.slugHeadlineHolder': 'showHeadlineVotingModal',
                'click @ui.primaryMarkReadyTrigger': 'markPrimaryAsReady',
                'click @ui.expansionTrigger': 'expandPackageSheet',
                'click @ui.notesModalTrigger': 'showNotesModal',
                'click @ui.printInfoModalTrigger': 'showPrintInfoModal',
                'click @ui.webInfoModalTrigger': 'showWebInfoModal',
                'click @ui.additionalMarkReadyTrigger': 'markAdditionalAsReady',
            },

            modelEvents: {
                'change': 'render'
            },

            initialize: function() {
                this._radio = Backbone.Wreqr.radio.channel('global');

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

                // Hub color and vertical slug.
                if (!_.isUndefined(packageHub)){
                    templateContext.hubDotColor = packageHub.get('color');
                    templateContext.verticalSlug = packageHub.get('vertical').slug;
                }

                // Editors and authors list.
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
                        return {
                            model: additionalItem,
                            typeMeta: settings.contentTypes[
                                additionalItem.type
                            ],
                        };
                    }
                );

                return templateContext;
            },

            markPrimaryAsReady: function() {
                var primaryContentCopy = _.clone(this.model.get('primaryContent'));

                $.ajax({
                    type: "POST",
                    url: settings.urlConfig.postEndpoints.itemMarkReady,
                    contentType: 'application/json; charset=utf-8',
                    data: JSON.stringify({contentID: primaryContentCopy.id}),
                    processData: false,
                    success: function(data) {
                        if (data.success) {
                            primaryContentCopy.isReady = data.ready;
                            this.model.set('primaryContent', primaryContentCopy);
                        } else {
                            // Open error-acknowledgement snackbar.
                            this._radio.commands.execute(
                                'showSnackbar',
                                new SnackbarView({
                                    snackbarClass: 'failure',
                                    text: 'Could not mark as ready. Try again later.',
                                })
                            );
                        }
                    }.bind(this),
                    error: function(jqXHR, textStatus, errorThrown) {
                        // Open error-acknowledgement snackbar.
                        this._radio.commands.execute(
                            'showSnackbar',
                            new SnackbarView({
                                snackbarClass: 'failure',
                                text: 'Could not mark as ready. Try again later.',
                            })
                        );
                    }.bind(this),
                    dataType: 'json'
                });
            },

            markAdditionalAsReady: function(event) {
                var additionalContentCopy = [],
                    additionalContentID = parseInt(
                        $(event.currentTarget).closest('.content-item').attr('content-id'),
                        10
                    );

                _.each(
                    this.model.get('additionalContent'),
                    function(additionalItem) {
                        var itemCopy = _.clone(additionalItem);

                        if (additionalItem.id == additionalContentID) {
                            itemCopy.isReady = !itemCopy.isReady;
                        }
                    additionalContentCopy.push(itemCopy);
                });

                $.ajax({
                    type: "POST",
                    url: settings.urlConfig.postEndpoints.itemMarkReady,
                    contentType: 'application/json; charset=utf-8',
                    data: JSON.stringify({contentID: additionalContentID}),
                    processData: false,
                    success: function(data) {
                        if (data.success) {
                            this.model.set('additionalContent', additionalContentCopy);
                        } else {
                            // Open error-acknowledgement snackbar.
                            this._radio.commands.execute(
                                'showSnackbar',
                                new SnackbarView({
                                    snackbarClass: 'failure',
                                    text: 'Could not mark as ready. Try again later.',
                                })
                            );
                        }
                    }.bind(this),
                    error: function(jqXHR, textStatus, errorThrown) {
                        // Open error-acknowledgement snackbar.
                        this._radio.commands.execute(
                            'showSnackbar',
                            new SnackbarView({
                                snackbarClass: 'failure',
                                text: 'Could not mark as ready. Try again later.',
                            })
                        );
                    }.bind(this),
                    dataType: 'json'
                });
            },

            expandPackageSheet: function(e) {
                this.primaryIsExpanded = !this.primaryIsExpanded;
                this.ui.packageSheetOuter.toggleClass('expanded');
            },

            showHeadlineVotingModal: function(e) {
                if (this.ui.slugHeadlineHolder.hasClass('has-leading-headline')) {
                    var headlineStatus = this.model.get('headlineStatus'),
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

                        formRows.push({
                            extraClasses: radioExtraClasses,
                            rowType: 'radio-buttons',
                            fields: headlineFields,
                            rowHeader: radioRowHeader,
                        });
                    }

                    var headlineVotingModal = {
                        modalTitle: 'Vote for your favorite headline',
                        innerID: 'headline-voting',
                        contentClassName: 'package-modal',
                        formConfig: {
                            rows: formRows
                        },
                        escapeButtonCloses: false,
                        overlayClosesOnClick: false,
                        buttons: [
                            {
                                buttonID: 'headline-votes-vote-button',
                                buttonClass: 'flat-button disabled expand-past-button save-action',
                                innerLabel: 'Vote',
                                clickCallback: function(modalContext) {
                                    // First, serialize the form:
                                    var voteCastData = {},
                                        formValues = _.chain(
                                            modalContext.$el.find('form').serializeArray()
                                        ).map(
                                            function(i) {
                                                return [i.name, i.value];
                                            }
                                        ).object().value();

                                    voteCastData.headlineID = parseInt(
                                        formValues.headlineChoices,
                                        10
                                    );
                                    voteCastData.userID = this.options.currentUser.email;

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
                                        url: settings.urlConfig.postEndpoints.headlines.submitVote,
                                        contentType: 'application/json; charset=utf-8',
                                        data: JSON.stringify(voteCastData),
                                        processData: false,
                                        success: function(data) {
                                            setTimeout(
                                                function() {
                                                    if (data.success) {
                                                        this.voteSubmitSuccessCallback();
                                                    } else {
                                                        this.voteSubmitErrorCallback();
                                                    }
                                                }.bind(this),
                                                1500
                                            );
                                        }.bind(this),
                                        error: function(jqXHR, textStatus, errorThrown) {
                                            setTimeout(
                                                function() {
                                                    this.voteSubmitErrorCallback();
                                                }.bind(this),
                                                1500
                                            );
                                        }.bind(this),
                                        dataType: 'json'
                                    });
                                }.bind(this),
                            },
                            {
                                buttonID: 'headline-votes-cancel-button',
                                buttonClass: 'flat-button primary-action cancel-trigger',
                                innerLabel: 'Cancel',
                                clickCallback: function(modalContext) {
                                    this._radio.commands.execute('destroyModal');
                                }.bind(this),
                            },
                        ]
                    };

                    this.modalView = new ModalView({
                        modalConfig: headlineVotingModal,
                        renderCallback: function(modalObj) {
                            modalObj.$el.find('label').click(
                                function() {
                                    modalObj.$el.find('#headline-votes-vote-button').removeClass('disabled');
                                }
                            );
                        }.bind()
                    });

                    this._radio.commands.execute('showModal', this.modalView);
                }
            },

            voteSubmitSuccessCallback: function() {
                // Close this popup and destroy it:
                setTimeout(function() {
                    this._radio.commands.execute('destroyModal');
                }.bind(this),
                500);

                // Display snackbar:
                this._radio.commands.execute(
                    'showSnackbar',
                    new SnackbarView({
                        snackbarClass: 'success',
                        text: 'Your vote was saved.',
                        action: {
                            promptText: 'Dismiss'
                        },
                    })
                );
            },

            voteSubmitErrorCallback: function() {
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
                        text: 'Could not save your vote. Try again later.',
                    })
                );
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

                    formRows.push({
                        extraClasses: radioExtraClasses,
                        rowType: 'radio-buttons',
                        fields: headlineFields,
                        rowHeader: radioRowHeader,
                    });
                }

                formRows.push(
                    {
                        extraClasses: '',
                        fields: [
                            {
                                type: 'input',
                                widthClasses: 'small-12 medium-12 large-12',
                                labelText: 'URL',
                                inputName: 'url',
                                inputType: 'text',
                                inputValue: this.model.get('URL')
                            }
                        ]
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
                                inputID: 'pubDate',
                                inputName: 'pub_date',
                                inputType: 'text',
                                inputValue: parsedPubDate.format(
                                    'MMM D, YYYY'
                                ),
                            },
                            {
                                type: 'input',
                                widthClasses: 'small-6 medium-4 large-4',
                                labelText: 'Time published',
                                inputID: 'pubTime',
                                inputName: 'pub_time',
                                inputType: 'time',
                                inputValue: parsedPubDate.format(
                                    'HH:mm'
                                ),
                            },
                        ]
                    }
                );

                var webInfoModal = {
                    modalTitle: 'Web publishing info',
                    innerID: 'package-web-info',
                    contentClassName: 'package-modal',
                    formConfig: {
                        rows: formRows
                    },
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
                                    formValues = _.chain(
                                        modalContext.$el.find('form').serializeArray()
                                    ).map(
                                        function(i) {
                                            return [i.name, i.value];
                                        }
                                    ).object().value();

                                packageWebData.packageID = this.model.get('id');
                                packageWebData.packageURL = formValues.url;
                                packageWebData.pubDate = moment.tz(
                                    formValues.pub_date +
                                        ' ' +
                                        formValues.pub_time,
                                    'MMM D, YYYY HH:mm',
                                    'America/Chicago'
                                ).unix();

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
                var formattedPrintIssue = '';
                if (!_.isNull(this.model.get('printPlacement').printIssue)) {
                    formattedPrintIssue = moment(
                        this.model.get('printPlacement').printIssue
                    ).format('MMM D, Y');
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
                                        inputID: 'print_issue',
                                        inputName: 'print_issue',
                                        inputType: 'text',
                                        inputValue: formattedPrintIssue,
                                    },
                                    {
                                        type: 'input',
                                        widthClasses: 'small-12 medium-12 large-12',
                                        labelText: 'Page(s)',
                                        inputID: 'print_pages',
                                        inputName: 'print_pages',
                                        inputType: 'text',
                                        inputValue: this.model.get('printPlacement').printPages
                                    }
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
                                    formValues = _.chain(
                                        modalContext.$el.find('form').serializeArray()
                                    ).map(
                                        function(i) {
                                            return [i.name, i.value];
                                        }
                                    ).object().value();

                                packagePrintData.packageID = this.model.get('id');
                                packagePrintData.printIssue = moment(
                                    formValues.print_issue,
                                    'MMM D, YYYY'
                                ).format('Y-MM-DD');
                                packagePrintData.printPages = formValues.print_pages;

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

                        modal.$el.find('form #print_issue').dateRangePicker(dayOptions);
                    }
                });

                this._radio.commands.execute('showModal', this.modalView);
            },



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