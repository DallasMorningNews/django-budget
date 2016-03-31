define([
    'backbone',
    'dateRangePicker',
    'jquery',
    'marionette',
    'moment',
    'moment-timezone',
    'selectize',
    'underscore',
    'collections/additional-content-items',
    'collectionviews/additional-content/additional-form-holder',
    'itemviews/modals/modal-window.js',
    'itemviews/snackbars/snackbar.js',
    'misc/date-picker-options',
    'misc/settings',
    'misc/tpl',
    'utils/expanding-text-field'
], function(
    Backbone,
    dateRangePicker,
    $,
    Mn,
    moment,
    mmtz,
    selectize,
    _,
    AdditionalContentItems,
    AdditionalFormHolderView,
    ModalView,
    SnackbarView,
    datePickerOptions,
    settings,
    tpl,
    expandingTextField
) {
    return Mn.LayoutView.extend({
        id: 'package-edit',
        template: tpl('packages-edit'),

        regions: {
            additionalContentHolder: '.single-page .additional-content',
        },

        ui: {
            colorDot: '.single-page .package-header .color-dot',
            packageForm: '#package-form',
            hubDropdown: '#package-form #hub',
            typeDropdown: '#package-form #type',
            lengthGroup: '#package-form .length-group',
            lengthField:  '#package-form #length',
            budgetLineField: '#package-form #budget_line',
            authorsDropdown: '#package-form #authors',
            editorsDropdown: '#package-form #editors',
            pubDateResolution: '#package-form #pub_date_resolution',
            pubDateGroup: '#package-form .pub-date-group',
            pubDateField: '#package-form #pub_date',
            pubTimeGroup: '#package-form .pub-time-group',
            pubTimeField: '#package-form #pub_time',
            notesField: '#package-form #notes',
            addAdditionalItemTrigger: '.single-page .add-additional-content-trigger',
            bottomButtonHolder: '.single-page .bottom-button-holder',
            persistentHolder: '.edit-bar .button-holder',
            persistentButton: '.edit-bar .button-holder .button',
            packageDeleteTrigger: '.edit-bar .button-holder .button.delete-trigger',
            packageSaveTrigger: '.edit-bar .button-holder .button.save-trigger',
            packageSaveAndContinueEditingTrigger: '.edit-bar .button-holder .button.save-and-continue-editing-trigger'
        },

        events: {
            'click @ui.addAdditionalItemTrigger': 'addNewAdditionalItem',
            'mousedown @ui.persistentButton': 'addButtonClickedClass',
            'click @ui.packageSaveTrigger': 'savePackage',
            'click @ui.packageSaveAndContinueEditingTrigger': 'savePackageAndContinueEditing',
            'click @ui.packageDeleteTrigger': 'deleteEntirePackage',
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

        deleteEntirePackage: function() {
            var serializedForm = this.serializeForm();

            var itemSlugs = _.pluck(serializedForm.additionalContent, 'slug');
            itemSlugs.unshift(serializedForm.primaryContent.slug);

            var itemsToDelete = '<ul class="to-be-deleted-list">' + _.chain(itemSlugs)
                .map(
                    function(additionalSlug) {
                        return '<li class="to-be-deleted-item">' + additionalSlug + '</li>';
                    }
                )
                .reduce(
                    function(memo, num){ return memo + num; },
                    ''
                )
                .value() + '</ul>';

            var deleteExtraHTML = '' +
                '<p class="delete-confirmation-text">' +
                    'You are about to delete the following budgeted content:' +
                '</p>' +
                itemsToDelete +
                '<p class="delete-confirmation-text">' +
                    'Items can&rsquo;t be recovered once they&rsquo;ve been ' +
                    'deleted.' +
                '</p>' +
                '<p class="delete-confirmation-text">' +
                    'If you&rsquo;re sure you want to delete this item, ' +
                    'click the ' +
                    '<span class="button-text-inline">delete</span> button ' +
                    'below.' +
                '</p>';

            var deleteConfirmationModal = {
                modalTitle: 'Are you sure?',
                innerID: 'additional-delete-confirmation-modal',
                contentClassName: 'package-modal',
                extraHTML: deleteExtraHTML,
                escapeButtonCloses: false,
                overlayClosesOnClick: false,
                buttons: [
                    {
                        'buttonID': 'delete-package-delete-button',
                        'buttonClass': 'flat-button delete-action expand-past-button delete-trigger',
                        'innerLabel': 'Delete',
                        'clickCallback': function(modalContext) {
                            var toDeleteDict = {
                                'packageID': this.options.boundData.id
                            };

                            modalContext.$el.parent()
                                            .addClass('waiting-transition')
                                            .addClass('delete-waiting-transition');

                            modalContext.$el.append(
                                '<div class="loading-animation deletion-loading-animation">' +
                                    '<div class="loader">' +
                                        '<svg class="circular" viewBox="25 25 50 50">' +
                                            '<circle class="path" cx="50" cy="50" r="20" ' +
                                                    'fill="none" stroke-width="2" ' +
                                                    'stroke-miterlimit="10"/>' +
                                        '</svg>' +
                                        '<i class="fa fa-trash fa-2x fa-fw"></i>' +
                                    '</div>' +
                                    '<p class="loading-text">Deleting content...</p>' +
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

                                    modalContext.$el.addClass('red-background');
                                },
                                450
                            );

                            setTimeout(
                                function() {
                                    modalContext.$el.parent()
                                                        .addClass('waiting')
                                                        .addClass('delete-waiting')
                                                        .removeClass('waiting-transition')
                                                        .removeClass('delete-waiting-transition');
                                },
                                500
                            );

                            $.ajax({
                                type: "POST",
                                url: settings.urlConfig.postEndpoints.deletePackage,
                                contentType: 'application/json; charset=utf-8',
                                data: JSON.stringify(toDeleteDict),
                                processData: false,
                                success: function(data) {
                                    setTimeout(function() {
                                        if (data.success) {
                                            this.deleteSuccessCallback(data);
                                        } else {
                                            this.deleteErrorCallback('processingError', [data]);
                                        }
                                    }.bind(this), 1500);
                                }.bind(this),
                                error: function(jqXHR, textStatus, errorThrown) {
                                    this.deleteErrorCallback('hardError', [jqXHR, textStatus, errorThrown]);
                                }.bind(this),
                                dataType: 'json'
                            });
                        }.bind(this),
                    },
                    {
                        'buttonID': 'delete-package-cancel-button',
                        'buttonClass': 'flat-button primary-action cancel-trigger',
                        'innerLabel': 'Cancel',
                        'clickCallback': function(modalContext) {
                            this._radio.commands.execute('destroyModal');
                        }.bind(this),
                    },
                ],
            };

            this.modalView = new ModalView({
                modalConfig: deleteConfirmationModal
            });

            setTimeout(
                function() {
                    this._radio.commands.execute('showModal', this.modalView);
                }.bind(this),
                200
            );
        },

        savePackage: function() {
            var packageDict = this.serializeForm();

            var saveProgressModal = {
                modalTitle: '',
                innerID: 'package-save-progress-modal',
                contentClassName: 'package-modal',
                extraHTML: '',
                escapeButtonCloses: false,
                overlayClosesOnClick: false,
                buttons: [],
            };

            this.modalView = new ModalView({
                modalConfig: saveProgressModal
            });

            setTimeout(
                function() {
                    this._radio.commands.execute('showModal', this.modalView);

                    this.modalView.$el.parent()
                                    .addClass('waiting')
                                    .addClass('save-waiting');

                    this.modalView.$el.append(
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
                        this.modalView.$el.find('.loading-animation').addClass('active');
                    }.bind(this), 270);
                }.bind(this),
                200
            );

            $.ajax({
                type: "POST",
                url: settings.urlConfig.postEndpoints.savePackage,
                contentType: 'application/json; charset=utf-8',
                data: JSON.stringify(packageDict),
                processData: false,
                success: function(data) {
                    setTimeout(function() {
                        if (data.success) {
                            this.saveSuccessCallback('saveOnly', data);
                        } else {
                            this.saveErrorCallback('saveOnly', 'processingError', [data]);
                        }
                    }.bind(this), 1500);
                }.bind(this),
                error: function(jqXHR, textStatus, errorThrown) {
                    this.saveErrorCallback('saveOnly', 'hardError', [jqXHR, textStatus, errorThrown]);
                }.bind(this),
                dataType: 'json'
            });
        },

        savePackageAndContinueEditing: function() {
            var packageDict = this.serializeForm();

            var saveProgressModal = {
                modalTitle: 'Are you sure?',
                innerID: 'package-save-progress-modal',
                contentClassName: 'package-modal',
                extraHTML: '',
                escapeButtonCloses: false,
                overlayClosesOnClick: false,
                buttons: [],
            };

            this.modalView = new ModalView({
                modalConfig: saveProgressModal
            });

            setTimeout(
                function() {
                    this._radio.commands.execute('showModal', this.modalView);

                    this.modalView.$el.parent()
                                    .addClass('waiting')
                                    .addClass('save-waiting');

                    this.modalView.$el.append(
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
                        this.modalView.$el.find('.loading-animation').addClass('active');
                    }.bind(this), 270);
                }.bind(this),
                200
            );

            $.ajax({
                type: "POST",
                url: settings.urlConfig.postEndpoints.savePackage,
                contentType: 'application/json; charset=utf-8',
                data: JSON.stringify(packageDict),
                processData: false,
                success: function(data) {
                    setTimeout(function() {
                        if (data.success) {
                            this.saveSuccessCallback('saveAndContinue', data);
                        } else {
                            this.saveErrorCallback('saveAndContinue', 'processingError', [data]);
                        }
                    }.bind(this), 1500);
                }.bind(this),
                error: function(jqXHR, textStatus, errorThrown) {
                    this.saveErrorCallback('saveAndContinue', 'hardError', [jqXHR, textStatus, errorThrown]);
                }.bind(this),
                dataType: 'json'
            });
        },

        deleteSuccessCallback: function(data) {
            // Close this popup and destroy it.
            setTimeout(function() {
                this._radio.commands.execute('destroyModal');
            }.bind(this),
            500);

            // Pop item from the local collection.
            // TK.

            // Navigate to the index view
            this._radio.commands.execute('navigate', '', {trigger: true});

            // Display snackbar:
            this._radio.commands.execute(
                'showSnackbar',
                new SnackbarView({
                    snackbarClass: 'success',
                    text: 'Item has been successfully deleted.',
                    action: {
                        promptText: 'Dismiss'
                    },
                })
            );
        },

        deleteErrorCallback: function(errorType, errorArgs) {
            // Close this popup and destroy it:
            setTimeout(function() {
                this._radio.commands.execute('destroyModal');
            }.bind(this),
            500);

            // Display snackbar:
            this._radio.commands.execute(
                'showSnackbar',
                new SnackbarView({
                    containerClass: 'edit-page',
                    snackbarClass: 'failure',
                    text: 'Item could not be deleted. Try again later.',
                })
            );
        },

        saveSuccessCallback: function(mode, data) {
            // Close this popup and destroy it.
            setTimeout(function() {
                this._radio.commands.execute('destroyModal');
            }.bind(this),
            500);

            // Add/update item in the local collection.
            // TK.

            // Configure success-message snackbar:
            var successSnackbarOpts = {
                snackbarClass: 'success',
                text: 'Item successfully saved.',
                action: {
                    promptText: 'Dismiss'
                },
            };

            // Navigate to the index view (or to the same page if save and continue)
            if (mode == 'saveOnly') {
                this._radio.commands.execute('navigate', '', {trigger: true});
            } else if (mode == 'saveAndContinue') {
                this._radio.commands.execute(
                    'navigate',
                    'edit/' + data.packageID + '/',
                    {
                        trigger: true
                    }
                );

                successSnackbarOpts.containerClass = 'edit-page';
            }

            // Display snackbar:
            this._radio.commands.execute(
                'showSnackbar',
                new SnackbarView(successSnackbarOpts)
            );
        },

        saveErrorCallback: function(mode, errorType, errorArgs) {
            // Close this popup and destroy it.
            setTimeout(function() {
                this._radio.commands.execute('destroyModal');
            }.bind(this),
            500);

            // Display snackbar:
            this._radio.commands.execute(
                'showSnackbar',
                new SnackbarView({
                    containerClass: 'edit-page',
                    snackbarClass: 'failure',
                    text: 'Item could not be saved. Try again later.',
                })
            );
        },

        initialize: function() {
            this.isFirstRender = true;
            this.additionalItemCount = 0;

            this._radio = Backbone.Wreqr.radio.channel('global');

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

            this.additionalItems = new AdditionalContentItems();

            this.additionalItems.on('update', function() {
                this.updateBottomButtonVisibility();
            }, this);
        },

        changeColorDot: function(newHubSlug) {
            var newDotColor;

            if (typeof(newHubSlug) == "undefined") {
                newDotColor = '#9E9E9E';
            } else {
                var packageHub = this.options.data.hubs.findWhere({
                    slug: newHubSlug
                });

                newDotColor = packageHub.get('color');
            }


            this.ui.colorDot.css({'background-color': newDotColor});
        },

        serializeData: function() {
            var templateContext = {
                //
            };

            if (typeof(this.options.boundData) != "undefined") {
                var packageHub = this.options.data.hubs.findWhere({
                    slug: this.options.boundData.get('hub')
                });

                templateContext.boundData = this.options.boundData.toJSON();

                if (!_.isUndefined(packageHub) && !_.isNull(packageHub)) {
                    templateContext.boundData.hubColor = packageHub.get('color');
                    templateContext.boundData.hubName = packageHub.get('name');
                }

                if (_.has(this.options.boundData.get('primaryContent'), 'length')) {
                    templateContext.formattedLength = parseInt(
                        this.options.boundData.get('primaryContent').length,
                        10
                    );
                }

                if (this.options.boundData.has('pubDate')) {
                    var pubDateObj = this.options.boundData.get('pubDate');

                    if (_.contains(['m', 'w', 'd', 't'], pubDateObj.resolution)) {
                        var datetimeConverted = moment.unix(
                                pubDateObj.timestamp
                            ).tz(
                                'America/Chicago'
                            );

                        if (pubDateObj.resolution == 'm') {
                            monthEndFormatted = datetimeConverted.format('MMM D, YYYY');
                            monthStartFormatted = datetimeConverted.add(1, 's').subtract(1, 'M').format('MMM D, YYYY');
                            templateContext.formattedPubDate = monthStartFormatted + ' to ' + monthEndFormatted;
                        } else if (pubDateObj.resolution == 'w') {
                            weekEndFormatted = datetimeConverted.format('MMM D, YYYY');
                            weekStartFormatted = datetimeConverted.add(1, 's').subtract(1, 'w').format('MMM D, YYYY');
                            templateContext.formattedPubDate = weekStartFormatted + ' to ' + weekEndFormatted;
                        } else if (pubDateObj.resolution == 'd') {
                            templateContext.formattedPubDate = datetimeConverted.format('MMM D, YYYY');
                        } else if (pubDateObj.resolution == 't') {
                            templateContext.formattedPubDate = datetimeConverted.format('MMM D, YYYY');
                            templateContext.formattedPubTime = datetimeConverted.format('HH:mm');
                        }
                    }
                }
            }

            return templateContext;
        },

        generateHubOptions: function() {
            var choices = [],
                hubGroupsRaw = [],
                hubGroups;

            this.options.data.hubs.each(function(hub) {
                var hubVertical = hub.get('vertical');

                choices.push({
                    name: hub.get('name'),
                    type: hubVertical.slug,
                    value: hub.get('slug')
                });

                if (!_.contains(_.pluck(hubGroupsRaw, 'value'), hubVertical.slug)) {
                    hubGroupsRaw.push({
                        name: hubVertical.name,
                        value: hubVertical.slug,
                    });
                }
            });

            hubGroups = _.map(
                _.sortBy(hubGroupsRaw, 'value'),
                function(obj, index) {
                    obj.$order = index + 1;
                    return obj;
                }
            );

            return {
                options: choices,
                optgroups: hubGroups
            };
        },

        generateTypeChoices: function() {
            var choices = [];

            _.each(settings.contentTypes, function(v, k, i) {
                choices.push({
                    name: v.verboseName,
                    order: v.order,
                    value: k
                });
            });

            return _.map(
                _.sortBy(choices, 'order'),
                function(choice) {
                    return _.omit(choice, 'order');
                }
            );
        },

        hideLengthAttribute: function() {
            if (!this.ui.lengthField.is(':disabled')) {
                this.ui.lengthField.prop('disabled', true);
            }

            if (!this.ui.lengthGroup.is(':hidden')) {
                this.ui.lengthGroup.fadeOut(140);
            }
        },

        showLengthAttribute: function() {
            if (this.ui.lengthField.is(':disabled')) {
                this.ui.lengthField.prop('disabled', false);
            }

            if (this.ui.lengthGroup.is(':hidden')) {
                this.ui.lengthGroup.fadeIn(280);
            }
        },

        generateStafferChoices: function() {
            var choices = [];

            this.options.data.staffers.each(function(staffer) {
                choices.push({
                    name: staffer.get('fullName'),
                    value: staffer.get('email')
                });
            });

            return choices;
        },

        hideDatePicker: function() {
            if (!this.ui.pubDateField.is(':disabled')) {
                this.ui.pubDateField.prop('disabled', true);
            }

            if (!this.ui.pubDateGroup.is(':hidden')) {
                this.ui.pubDateGroup.fadeOut(140);
            }
        },

        showDatePicker: function() {
            if (this.ui.pubDateField.is(':disabled')) {
                this.ui.pubDateField.prop('disabled', false);
            }

            if (this.ui.pubDateGroup.is(':hidden')) {
                this.ui.pubDateGroup.fadeIn(280);
            }
        },

        destroyCurrentDatePicker: function() {
            if (
                (typeof(this.ui.pubDateField.data('dateRangePicker')) != "undefined") &&
                (this.ui.pubDateField.data('dateRangePicker') !== '')
            ) {
                this.ui.pubDateField.data('dateRangePicker').destroy();
                this.ui.pubDateField.val('');
            }
        },

        hideTimePicker: function() {
            if (!this.ui.pubTimeField.is(':disabled')) {
                this.ui.pubTimeField.prop('disabled', true);
            }

            if (!this.ui.pubTimeGroup.is(':hidden')) {
                this.ui.pubTimeGroup.fadeOut(140);
            }
        },

        showTimePicker: function() {
            if (this.ui.pubTimeField.is(':disabled')) {
                this.ui.pubTimeField.prop('disabled', false);
            }

            if (this.ui.pubTimeGroup.is(':hidden')) {
                this.ui.pubTimeGroup.fadeIn(280);
            }
        },

        addNewAdditionalItem: function() {
            this.additionalItemCount++;

            this.additionalItems.add([{
                formID: 'additionalUnbound' + this.additionalItemCount,
            }]);
        },

        updateBottomButtonVisibility: function() {
            if (this.additionalItems.length > 1) {
                if (this.ui.bottomButtonHolder.is(':hidden')) {
                    this.ui.bottomButtonHolder.show();
                }
            } else {
                if (!this.ui.bottomButtonHolder.is(':hidden')) {
                    this.ui.bottomButtonHolder.hide();
                }
            }
        },

        onRender: function() {
            if (this.isFirstRender) {
                this.isFirstRender = false;

                if (_.has(this.options, 'boundData')) {
                    if (
                        this.options.boundData.has('pubDate') &&
                        _.has(this.options.boundData.get('pubDate'), 'resolution') &&
                        _.contains(
                            ['m','w','d','t'],
                            this.options.boundData.get('pubDate').resolution
                        )
                    ) {
                        this.initializeDatePicker(
                            this.options.boundData.get('pubDate').resolution
                        );
                    }
                }

                this.ui.persistentButton.addClass('click-init');
            }

            this.stafferChoices = this.generateStafferChoices();
            this.typeChoices = this.generateTypeChoices();

            this.additionalContentView = new AdditionalFormHolderView({
                collection: this.additionalItems,
                stafferChoices: this.stafferChoices,
                typeChoices: this.typeChoices,
                staffers: this.options.data.staffers,
            });

            if (!_.isUndefined(this.options.boundData)) {
                if (!_.isEmpty(this.options.boundData.get('additionalContent'))) {
                    _.each(this.options.boundData.get('additionalContent'), function(additionalItem) {
                        this.additionalItems.add([{
                            formID: 'additionalBound' + additionalItem.id,
                            boundData: additionalItem,
                        }]);
                    }, this);
                }
            }

            this.addNewAdditionalItem();

            this.showChildView('additionalContentHolder', this.additionalContentView);
            // this.showChildView('searchBox', this.searchBoxView);

            // this.showChildView('packages', this.collectionView);
            expandingTextField.make(this.ui.budgetLineField);
            // expandingTextField.make(this.ui.notesFieldf);

            var hubOptions = this.generateHubOptions();

            this.ui.hubDropdown.selectize({
                closeAfterSelect: true,
                maxItems: 1,
                openOnFocus: true,
                plugins: ['restore_on_backspace'],
                // selectOnTab: true,

                options: hubOptions.options,
                labelField: 'name',
                optgroupField: 'type',
                searchField: ['name',],
                valueField: 'value',

                optgroups: hubOptions.optgroups,
                // lockOptgroupOrder: true,
                optgroupLabelField: 'name',
                optgroupValueField: 'value',

                render: {
                    item: function(data, escape) {
                        var dataType = 'fullText';
                        if (typeof(data.type) != "undefined") {
                            dataType = data.type;
                        }
                        return '<div data-value="' + data.value + '" data-type="' + dataType + '" class="selected-item">' + data.name + '</div>';
                    }
                },
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
                onItemAdd: function(value, $item) {
                    this.changeColorDot($item.data('value'));
                }.bind(this),
                onItemRemove: function(value) {
                    this.changeColorDot();
                }.bind(this)
            });

            this.ui.typeDropdown.selectize({
                closeAfterSelect: true,
                maxItems: 1,
                openOnFocus: true,
                plugins: ['restore_on_backspace'],
                // selectOnTab: true,

                options: this.typeChoices,
                labelField: 'name',
                searchField: ['name',],
                valueField: 'value',

                render: {
                    item: function(data, escape) {
                        var dataType = 'fullText';
                        if (typeof(data.type) != "undefined") {
                            dataType = data.type;
                        }
                        return '<div data-value="' + data.value + '" class="selected-item">' + data.name + '</div>';
                    }
                },
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
                onItemAdd: function(value, $item) {
                    var typeConfig = settings.contentTypes[$item.data('value')];

                    if (typeConfig.usesLengthAttribute) {
                        this.showLengthAttribute();
                    } else {
                        this.hideLengthAttribute();
                    }
                }.bind(this),
                onItemRemove: function(value) {
                    var typeConfig = settings.contentTypes[value];

                    if (typeConfig.usesLengthAttribute) {
                        this.hideLengthAttribute();
                    }
                }.bind(this)
            });

            this.ui.authorsDropdown.selectize({
                // closeAfterSelect: true,
                openOnFocus: true,
                plugins: ['remove_button', 'restore_on_backspace'],
                // selectOnTab: true,

                options: this.stafferChoices,
                labelField: 'name',
                searchField: ['name',],
                valueField: 'value',

                render: {
                    item: function(data, escape) {
                        var dataType = 'fullText';
                        if (typeof(data.type) != "undefined") {
                            dataType = data.type;
                        }
                        return '<div data-value="' + data.value + '" class="selected-item-multichoice">' + data.name + '</div>';
                    }
                },
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
                onItemAdd: function(value, $item) {
                    // var typeConfig = settings.contentTypes[$item.data('value')];

                    // if (typeConfig.usesLengthAttribute) {
                    //     this.showLengthAttribute();
                    // } else {
                    //     this.hideLengthAttribute();
                    // }
                }.bind(this),
                onItemRemove: function(value) {
                    // var typeConfig = settings.contentTypes[value];

                    // if (typeConfig.usesLengthAttribute) {
                    //     this.hideLengthAttribute();
                    // }
                }.bind(this)
            });

            this.ui.editorsDropdown.selectize({
                // closeAfterSelect: true,
                openOnFocus: true,
                plugins: ['remove_button', 'restore_on_backspace'],
                // selectOnTab: true,

                options: this.stafferChoices,
                labelField: 'name',
                searchField: ['name',],
                valueField: 'value',

                render: {
                    item: function(data, escape) {
                        var dataType = 'fullText';
                        if (typeof(data.type) != "undefined") {
                            dataType = data.type;
                        }
                        return '<div data-value="' + data.value + '" class="selected-item-multichoice">' + data.name + '</div>';
                    }
                },
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
                onItemAdd: function(value, $item) {
                    // var typeConfig = settings.contentTypes[$item.data('value')];

                    // if (typeConfig.usesLengthAttribute) {
                    //     this.showLengthAttribute();
                    // } else {
                    //     this.hideLengthAttribute();
                    // }
                }.bind(this),
                onItemRemove: function(value) {
                    // var typeConfig = settings.contentTypes[value];

                    // if (typeConfig.usesLengthAttribute) {
                    //     this.hideLengthAttribute();
                    // }
                }.bind(this)
            });

            this.ui.pubDateResolution.selectize({
                closeAfterSelect: true,
                maxItems: 1,
                openOnFocus: true,
                plugins: ['restore_on_backspace'],
                // selectOnTab: true,

                options: [
                    {
                        name: 'Month only',
                        value: 'm'
                    },
                    {
                        name: 'Week only',
                        value: 'w'
                    },
                    {
                        name: 'Day only',
                        value: 'd'
                    },
                    {
                        name: 'Day & time',
                        value: 't'
                    }
                ],
                labelField: 'name',
                searchField: ['name',],
                valueField: 'value',

                render: {
                    item: function(data, escape) {
                        var dataType = 'fullText';
                        if (typeof(data.type) != "undefined") {
                            dataType = data.type;
                        }
                        return '<div data-value="' + data.value + '" class="selected-item">' + data.name + '</div>';
                    }
                },
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
                onItemAdd: function(value, $item) {
                    var scheduleType = $item.data('value');

                    this.initializeDatePicker(scheduleType);
                }.bind(this),
                onItemRemove: function(value) {
                    this.hideDatePicker();
                    this.hideTimePicker();

                    this.destroyCurrentDatePicker();
                }.bind(this)
            });

            CKEDITOR.replace(app.rootView.mainView.ui.notesField[0], {
                skin: 'minimalist,http://interactives.dallasnews.com/budget-assets/skins/minimalist/',
                contentsCss: [
                    'http://fonts.googleapis.com/css?family=PT+Serif:400,700%7CSource+Sans+Pro:400,700,900,600',
                    'http://interactives.dallasnews.com/budget-assets/content.css'
                ],
                font_style: {
                    element: 'span',
                    styles: {'font-family': '#(Roboto)'},
                    overrides: [{ element: 'font', attributes: {'face' : null }}]
                },
                fontSize_sizes: '16/16px;24/24px;48/48px;',
                toolbarGroups: [
                    {name: 'basicstyles', groups: ['basicstyles', 'styles', 'cleanup']},
                    {name: 'forms', groups: ['forms']},
                    {name: 'paragraph', groups: ['list',  'blocks', 'align', 'bidi', 'paragraph']},
                    {name: 'links', groups: ['links']},
                    {name: 'clipboard', groups: ['clipboard', 'undo']},
                ],
                removeButtons: 'Styles,Subscript,Superscript,Cut,Copy,Paste,PasteText,PasteFromWord,Scayt,Anchor,Source,Maximize,About,Image,Table,HorizontalRule,SpecialChar',
                removePlugins: 'elementspath'
            });

            this.richNotesField = CKEDITOR.instances.notes;
        },

        initializeDatePicker: function(dateMode) {
            if (dateMode == 'm') {
                this.showDatePicker();
                this.hideTimePicker();

                this.destroyCurrentDatePicker();

                var monthOptions = _.clone(datePickerOptions);
                monthOptions.batchMode = 'month';

                this.ui.pubDateField.dateRangePicker(monthOptions);
            } else if (dateMode == 'w') {
                this.showDatePicker();
                this.hideTimePicker();

                this.destroyCurrentDatePicker();

                var weekOptions = _.clone(datePickerOptions);
                weekOptions.batchMode = 'week';

                this.ui.pubDateField.dateRangePicker(weekOptions);
            } else if (dateMode == 'd') {
                this.showDatePicker();
                this.hideTimePicker();

                this.destroyCurrentDatePicker();

                var dayOptions = _.clone(datePickerOptions);
                dayOptions.singleDate = true;

                this.ui.pubDateField.dateRangePicker(dayOptions);
            } else if (dateMode == 't') {
                this.showDatePicker();
                this.showTimePicker();

                this.destroyCurrentDatePicker();

                var dayTimeOptions = _.clone(datePickerOptions);
                dayTimeOptions.singleDate = true;

                this.ui.pubDateField.dateRangePicker(dayTimeOptions);
            }
        },

        serializeForm: function() {
            var rawFormData = {};

            _.each(
                this.ui.packageForm.find("[data-form]"),
                function(field) {
                    if (!field.disabled && !field.readOnly) {
                        var formTypeKey = field.dataset.form + 'Fields';
                        if (!_.has(rawFormData, formTypeKey)) {
                            rawFormData[formTypeKey] = {};
                        }

                        if (field.type == 'checkbox') {
                            rawFormData[formTypeKey][field.name] = field.checked;
                        } else if (field.type == 'radio') {
                            if (!_.has(rawFormData[formTypeKey], field.name)) {
                                rawFormData[formTypeKey][field.name] = null;
                            }

                            if (field.checked) {
                                rawFormData[formTypeKey][field.name] = field.value;
                            }
                        } else {
                            rawFormData[formTypeKey][field.name] = field.value;
                        }
                    }
                }
            );

            var finalPackage = {},
                finalPrimaryItem = {},
                additionalContentItems = [];

            // Package-wide processing.
console.log(this.richNotesField.getData());
            finalPackage.hub = rawFormData.packageFields.hub;
            finalPackage.URL = null;
            finalPackage.notes = this.richNotesField.getData();
            finalPackage.id = rawFormData.packageFields.package_id;
            finalPackage.createdBy = null;
            finalPackage.lastChangedBy = null;

            if (_.has(rawFormData.packageFields, 'headline1')) {
                finalPackage.headlineCandidates = [];

                _.each(
                    [
                        rawFormData.packageFields.headline1,
                        rawFormData.packageFields.headline2,
                        rawFormData.packageFields.headline3,
                        rawFormData.packageFields.headline4
                    ],
                    function(hed, i) {
                        var headlineID = this.ui.packageForm.find('#headline' + (i + 1)).data('headline-id');

                        if (typeof(hed) != 'undefined' && hed !== '') {
                            finalPackage.headlineCandidates.push({
                                'text': hed,
                                'id': headlineID
                            });
                        }
                    },
                    this
                );

                if (rawFormData.packageFields.headlinesReady) {
                    finalPackage.headlineStatus = 'voting';
                } else {
                    finalPackage.headlineStatus = 'drafting';
                }
            } else if (_.has(rawFormData.packageFields, 'headlineChoices')) {
                finalPackage.headlineCandidates = [];

                this.ui.packageForm.find("[name='headlineChoices']").each(
                    function(index, element) {

                        if (element.id != 'headlineOther') {
                            var headlineConfig = {
                                text: element.parentElement.getElementsByTagName('span')[0].innerHTML,
                                id: element.value
                            };

                            if (!_.isNull(rawFormData.packageFields.headlineChoices)) {
                                if (element.value == rawFormData.packageFields.headlineChoices) {
                                    headlineConfig.winner = true;
                                }
                            }

                            finalPackage.headlineCandidates.push(headlineConfig);
                        }
                    }
                );

                if (_.isNull(rawFormData.packageFields.headlineChoices)) {
                    finalPackage.headlineStatus = 'voting';
                } else {
                    finalPackage.headlineStatus = 'finalized';
                }
            }

            finalPackage.pubDate = {
                resolution: rawFormData.packageFields.pub_date_resolution
            };

            if (rawFormData.packageFields.pub_date_resolution == 'm') {
                var endOfMonthString = rawFormData.packageFields.pub_date.split(' to ')[1],
                    endOfMonth = moment.tz(
                        endOfMonthString + ' 23:59:59',
                        'MMM D, YYYY HH:mm:ss',
                        'America/Chicago'
                    );

                finalPackage.pubDate.timestamp = endOfMonth.unix();
                finalPackage.pubDate.formatted = endOfMonth.format('MMMM YYYY');
            } else if (rawFormData.packageFields.pub_date_resolution == 'w') {
                var endOfWeekString = rawFormData.packageFields.pub_date.split(' to ')[1],
                    endOfWeek = moment.tz(
                        endOfWeekString + ' 23:59:59',
                        'MMM D, YYYY HH:mm:ss',
                        'America/Chicago'
                    );

                finalPackage.pubDate.timestamp = endOfWeek.unix();
                finalPackage.pubDate.formatted = 'Week of ' + endOfWeek.format('MMM D, YYYY');
            } else if (rawFormData.packageFields.pub_date_resolution == 'd') {
                var endOfDay = moment.tz(
                    rawFormData.packageFields.pub_date + ' 23:59:59',
                    'MMM D, YYYY HH:mm:ss',
                    'America/Chicago'
                );

                finalPackage.pubDate.timestamp = endOfDay.unix();
                finalPackage.pubDate.formatted = endOfDay.format('MMM D, YYYY');
            } else if (rawFormData.packageFields.pub_date_resolution == 't') {
                var chosenDate = moment.tz(
                    rawFormData.packageFields.pub_date + ' ' + rawFormData.packageFields.pub_time,
                    'MMM D, YYYY HH:mm',
                    'America/Chicago'
                );

                finalPackage.pubDate.timestamp = chosenDate.unix();
                finalPackage.pubDate.formatted = chosenDate.format('MMM D, YYYY h:mm a');
            }

            finalPackage.primaryContent = finalPrimaryItem;


            // Primary content item processing.

            finalPrimaryItem.id = rawFormData.primaryFields.primary_id;
            finalPrimaryItem.slug = rawFormData.primaryFields.slug;
            finalPrimaryItem.type = rawFormData.primaryFields.type;
            finalPrimaryItem.budgetLine = rawFormData.primaryFields.budget_line;

            if (_.has(rawFormData.primaryFields, 'length')) {
                finalPrimaryItem.length = rawFormData.primaryFields.length;
            }

            if (rawFormData.primaryFields.authors !== '') {
                finalPrimaryItem.authors = _.map(
                    rawFormData.primaryFields.authors.split(','),
                    function(authorEmail) {
                        return this.options.data.staffers.findWhere({'email': authorEmail}).toJSON();
                    }.bind(this)
                );
            }

            if (rawFormData.primaryFields.editors !== '') {
                finalPrimaryItem.editors = _.map(
                    rawFormData.primaryFields.editors.split(','),
                    function(editorEmail) {
                        return this.options.data.staffers.findWhere({'email': editorEmail}).toJSON();
                    }.bind(this)
                );
            }


            // Additional content item processing.
            finalPackage.additionalContent = additionalContentItems;

            this.additionalContentView.children.each(function(additionalItemView) {
                var serializedItem = additionalItemView.serializeForm();

                if (!_.isEmpty(serializedItem)) {
                    additionalContentItems.push(serializedItem);
                }
            });

            return finalPackage;
        }
    });
});
