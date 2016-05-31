define([
    'backbone',
    'dateRangePicker',
    'jquery',
    'marionette',
    'moment',
    'moment-timezone',
    'quill',
    'selectize',
    'underscore',
    'underscore.string',
    'common/date-picker-options',
    'common/settings',
    'common/tpl',
    'budget/collections/additional-content-items',
    'budget/itemviews/additional-content/additional-form',
    'budget/itemviews/modals/modal-window.js',
    'budget/itemviews/snackbars/snackbar.js',
    'budget/misc/urls',
    'utils/expanding-text-field'
], function(
    Backbone,
    dateRangePicker,
    $,
    Mn,
    moment,
    mmtz,
    Quill,
    selectize,
    _,
    _string_,
    datePickerOptions,
    settings,
    tpl,
    AdditionalContentItems,
    AdditionalContentForm,
    ModalView,
    SnackbarView,
    urlConfig,
    expandingTextField
) {
    return Mn.CompositeView.extend({
        id: 'package-edit',
        template: tpl('packages-edit'),

        childView: AdditionalContentForm,
        childViewContainer: "#additional-content-children",
        childViewOptions: function(model, index) {
            var primarySlug;

            if (_.has(this, 'model') && this.model.has('primaryContent')) {
                primarySlug = this.model.get('primaryContent').slug;
            }

            return this.generateChildViewOptions(primarySlug);
        },

        generateChildViewOptions: function(primarySlug) {
            var opts = {
                stafferChoices: this.enumerateStafferChoices(),
                staffers: this.options.data.staffers,
                typeChoices: this.enumerateTypeChoices(),
            };

            if (!_.isUndefined(primarySlug)) {
                opts.primarySlug = primarySlug;
            } else {
                opts.primarySlug = '[main-slug]';
            }

            return opts;
        },

        ui: {
            colorDot: '.single-page .package-header .color-dot',
            packageTitle: '.single-page .package-header h1',
            packageForm: '#package-form',
            packageErrors: '#package-form .error-message',
            slugField: '#package-form #slug_key',
            hubDropdown: '#package-form #hub',
            typeDropdown: '#package-form #type',
            lengthGroup: '#package-form .length-group',
            lengthField:  '#package-form #length',
            pitchLinkGroup: '#package-form .request-link-group',
            addRequestButton: '#package-form .request-link-group .button',
            budgetLineField: '#package-form #budget_line',
            authorsDropdown: '#package-form #authors',
            editorsDropdown: '#package-form #editors',
            pubDateResolution: '#package-form #pub_date_resolution',
            pubDateGroup: '#package-form .pub-date-group',
            pubDateField: '#package-form #pub_date',
            pubTimeGroup: '#package-form .pub-time-group',
            pubTimeField: '#package-form #pub_time',
            collapsibleRowHeaders: '#package-form .collapsible-row-header',
            collapsibleRows: '#package-form .can-collapse',
            notesField: '#package-form #notes-quill .text-holder',
            notesToolbar: '#package-form #notes-quill .toolbar-holder',
            printRunDateField: '#package-form #print_run_date',
            addAdditionalItemTrigger: '.single-page .add-additional-content-trigger',
            bottomButtonHolder: '.single-page .bottom-button-holder',
            persistentHolder: '.edit-bar .button-holder',
            persistentButton: '.edit-bar .button-holder .button',
            packageDeleteTrigger: '.edit-bar .button-holder .button.delete-trigger',
            packageSaveTrigger: '.edit-bar .button-holder .button.save-trigger',
            packageSaveAndContinueEditingTrigger: '.edit-bar .button-holder .button.save-and-continue-editing-trigger'
        },

        modelEvents: {
            'change': 'onModelChange'
            // 'sync': 'render'
        },

        events: {
            'mousedown @ui.addRequestButton': 'addButtonClickedClass',
            'click @ui.addRequestButton': 'openVisualsRequestForm',
            'click @ui.collapsibleRowHeaders': 'toggleCollapsibleRow',
            'click @ui.addAdditionalItemTrigger': 'addNewAdditionalItem',
            'mousedown @ui.persistentButton': 'addButtonClickedClass',
            'click @ui.packageSaveTrigger': 'savePackage',
            'click @ui.packageSaveAndContinueEditingTrigger': 'savePackageAndContinueEditing',
            'click @ui.packageDeleteTrigger': 'deleteEntirePackage'
        },

        initialize: function() {
            this.isFirstRender = true;

            this._radio = Backbone.Wreqr.radio.channel('global');

            /* Prior-path capturing. */

            var priorViewName = this._radio.reqres.request(
                'getState',
                'meta',
                'listViewType'
            );

            this.priorPath = '/';
            if (
                !_.isUndefined(priorViewName) &&
                _.has(urlConfig, priorViewName)
            ) {
                this.priorPath = urlConfig[priorViewName].reversePattern;
            }


            /* Moment.js configuration. */

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


            /* Choice generation for selectize lists. */

            this.hubChoices = this.enumerateHubChoices();

            this.typeChoices = this.enumerateTypeChoices();

            this.stafferChoices = this.enumerateStafferChoices();


            /* Additional-content holding initialization. */

            this.additionalItemCount = 0;


            /* Main model initialization. */

            this.options.initFinishedCallback(this);
        },

        serializeData: function() {
            var templateContext = {};

            if (_.has(this, 'model')) {
                var packageHub = this.options.data.hubs.findWhere({
                    slug: this.model.get('hub')
                });

                templateContext.packageData = this.model.toJSON();

                templateContext.primaryContentType = settings.contentTypes[
                    this.model.get('primaryContent').type
                ];

                if (!_.isUndefined(packageHub) && !_.isNull(packageHub)) {
                    templateContext.hub = {
                        color: packageHub.get('color'),
                        name: packageHub.get('name')
                    };
                }

                if (_.has(this.model.get('primaryContent'), 'length')) {
                    templateContext.formattedLength = parseInt(
                        this.model.get('primaryContent').length,
                        10
                    );
                }

                if (this.model.has('pubDate')) {
                    var pubDateObj = this.model.get('pubDate');

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

                if (
                    this.model.has('printPlacement') &&
                    _.has(this.model.get('printPlacement'), 'printRunDate') &&
                    !_.isNull(this.model.get('printPlacement').printRunDate)
                ) {
                    templateContext.formattedPrintRunDate = moment(
                        this.model.get('printPlacement').printRunDate,
                        'YYYY-MM-DD'
                    ).format('MMM D, YYYY');
                }
            }

            // TK: Loop through the currently-selected print-placement values,
            // adding an 'isSelected: true' value to the template context.
            templateContext.placementChoices = _.map(
                settings.printPlacementTypes,
                function(placementConfig) {
                    var configFinalized = _.chain(placementConfig)
                                                .omit('order')
                                                .clone()
                                                .value();

                    if (
                        _.has(this, 'model') &&
                        this.model.has('printPlacement') &&
                        _.contains(
                            this.model.get('printPlacement').printPlacements,
                            configFinalized.slug
                        )
                    ) {
                        configFinalized.isChecked = true;
                    }

                    return configFinalized;
                }.bind(this)
            );

            templateContext.visualsRequestURL = settings.externalURLs.addVisualsRequest;

            return templateContext;
        },

        onModelChange: function() {
            this.collection.reset();

            this.updateCollection().render();
        },

        updateCollection: function(argument) {
            if (!_.isUndefined(this.model)) {
                if (!_.isEmpty(this.model.get('additionalContent'))) {
                    _.each(
                        this.model.get('additionalContent'),
                        function(additionalItem) {
                            this.collection.add([additionalItem]);
                        }.bind(this)
                    );
                }
            }

            return this;
        },

        onBeforeRender: function() {
            this.updateCollection();
        },

        onRender: function() {
            if (this.isFirstRender) {
                this.isFirstRender = false;

                this.collection.on(
                    'update',
                    this.updateBottomButtonVisibility.bind(this)
                );
            }

            this.ui.persistentButton.addClass('click-init');

            // Uncomment this line to have an unbound form on every edit page
            // (the JS equivalent of Django's 'inline.EXTRA=1').
            // this.addNewAdditionalItem();
        },

        onDomRefresh: function() {
            this.initializeSlugField();
            this.updateSlugGroup();
            this.initializeHubDropdown();
            this.initializeTypeDropdown();
            expandingTextField.make(this.ui.budgetLineField);
            this.initializeAuthorDropdown();
            this.initializeEditorDropdown();
            this.initializePubDateResolutionDropdown();
            this.initializePrintRunDatePicker();

            if (!_.isUndefined(this.model)) {
                if (
                    this.model.has('pubDate') &&
                    _.has(this.model.get('pubDate'), 'resolution') &&
                    _.contains(['m','w','d','t'], this.model.get('pubDate').resolution)
                ) {
                    this.initializeDatePicker(
                        this.model.get('pubDate').resolution
                    );
                }
            }

            this.ui.packageForm.find('.row.can-collapse').each(function() {
                var $thisEl = $(this);

                $thisEl.data('expanded-height', $thisEl.outerHeight());

                $thisEl.addClass('collapse-enabled');
            });

            this.richNotesField = new Quill(this.ui.notesField.selector, {
                modules: {
                    toolbar: this.ui.notesToolbar.selector,
                    'link-tooltip': true
                },
                theme: 'snow'
            });
        },


        /*
         *   Choice enumerators.
         */

        enumerateHubChoices: function() {
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

        enumerateTypeChoices: function() {
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

        enumerateStafferChoices: function() {
            var choices = [];

            this.options.data.staffers.each(function(staffer) {
                choices.push({
                    name: staffer.get('fullName'),
                    value: staffer.get('email')
                });
            });

            return choices;
        },


         /*
         *   Control initializers (for selectize boxes, datepickers, etc.).
         */

        initializeSlugField: function() {
            var slugField = this.ui.slugField;

            slugField.bind(
                'focus',
                function() {
                    slugField.closest('.slug-group-holder').addClass('input-focused');
                }
            );

            slugField.bind(
                'blur',
                function() {
                    slugField.closest('.slug-group-holder').removeClass('input-focused');
                }
            );

            slugField.bind(
                'input',
                function() {
                    var formGroup = slugField.closest('.form-group');

                    if (slugField.val().match(/[^a-z0-9\-]/)) {
                        if (!formGroup.hasClass('has-error')) {
                            formGroup.addClass('has-error');
                        }

                        formGroup.find('.form-help').html(
                            'Please use only lowercase letters, numbers and hyphens in slugs.'
                        );
                    } else if (slugField.val().length > 20) {
                        if (!formGroup.hasClass('has-error')) {
                            formGroup.addClass('has-error');
                        }

                        formGroup.find('.form-help').html(
                            'Please keep your slug to 20 characters or less.'
                        );
                    } else {
                        if (formGroup.hasClass('has-error')) {
                            formGroup.removeClass('has-error');
                        }

                        formGroup.find('.form-help').html('');
                    }

                    slugField.siblings('.keyword-value').html(slugField.val());

                    if ($.trim(slugField.val())) {
                    } else {
                        slugField.siblings('.keyword-value').html(
                            slugField.attr('placeholder')
                        );
                    }

                    this.updatePackageTitle();
                }.bind(this)
            );
        },

        initializeHubDropdown: function() {
            this.ui.hubDropdown.selectize({
                closeAfterSelect: true,
                maxItems: 1,
                openOnFocus: true,
                plugins: ['restore_on_backspace'],
                // selectOnTab: true,

                options: this.hubChoices.options,
                labelField: 'name',
                optgroupField: 'type',
                searchField: ['name',],
                valueField: 'value',

                optgroups: this.hubChoices.optgroups,
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
                    this.updatePackageTitle(value);
                    this.updateSlugGroup(value);
                }.bind(this),
                onItemRemove: function(value) {
                    this.changeColorDot();
                    this.updatePackageTitle();
                    this.updateSlugGroup();
                }.bind(this)
            });
        },

        initializeTypeDropdown: function() {
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
                        this.showField(this.ui.lengthField, this.ui.lengthGroup);
                    } else {
                        this.hideField(this.ui.lengthField, this.ui.lengthGroup);
                    }

                    if (typeConfig.usesPitchSystem) {
                        this.showField(null, this.ui.pitchLinkGroup);
                    } else {
                        this.hideField(null, this.ui.pitchLinkGroup);
                    }
                }.bind(this),
                onItemRemove: function(value) {
                    var typeConfig = settings.contentTypes[value];

                    if (typeConfig.usesLengthAttribute) {
                        this.hideField(this.ui.lengthField, this.ui.lengthGroup);
                    } else if (typeConfig.usesPitchSystem) {
                        this.hideField(null, this.ui.pitchLinkGroup);
                    }

                }.bind(this)
            });
        },

        initializeAuthorDropdown: function() {
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
                    //     this.showField(this.ui.lengthField, this.ui.lengthGroup);
                    // } else {
                    //     this.hideField(this.ui.lengthField, this.ui.lengthGroup);
                    // }
                }.bind(this),
                onItemRemove: function(value) {
                    // var typeConfig = settings.contentTypes[value];

                    // if (typeConfig.usesLengthAttribute) {
                    //     this.hideField(this.ui.lengthField, this.ui.lengthGroup);
                    // }
                }.bind(this)
            });
        },

        initializeEditorDropdown: function() {
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
                    //     this.showField(this.ui.lengthField, this.ui.lengthGroup);
                    // } else {
                    //     this.hideField(this.ui.lengthField, this.ui.lengthGroup);
                    // }
                }.bind(this),
                onItemRemove: function(value) {
                    // var typeConfig = settings.contentTypes[value];

                    // if (typeConfig.usesLengthAttribute) {
                    //     this.hideField(this.ui.lengthField, this.ui.lengthGroup);
                    // }
                }.bind(this)
            });
        },

        initializePubDateResolutionDropdown: function() {
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
                    this.hideField(this.ui.pubDateField, this.ui.pubDateGroup);
                    this.hideField(this.ui.pubTimeField, this.ui.pubTimeGroup);

                    this.destroyCurrentDatePicker();
                }.bind(this)
            });
        },

        initializeDatePicker: function(dateMode) {
            if (dateMode == 'm') {
                this.showField(this.ui.pubDateField, this.ui.pubDateGroup);
                this.hideField(this.ui.pubTimeField, this.ui.pubTimeGroup);

                this.destroyCurrentDatePicker();

                var monthOptions = _.clone(datePickerOptions);
                monthOptions.batchMode = 'month';

                this.ui.pubDateField.dateRangePicker(monthOptions).bind(
                    'datepicker-change',
                    function() {
                        this.updatePackageTitle();
                        this.updateSlugGroup();
                    }.bind(this)
                );
            } else if (dateMode == 'w') {
                this.showField(this.ui.pubDateField, this.ui.pubDateGroup);
                this.hideField(this.ui.pubTimeField, this.ui.pubTimeGroup);

                this.destroyCurrentDatePicker();

                var weekOptions = _.clone(datePickerOptions);
                weekOptions.batchMode = 'week';

                this.ui.pubDateField.dateRangePicker(weekOptions).bind(
                    'datepicker-change',
                    function() {
                        this.updatePackageTitle();
                        this.updateSlugGroup();
                    }.bind(this)
                );
            } else if (dateMode == 'd') {
                this.showField(this.ui.pubDateField, this.ui.pubDateGroup);
                this.hideField(this.ui.pubTimeField, this.ui.pubTimeGroup);

                this.destroyCurrentDatePicker();

                var dayOptions = _.clone(datePickerOptions);
                dayOptions.singleDate = true;

                this.ui.pubDateField.dateRangePicker(dayOptions).bind(
                    'datepicker-change',
                    function() {
                        this.updatePackageTitle();
                        this.updateSlugGroup();
                    }.bind(this)
                );
            } else if (dateMode == 't') {
                this.showField(this.ui.pubDateField, this.ui.pubDateGroup);
                this.showField(this.ui.pubTimeField, this.ui.pubTimeGroup);

                this.destroyCurrentDatePicker();

                var dayTimeOptions = _.clone(datePickerOptions);
                dayTimeOptions.singleDate = true;

                this.ui.pubDateField.dateRangePicker(dayTimeOptions).bind(
                    'datepicker-change',
                    function() {
                        this.updatePackageTitle();
                        this.updateSlugGroup();
                    }.bind(this)
                );
            }
        },

        initializePrintRunDatePicker: function() {
            var dayOptions = _.clone(datePickerOptions);
            dayOptions.singleDate = true;

            this.ui.printRunDateField.dateRangePicker(dayOptions);
        },

        /*
         * Control modifiers.
         */

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

        updatePackageTitle: function(hubValue) {
            var slugText = this.generateSlugHub(hubValue) +
                            '.' +
                            this.ui.slugField.val() +
                            '.' +
                            this.generateSlugDate();

            this.ui.packageTitle.html(slugText);

            this.children.each(
                function(childView) {
                    childView.options.primarySlug = slugText;
                    // childView.render().trigger('attach');
                }
            );

            this.childViewOptions = function(model, index) {
                return this.generateChildViewOptions(slugText);
            };

            this._renderChildren();
        },

        updateSlugGroup: function(hubValue) {
            var slugField = this.ui.slugField,
                slugGroup = slugField.closest('.slug-group-holder');

            slugGroup.find('.hub-slug-value').html(this.generateSlugHub(hubValue) + '.');

            slugGroup.find('.formatted-date-value').html('.' + this.generateSlugDate());

            var inputPadding = {};

            inputPadding.left = slugGroup.find('.hub-slug-value').width() + 5;
            inputPadding.right = slugGroup.find('.formatted-date-value').width();

            slugField.css({
                'left': -1 * inputPadding.left
            });
            slugField.css({
                'padding-left': inputPadding.left
            });
            slugField.css({
                'padding-right': inputPadding.right
            });
            slugField.css({
                'width': slugGroup.width()
            });
        },

        generateSlugHub: function(hubValue) {
            if (!_.isUndefined(hubValue)) {
                return hubValue;
            } else {
                var hubRaw = this.ui.hubDropdown.val();

                if (!_.isEmpty(hubRaw)) {
                    return hubRaw;
                }
            }

            return 'hub';
        },

        generateSlugDate: function() {
            var dateResolution = this.ui.pubDateResolution.val();

            if (!_.isEmpty(dateResolution)) {
                var rawDate = this.ui.pubDateField.val();

                if (!_.isEmpty(rawDate)) {
                    if (_.contains(['m', 'w'], dateResolution)) {
                        var convertedMonthDate = moment(
                            rawDate.split(' to ')[1],
                            'MMM D, YYYY'
                        );

                        return convertedMonthDate.format('MM--YY');
                    } else {
                        var convertedDate = moment(rawDate, 'MMM D, YYYY');

                        return convertedDate.format('MMDDYY');
                    }
                }
            }

            return 'date';
        },

        hideField: function(fieldCheckDisabled, fieldCheckHidden) {
            if (!_.isNull(fieldCheckDisabled)) {
                if (!fieldCheckDisabled.is(':disabled')) {
                    fieldCheckDisabled.prop('disabled', true);
                }
            }

            if (!fieldCheckHidden.is(':hidden')) {
                fieldCheckHidden.fadeOut(140);
            }
        },

        showField: function(fieldCheckDisabled, fieldCheckHidden) {
            if (!_.isNull(fieldCheckDisabled)) {
                if (fieldCheckDisabled.is(':disabled')) {
                    fieldCheckDisabled.prop('disabled', false);
                }
            }

            if (fieldCheckHidden.is(':hidden')) {
                fieldCheckHidden.fadeIn(280);
            }
        },


        /*
         * Control destructors.
         */

        destroyCurrentDatePicker: function() {
            if (
                (typeof(this.ui.pubDateField.data('dateRangePicker')) != "undefined") &&
                (this.ui.pubDateField.data('dateRangePicker') !== '')
            ) {
                this.ui.pubDateField.data('dateRangePicker').destroy();
                this.ui.pubDateField.val('');
            }
        },


        /*
         *   Event handlers.
         */

        updateBottomButtonVisibility: function() {
            if (this.collection.length > 1) {
                if (this.ui.bottomButtonHolder.is(':hidden')) {
                    this.ui.bottomButtonHolder.show();
                }
            } else {
                if (!this.ui.bottomButtonHolder.is(':hidden')) {
                    this.ui.bottomButtonHolder.hide();
                }
            }
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

        openVisualsRequestForm: function(event) {
            if (event.button === 0 && !(event.ctrlKey || event.metaKey)) {
                event.preventDefault();

                var triggerElement = $(event.currentTarget);

                window.open(triggerElement.find('a').attr('href'), '_blank');
            }
        },

        toggleCollapsibleRow: function(event) {
            var toggleTarget = $(event.currentTarget),
                toggleSlug = toggleTarget.data('expand-target'),
                toggleReceiver = this.ui.collapsibleRows.filter(
                    '[data-expand-receiver="' + toggleSlug + '"]'
                ).first();

            if (toggleReceiver.height() === 0) {
                toggleTarget.find('h4').addClass('section-expanded');

                toggleReceiver.css({
                    'height': toggleReceiver.data('expandedHeight')
                });
            } else {
                toggleTarget.find('h4').removeClass('section-expanded');

                toggleReceiver.css({'height': 0});
            }
        },

        addNewAdditionalItem: function() {
            this.additionalItemCount++;

            this.collection.add([{
                // formID: 'additionalUnbound' + this.additionalItemCount,
            }]);
        },

        savePackage: function() {
            var packageDict = this.serializeForm();

            if (_.isNull(packageDict)) {
                this.raiseFormErrors();
            } else {
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
                    url: settings.apiEndpoints.POST.package.save,
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
            }
        },

        savePackageAndContinueEditing: function() {
            var packageDict = this.serializeForm();

            if (_.isNull(packageDict)) {
                this.raiseFormErrors();
            } else {
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
                    url: settings.apiEndpoints.POST.package.save,
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
            }
        },

        deleteEntirePackage: function() {
            var serializedForm = this.serializeForm();

            if (_.isNull(serializedForm)) {
                this.raiseFormErrors();
            } else {
                // var itemSlugs = _.pluck(serializedForm.additionalContent, 'slug');
                // itemSlugs.unshift(serializedForm.primaryContent.slug);

                var dbPrimarySlug = this.model.get('primaryContent').slug,
                    currentPrimarySlug = this.ui.packageTitle.text(),
                    itemSlugEndings = _.map(
                        this.model.get('additionalContent'),
                        function(additionalItem) {
                            return _.last(
                                additionalItem.slug.split(
                                    dbPrimarySlug + '.'
                                )
                            );
                        }
                    );

                itemSlugEndings.unshift('');

                var itemSlugs = _.map(
                        itemSlugEndings,
                        function(slugEnding) {
                            var slugSuffix = '';

                            if (slugEnding !== '') {
                                slugSuffix = '.' + slugEnding;
                            }

                            return currentPrimarySlug + slugSuffix;
                        }
                    );

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
                                    'packageID': this.model.id
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
                                    url: settings.apiEndpoints.POST.package.delete,
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
            }
        },


        /*
         *   Form error callbacks.
         */

        raiseFormErrors: function() {
            // Add a 'Please fix the errors below.' message to the top of the
            // edit form.
            this.ui.packageErrors.text('Please fix the errors below.');
            this.ui.packageErrors.show();

            // Loop through each required field, adding help text and the
            // 'has-error' class to any one that has no value.
            _.each(
                this.ui.packageForm.find("[data-form][isRequired='true']"),
                function(field) {
                    if (_.isEmpty(field.value)) {
                        var fieldEl = $(field),
                            formGroup = fieldEl.closest('.form-group');

                        formGroup.addClass('has-error');
                        formGroup.find('.form-help').text('This value is required.');

                        fieldEl.on('change changeData', function() {
                            var thisEl = $(this);
                            if (this.value !== '') {
                                thisEl.closest('.form-group').removeClass('has-error');
                                thisEl.closest('.form-group').find('.form-help').text('');
                            }
                        });
                    }
                }
            );
        },


        /*
         *   Save & delete callbacks.
         */

        deleteSuccessCallback: function(data) {
            // Close this popup and destroy it.
            setTimeout(function() {
                this._radio.commands.execute('destroyModal');
            }.bind(this),
            500);

            // Pop item from the local collection.
            // TK.

            // Navigate to the index view
            this._radio.commands.execute(
                'navigate',
                this.priorPath,
                {
                    trigger: true
                }
            );

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

            // Add/update item in the local colle ction.
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
                this._radio.commands.execute(
                    'navigate',
                    this.priorPath,
                    {
                        trigger: true
                    }
                );
            } else if (mode == 'saveAndContinue') {
                if (_.isUndefined(this.model)) {
                    this._radio.commands.execute(
                        'navigate',
                        'edit/' + data.packageID + '/',
                        {
                            trigger: true
                        }
                    );
                } else {
                    this.model.fetch();
                }

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


        /*
         *   Form serializer.
         */

        serializeForm: function() {
            var rawFormData = {};

            var requiredValues = _.map(
                this.ui.packageForm.find("[data-form][isRequired='true']"),
                function(field) {
                    return field.value;
                }
            );

            if (_.compact(requiredValues).length != requiredValues.length) {
                return null;
            } else if (this.ui.slugField.closest('.form-group').hasClass('has-error')) {
                return null;
            } else {
                _.each(
                    this.ui.packageForm.find("[data-form]"),
                    function(field) {
                        if (!field.disabled && !field.readOnly) {
                            var formTypeKey = field.dataset.form + 'Fields';
                            if (!_.has(rawFormData, formTypeKey)) {
                                rawFormData[formTypeKey] = {};
                            }

                            if (field.type == 'checkbox') {
                                if (_string_.endsWith(field.name, '[]')) {
                                    if (field.checked) {
                                        var fieldKey = field.name.substring(
                                            0,
                                            field.name.length - 2
                                        );

                                        if (!_.has(rawFormData[formTypeKey], fieldKey)) {
                                            rawFormData[formTypeKey][fieldKey] = [];
                                        }
                                        rawFormData[formTypeKey][fieldKey].push(field.value);
                                    }
                                } else {
                                    rawFormData[formTypeKey][field.name] = field.checked;
                                }
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
                    additionalContentItems = [],
                    userEmail = this.options.currentUser.email;

                // Package-wide processing.
                finalPackage.hub = rawFormData.packageFields.hub;
                finalPackage.notes = this.richNotesField.getHTML();
                finalPackage.id = rawFormData.packageFields.package_id;
                finalPackage.lastChangedBy = userEmail;

                if (!_.isUndefined(this.model)) {
                    finalPackage.createdBy = userEmail;
                }

                if (!_.isEmpty(rawFormData.packageFields.URL)) {
                    finalPackage.URL = rawFormData.packageFields.URL;
                }

                // Print-placement processing.
                var printPlacement = {};

                printPlacement.isPlacementFinalized = rawFormData.packageFields.is_placement_finalized;

                if (!_.isEmpty(rawFormData.packageFields.print_run_date)) {
                    printPlacement.printRunDate = moment(
                        rawFormData.packageFields.print_run_date,
                        'MMM D, YYYY'
                    ).format('YYYY-MM-DD');
                } else {
                    printPlacement.printRunDate = null;
                }

                printPlacement.pitchedPlacements = [];
                if (_.has(rawFormData.packageFields, 'pitched_placements')) {
                    printPlacement.pitchedPlacements = rawFormData.packageFields.pitched_placements;
                }

                finalPackage.printPlacement = printPlacement;


                // Headline processing.

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
                finalPrimaryItem.slugKey = rawFormData.primaryFields.slug_key;
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

                this.children.each(function(additionalItemView) {
                    var serializedItem = additionalItemView.serializeForm();

                    if (!_.isEmpty(serializedItem)) {
                        additionalContentItems.push(serializedItem);
                    }
                });

                return finalPackage;
            }
        }
    });
});