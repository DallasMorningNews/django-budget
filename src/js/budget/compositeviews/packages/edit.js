define([
    'backbone',
    'datePicker',
    'dateRangePicker',
    'jquery',
    'marionette',
    'moment',
    'moment-timezone',
    'quill',
    'selectize',
    'stickit',
    'underscore',
    'underscore.string',
    'common/settings',
    'common/tpl',
    'budget/itemviews/additional-content/additional-form',
    'budget/itemviews/modals/modal-window.js',
    'budget/itemviews/snackbars/snackbar.js',
    'budget/misc/urls',
    'common/datepicker-language-en_us_apstyle',
    'misc/air-timepicker',
], function(
    Backbone,
    datePicker,
    dateRangePicker,
    $,
    Mn,
    moment,
    mmtz,
    Quill,
    selectize,
    stickit,
    _,
    _string_,
    settings,
    tpl,
    AdditionalContentForm,
    ModalView,
    SnackbarView,
    urlConfig,
    datePickerLocale,
    timePicker  // eslint-disable-line no-unused-vars
) {
    return Mn.CompositeView.extend({
        id: 'package-edit',
        template: tpl('packages-edit'),

        childView: AdditionalContentForm,
        childViewContainer: '#additional-content-children',
        childViewOptions: function(model, index) {  // eslint-disable-line no-unused-vars
            return {
                primarySlug: this.model.generatePackageTitle(),
                staffers: this.options.data.staffers,
                stafferChoices: this.enumerateStafferChoices(),
                typeChoices: this.enumerateTypeChoices(),
            };
        },

        ui: {
            colorDot: '.single-page .package-header .color-dot',
            packageTitle: '.single-page .package-header h1',

packageForm: '#package-form',  // eslint-disable-line indent
packageErrors: '#package-form .error-message',  // eslint-disable-line indent
            hubDropdown: '#package-form #hub',
            typeDropdown: '#package-form #type',
            lengthGroup: '#package-form .length-group',
            lengthField: '#package-form #length',
            pitchLinkGroup: '#package-form .request-link-group',
            addRequestButton: '#package-form .request-link-group .button',
            slugGroup: '#package-form .slug-group-holder',
            slugField: '#package-form .keyword-group input',
            slugPlaceholder: '#package-form .keyword-group .keyword-value',
            budgetLineField: '#package-form #budget_line_holder textarea',
            budgetLinePlaceholder: '#package-form #budget_line_holder .budget-spacer',
            pubDateResolution: '#package-form #pub_date_resolution',
            pubDateGroup: '#package-form .pub-date-group',
            pubDateField: '#package-form #pub_date',
            pubTimeGroup: '#package-form .pub-time-group',
            pubTimeField: '#package-form #pub_time',

            authorsDropdown: '#package-form #authors',
            editorsDropdown: '#package-form #editors',

            collapsibleRowHeaders: '#package-form .collapsible-row-header',
            collapsibleRows: '#package-form .can-collapse',
            headlineGroup: '#package-form #headline-fields',
            headline1: '#package-form #headline-fields #headline1',
            headline2: '#package-form #headline-fields #headline2',
            headline3: '#package-form #headline-fields #headline3',
            headline4: '#package-form #headline-fields #headline4',
            headlineRadio1: '#package-form #headline-fields #headlineRadio1',
            headlineRadio2: '#package-form #headline-fields #headlineRadio2',
            headlineRadio3: '#package-form #headline-fields #headlineRadio3',
            headlineRadio4: '#package-form #headline-fields #headlineRadio4',
            headlineVoteSubmissionToggle: '#package-form #headline-fields #vote-submission-toggle',
            headlineVoteSubmissionToggleInput: '#package-form #vote-submission-toggle input',
            notesField: '#package-form #notes-quill .text-holder',
            notesToolbar: '#package-form #notes-quill .toolbar-holder',
            publishingGroup: '#package-form #publishing-fields',
            urlField: '#package-form #url',
            printRunDateStartField: '#package-form #print_run_date_start',
            printRunDateEndField: '#package-form #print_run_date_end',
            printPublicationDropdown: '#package-form #print-publication',
            printSystemSlugField: '#package-form #print-system-slug',
            printSectionCheckboxes: '#package-form #print-sections',
            printFinalized: '#package-form #is_placement_finalized',
/* eslint-disable indent */
addAdditionalItemTrigger: '.single-page .add-additional-content-trigger',
bottomButtonHolder: '.single-page .bottom-button-holder',
persistentHolder: '.edit-bar .button-holder',
persistentButton: '.edit-bar .button-holder .button',
            packageDeleteTrigger: '.edit-bar .button-holder .button.delete-trigger',
packageSaveTrigger: '.edit-bar .button-holder .button.save-trigger',
packageSaveAndContinueEditingTrigger: '.edit-bar .button-holder .save-and-continue-editing-trigger',
/* eslint-enable indent */
        },

        bindings: function() {
            var bindingsObj = {},
                ui = this.ui,
                model = this.model,
                data = this.options.data;

            bindingsObj[ui.colorDot.selector] = {
                observe: 'hub',
                update: function($el, value, mdl) {},  // eslint-disable-line no-unused-vars
                getVal: function($el, event, options) {},  // eslint-disable-line no-unused-vars
                attributes: [
                    {
                        name: 'style',
                        observe: 'hub',
                        onGet: function(value) {
                            var matchingHub = data.hubs.findWhere({slug: value});

                            if (matchingHub && matchingHub.has('color')) {
                                return 'background-color: ' + matchingHub.get('color') + ';';
                            }

                            return '';
                        },
                    },
                ],
            };

            bindingsObj[ui.packageTitle.selector] = {
                observe: [
                    'hub',
                    'primaryContent.slugKey',
                    'publishDateResolution',
                    'publishDate',
                ],
                onGet: function(values, options) {  // eslint-disable-line no-unused-vars
                    return [
                        values[0],
                        model.primaryContentItem.get('slugKey'),
                        values[2],
                        values[3],
                    ];
                },
                update: function($el, values, mdl) {  // eslint-disable-line no-unused-vars
                    var newPackageTitle = model.generatePackageTitle();

                    model.primaryContentItem.set('slug', newPackageTitle);
                    model.additionalContentCollection.each(function(item) {
                        item.set('slug', newPackageTitle + '.' + item.get('slugKey'));
                    });

                    $el.text(newPackageTitle);

                    // Propagate package-title changes to all additional
                    // content models.
                    this.children.each(function(childView) {
                        childView.options.primarySlug = newPackageTitle;  // eslint-disable-line max-len,no-param-reassign
                        childView.model.trigger('change:parentSlug');
                    });
                },
            };

            bindingsObj[ui.hubDropdown.selector] = {
                observe: 'hub',
                observeErrors: 'hub',
                errorTranslations: {
                    'This field is required.': 'Select a hub.',
                },
                initialize: function($el, mdl, options) {  // eslint-disable-line no-unused-vars
                    var hubOpts = {
                        maxItems: 1,

                        options: this.hubChoices.options,
                        optgroupField: 'type',

                        optgroups: this.hubChoices.optgroups,
                        optgroupLabelField: 'name',
                        optgroupValueField: 'value',

                        render: {
                            item: function(dta, escape) {  // eslint-disable-line no-unused-vars
                                var dataType = 'fullText';
                                if (typeof(dta.type) !== 'undefined') {
                                    dataType = dta.type;
                                }
                                return '<div data-value="' + dta.value +
                                            '" data-type="' + dataType +
                                            '" class="selected-item">' +
                                            dta.name +
                                        '</div>';
                            },
                        },
                    };

                    $el.selectize(_.defaults(hubOpts, settings.editDropdownOptions));
                },
                update: function($el, value, mdl) {  // eslint-disable-line no-unused-vars
                    if (_.isUndefined($el[0].selectize)) {
                        $el.val(value);
                    } else if (_.isObject($el[0].selectize)) {
                        $el[0].selectize.setValue(value, true);
                    }
                },
                getVal: function($el, event, options) {  // eslint-disable-line no-unused-vars
                    if ($el.val()) {
                        return $el.val();
                    }

                    return null;
                },
            };

            bindingsObj[ui.typeDropdown.selector] = {
                observe: 'primaryContent.type',
                observeErrors: 'primaryContent.type',
                errorTranslations: {
                    'This field may not be null.': 'Select a content type.',
                },
                initialize: function($el, mdl, options) {  // eslint-disable-line no-unused-vars
                    var typeOpts = {
                        maxItems: 1,

                        options: this.typeChoices,

                        render: {
                            item: function(dta, escape) {  // eslint-disable-line no-unused-vars
                                var dataType = 'fullText';  // eslint-disable-line no-unused-vars

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
                },
                onGet: function(values, options) { return model.primaryContentItem.get('type'); },  // eslint-disable-line no-unused-vars,max-len
                update: function($el, value, mdl) {  // eslint-disable-line no-unused-vars
                    if (_.isUndefined($el[0].selectize)) {
                        $el.val(value);
                    } else if (_.isObject($el[0].selectize)) {
                        $el[0].selectize.setValue(value, true);
                    }
                },
                getVal: function($el, event, options) {  // eslint-disable-line no-unused-vars
                    if ($el.val()) {
                        return $el.val();
                    }

                    return null;
                },
                set: function(attr, value, options, config) {  // eslint-disable-line no-unused-vars
                    model.primaryContentItem.set('type', value);
                },
            };

            bindingsObj[ui.lengthGroup.selector] = {
                observe: 'primaryContent.type',
                onGet: function(values, options) { return model.primaryContentItem.get('type'); },  // eslint-disable-line no-unused-vars, max-len
                update: function($el, value, mdl) {  // eslint-disable-line no-unused-vars
                    var field = $el.find('input');

                    if (value && settings.contentTypes[value].usesLengthAttribute) {
                        if (field.prop('disabled')) {
                            field.prop('disabled', false);
                        }
                    } else {
                        if (!field.prop('disabled')) {
                            field.prop('disabled', true);
                        }
                    }
                },
                attributes: [
                    {
                        name: 'field-active',
                        observe: 'primaryContent.type',
                        onGet: function(value) {  // eslint-disable-line no-unused-vars
                            var val = model.primaryContentItem.get('type');

                            if (val && settings.contentTypes[val].usesLengthAttribute) {
                                return 'true';
                            }

                            return 'false';
                        },
                    },
                ],
            };

            bindingsObj[ui.lengthField.selector] = {
                observe: 'primaryContent.length',
                onGet: function(values, options) { return model.primaryContentItem.get('length'); },  // eslint-disable-line no-unused-vars,max-len
                getVal: function($el, event, options) {  // eslint-disable-line no-unused-vars
                    if ($el.val()) {
                        return $el.val();
                    }

                    return null;
                },
                set: function(attr, value, options, config) {  // eslint-disable-line no-unused-vars
                    model.primaryContentItem.set('length', value);
                },
            };

            bindingsObj[ui.pitchLinkGroup.selector] = {
                observe: 'primaryContent.type',
                onGet: function(values, options) { return model.primaryContentItem.get('type'); },  // eslint-disable-line no-unused-vars,max-len
                update: function($el, value, mdl) {},  // eslint-disable-line no-unused-vars
                attributes: [
                    {
                        name: 'field-active',
                        observe: 'primaryContent.type',
                        onGet: function(value) {  // eslint-disable-line no-unused-vars
                            var val = model.primaryContentItem.get('type');

                            if (val && settings.contentTypes[val].usesPitchSystem) {
                                return 'true';
                            }

                            return 'false';
                        },
                    },
                ],
            };

            bindingsObj[ui.pubDateResolution.selector] = {
                observe: 'publishDateResolution',
                observeErrors: 'publishDate',
                errorTranslations: {
                    'Incorrect format. Expected an Array with two items.': '' +
                            'Select a time format.',
                },
                initialize: function($el, mdl, options) {  // eslint-disable-line no-unused-vars
                    var resolutionOpts = {
                        maxItems: 1,

                        options: [
                            {name: 'Month only', value: 'm'},
                            {name: 'Week only', value: 'w'},
                            {name: 'Day only', value: 'd'},
                            {name: 'Day & time', value: 't'},
                        ],

                        render: {
                            item: function(dta, escape) {  // eslint-disable-line no-unused-vars
                                var dataType = 'fullText';  // eslint-disable-line no-unused-vars
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

                    $el.selectize(_.defaults(resolutionOpts, settings.editDropdownOptions));
                },
                update: function($el, value, mdl) {  // eslint-disable-line no-unused-vars
                    if (_.isUndefined($el[0].selectize)) {
                        $el.val(value);
                    } else if (_.isObject($el[0].selectize)) {
                        $el[0].selectize.setValue(value, true);
                    }
                },
                getVal: function($el, event, options) {  // eslint-disable-line no-unused-vars
                    if ($el.val()) {
                        return $el.val();
                    }

                    return null;
                },
                set: function(attr, value, options, config) {  // eslint-disable-line no-unused-vars
                    model.updatePublishDateResolution(value);
                },
            };

            bindingsObj[ui.pubDateGroup.selector] = {
                observe: 'publishDateResolution',
                update: function($el, value, mdl) {  // eslint-disable-line no-unused-vars
                    var control = this.ui.pubDateField.data('datepicker'),
                        resolution = mdl.get('publishDateResolution'),
                        currentDate = (_.has(control, 'currentDate')) ? control.currentDate : null,
                        hasDate = !_.isNull(currentDate),
                        resolutionOptions = {},  // eslint-disable-line no-unused-vars
                        rawDate = hasDate ? moment(currentDate) : null,
                        weekHasDate = (hasDate) && (resolution === 'w'),
                        // Weeks need to be passed as the beginning date.
                        finalDate = weekHasDate ? rawDate.startOf('week') : rawDate;

                    if (!_.isUndefined(control) && !_.isEmpty(control)) {
                        control.destroy();
                    }

                    this.ui.pubDateField.datepicker(
                        _.defaults(
                            {
                                onSelect: function(dateString, date, config) {
                                    config.$el.trigger('updatePublishDate');
                                },
                            },
                            settings.datePickerOptions[value],
                            settings.datePickerOptions.default
                        )
                    );

                    control = this.ui.pubDateField.data('datepicker');

                    if (!_.isNull(rawDate) && !_.isNull(resolution)) {
                        control.date = finalDate.toDate();
                        control.selectDate(finalDate.toDate());
                    }

                    if (_(control.opts).has('customKeyDownFunction')) {
                        control.$el
                            .unbind('keydown.adp')
                            .on(
                                'keydown.adp',
                                control.opts.customKeyDownFunction.bind(control)
                            );
                    }
                }.bind(this),
                attributes: [
                    {
                        name: 'field-active',
                        observe: 'publishDateResolution',
                        onGet: function(value) {
                            if (!_.isNull(value)) {
                                return 'true';
                            }

                            return 'false';
                        },
                    },
                ],
            };

            bindingsObj[ui.pubDateField.selector] = {
                observe: ['publishDateResolution', 'publishDate'],
                events: ['updatePublishDate'],
                update: function($el, values, mdl) {  // eslint-disable-line no-unused-vars
                    var datePckr = ui.pubDateField.data('datepicker'),
                        newDate;

                    if (_.isNull(values[1]) || values[1] === '') {
                        datePckr.clear();
                    } else {
                        if ((!_.isUndefined(values[0])) && (values[0] !== '')) {
                            newDate = moment(
                                values[1][1]
                            ).tz('America/Chicago').subtract({seconds: 1});

                            // Weeks need to be passed as the beginning date.
                            if (values[0] === 'w') { newDate = newDate.startOf('week'); }

                            datePckr.date = newDate.toDate();
                            datePckr.selectDate(newDate.toDate());
                        }
                    }
                },
                getVal: function($el, event, options) {  // eslint-disable-line no-unused-vars
                    if ($el.val() === '') { return [ui.pubDateResolution.val(), null]; }

                    if (model.get('publishDateResolution') === 't') {
                        return [
                            ui.pubDateResolution.val(),
                            [$el.val(), model.generateFormattedPublishDate()[1]].join(' '),
                        ];
                    }

                    return [ui.pubDateResolution.val(), $el.val()];
                },
                set: function(attr, values) {
                    model.updatePublishDate.apply(model, values);
                },
                attributes: [
                    {
                        name: 'disabled',
                        observe: 'publishDateResolution',
                        onGet: function(value) { return _.isNull(value); },
                    },
                ],
            };

            bindingsObj[ui.pubTimeGroup.selector] = {
                observe: 'publishDateResolution',
                update: function($el, value, mdl) {  // eslint-disable-line no-unused-vars
                    var control,
                        customOptions = {};

                    if (value === 't') {
                        control = this.ui.pubTimeField.data('timepicker');
                    }

                    if (!_.isUndefined(control) && !_.isEmpty(control)) {
                        control.destroy();
                    }

                    this.ui.pubTimeField.timepicker(
                        _.defaults(customOptions, settings.timePickerOptions)
                    );
                },
                attributes: [
                    {
                        name: 'field-active',
                        observe: 'publishDateResolution',
                        onGet: function(value) {
                            if (value === 't') {
                                return 'true';
                            }

                            return 'false';
                        },
                    },
                ],
            };

            bindingsObj[ui.pubTimeField.selector] = {
                observe: ['publishDateResolution', 'publishDate'],
                events: ['blur'],
                update: function($el, values, mdl) {
                    var timePckr = ui.pubTimeField.data('timepicker');

                    if (_.isNull(values[1]) || values[1] === '') {
                        timePckr.selectTime('12:00 p.m.');
                    } else {
                        timePckr.selectTime(
                            mdl.generateFormattedPublishDate(values[0], values[1][1])[1]
                        );
                    }
                },
                getVal: function($el, event, options) {  // eslint-disable-line no-unused-vars
                    if (model.get('publishDateResolution') === 't') {
                        if (
                            (_.isUndefined(model.get('publishDate'))) ||
                            (_.isEmpty(model.get('publishDate')))
                        ) { return null; }

                        return [
                            ui.pubDateResolution.val(),
                            [model.generateFormattedPublishDate()[0], $el.val()].join(' '),
                        ];
                    }

                    return null;
                },
                set: function(attr, values) { model.updatePublishDate.apply(model, values); },  // eslint-disable-line no-unused-vars,max-len
                attributes: [
                    {
                        name: 'disabled',
                        observe: 'publishDateResolution',
                        onGet: function(value) { return (value !== 't'); },
                    },
                ],
            };

            bindingsObj[ui.slugGroup.selector] = {
                observe: [
                    'hub',
                    'primaryContent.slugKey',
                    'publishDateResolution',
                    'publishDate',
                ],
                observeErrors: 'primaryContent.slugKey',
                errorTranslations: {
                    'This field may not be blank.': 'Enter a slug keyword.',
                    'Ensure this field has no more than 20 characters.': '' +
                        'Use up to 20 characters for slug keywords.',
                },
                getErrorTextHolder: function($el) {
                    return $el.closest('.form-group').find('.form-help');
                },
                initialize: function($el, mdl, options) {  // eslint-disable-line no-unused-vars
                    $el.on(
                        'recalculateSpacing',
                        function(event) {
                            var target = $(event.currentTarget),
                                hubSlug = $(event.currentTarget).find('.hub-slug-value'),
                                formattedDate = target.find('.formatted-date-value'),
                                inputPadding = {};

                            inputPadding.left = hubSlug.width() + 5;
                            inputPadding.right = formattedDate.width();

                            this.ui.slugField.css({
                                left: -1 * inputPadding.left,
                            });
                            this.ui.slugField.css({
                                'padding-left': inputPadding.left,
                            });
                            this.ui.slugField.css({
                                'padding-right': inputPadding.right,
                            });
                            this.ui.slugField.css({
                                width: $el.width(),
                            });
                        }.bind(this)
                    );

                    setTimeout(function() {
                        $el.trigger('recalculateSpacing');
                    }.bind(this), 0);  // eslint-disable-line no-extra-bind
                },
                onGet: function(values, options) {  // eslint-disable-line no-unused-vars
                    return [
                        values[0],
                        model.primaryContentItem.get('slugKey'),
                        values[2],
                        values[3],
                    ];
                },
                update: function($el, values, mdl) {  // eslint-disable-line no-unused-vars
                    var hubSlug = $el.find('.hub-slug-value'),
                        formattedDate = $el.find('.formatted-date-value');

                    hubSlug.text(model.generateSlugHub() + '.');
                    formattedDate.text('.' + model.generateSlugDate());

                    // TODO: Also bind 'recalculateSpacing' on browser resize.
                    $el.trigger('recalculateSpacing');
                },
                getVal: function($el, event, options) {},  // eslint-disable-line no-unused-vars
            };

            bindingsObj[ui.slugField.selector] = {
                observe: 'primaryContent.slugKey',
                initialize: function($el, mdl, options) {
                    $el.attr(
                        'data-original-value',
                        mdl.get(options.observe)
                    );

                    $el.bind(
                        'focus',
                        function() {
                            $el.closest('.slug-group-holder').addClass('input-focused');
                        }
                    );

                    $el.bind(
                        'blur',
                        function() {
                            $el.closest('.slug-group-holder').removeClass('input-focused');
                        }
                    );
                },
                onGet: function(values, options) {  // eslint-disable-line no-unused-vars
                    return model.primaryContentItem.get('slugKey');
                },
                set: function(attr, value, options, config) {  // eslint-disable-line no-unused-vars
                    model.primaryContentItem.set('slugKey', value);
                    model.trigger('change:primaryContent.slugKey');
                },
            };

            bindingsObj[ui.slugPlaceholder.selector] = {
                observe: 'primaryContent.slugKey',
                onGet: function(values, options) {  // eslint-disable-line no-unused-vars
                    return model.primaryContentItem.get('slugKey');
                },
                update: function($el, value, mdl) {  // eslint-disable-line no-unused-vars
                    if (value !== '') {
                        $el.text(value);
                    } else {
                        $el.text(ui.slugField.attr('placeholder'));
                    }
                },
                getVal: function($el, event, options) {},  // eslint-disable-line no-unused-vars
            };

            bindingsObj[ui.budgetLineField.selector] = {
                observe: 'primaryContent.budgetLine',
                observeErrors: 'primaryContent.budgetLine',
                errorTranslations: {
                    'This field may not be blank.': 'Enter a budget line.',
                },
                initialize: function($el, mdl, options) {  // eslint-disable-line no-unused-vars
                    $el.closest('.expanding-holder').addClass('expanding-enabled');
                    $el.bind('focus', function() { $(this).parent().addClass('input-focused'); });
                    $el.bind('blur', function() { $(this).parent().removeClass('input-focused'); });
                },
                onGet: function(values, options) {  // eslint-disable-line no-unused-vars
                    return model.primaryContentItem.get('budgetLine');
                },
                update: function($el, value, mdl) {  // eslint-disable-line no-unused-vars
                    $el.text(value);
                },
                set: function(attr, value, options, config) {  // eslint-disable-line no-unused-vars
                    model.primaryContentItem.set('budgetLine', value);
                    model.trigger('change:primaryContent.budgetLine');
                },
            };

            bindingsObj[ui.budgetLinePlaceholder.selector] = {
                observe: 'primaryContent.budgetLine',
                onGet: function(values, options) {  // eslint-disable-line no-unused-vars
                    return model.primaryContentItem.get('budgetLine');
                },
                update: function($el, value, mdl) {  // eslint-disable-line no-unused-vars
                    if (value === '') {
                        if ($el.closest('.expanding-holder').hasClass('has-value')) {
                            $el.closest('.expanding-holder').removeClass('has-value');
                        }
                    } else {
                        if (!$el.closest('.expanding-holder').hasClass('has-value')) {
                            $el.closest('.expanding-holder').addClass('has-value');
                        }
                    }

                    $el.text(value);
                },
                getVal: function($el, event, options) {},  // eslint-disable-line no-unused-vars
            };

            bindingsObj[ui.authorsDropdown.selector] = {
                observe: 'primaryContent.authors',
                observeErrors: 'primaryContent.authors',
                errorTranslations: {
                    'This field may not be empty.': '' +
                            'Choose one or more authors.',
                },
                setOptions: {silent: true},
                initialize: function($el, mdl, options) {  // eslint-disable-line no-unused-vars
                    var authorOpts = {
                        closeAfterSelect: false,
                        plugins: ['remove_button', 'restore_on_backspace'],

                        options: this.stafferChoices,

                        render: {
                            item: function(dta, escape) {  // eslint-disable-line no-unused-vars
                                var dataType = 'fullText';  // eslint-disable-line no-unused-vars
                                if (typeof(dta.type) !== 'undefined') {
                                    dataType = dta.type;
                                }
                                return '<div data-value="' + dta.value +
                                            '" class="selected-item-multichoice">' +
                                            dta.name +
                                        '</div>';
                            },
                        },
                    };

                    $el.selectize(_.defaults(authorOpts, settings.editDropdownOptions));
                },
                onGet: function(values, options) {  // eslint-disable-line no-unused-vars
                    return model.primaryContentItem.get('authors');
                },
                update: function($el, value, mdl) {  // eslint-disable-line no-unused-vars
                    if (_.isUndefined($el[0].selectize)) {
                        $el.val(_(value).pluck('email').join(','));
                    } else if (_.isObject($el[0].selectize)) {
                        $el[0].selectize.clear(true);

                        _(value).each(
                            function(author) {
                                $el[0].selectize.addItem(author.email, true);
                            }
                        );
                    }
                },
                getVal: function($el, event, options) {  // eslint-disable-line no-unused-vars
                    var newAuthors = [];

                    _($el.val().split(',')).each(
                        function(authorKey) {
                            if (authorKey !== '') {
                                newAuthors.push(
                                    this.options.data.staffers.findWhere({
                                        email: authorKey,
                                    }).toJSON()
                                );
                            }
                        }.bind(this)
                    );

                    return newAuthors;
                },
                set: function(attr, value, options, config) {  // eslint-disable-line no-unused-vars
                    model.primaryContentItem.set('authors', value);
                },
            };

            bindingsObj[ui.editorsDropdown.selector] = {
                observe: 'primaryContent.editors',
                setOptions: {silent: true},
                initialize: function($el, mdl, options) {  // eslint-disable-line no-unused-vars
                    var editorOpts = {
                        closeAfterSelect: false,
                        plugins: ['remove_button', 'restore_on_backspace'],

                        options: this.stafferChoices,

                        render: {
                            item: function(dta, escape) {  // eslint-disable-line no-unused-vars
                                var dataType = 'fullText';  // eslint-disable-line no-unused-vars
                                if (typeof(dta.type) !== 'undefined') {
                                    dataType = dta.type;
                                }

                                return '<div data-value="' + dta.value +
                                            '" class="selected-item-multichoice">' +
                                            dta.name +
                                        '</div>';
                            },
                        },
                    };

                    $el.selectize(_.defaults(editorOpts, settings.editDropdownOptions));
                },
                onGet: function(values, options) {  // eslint-disable-line no-unused-vars
                    return model.primaryContentItem.get('editors');
                },
                update: function($el, value, mdl) {  // eslint-disable-line no-unused-vars
                    if (_.isUndefined($el[0].selectize)) {
                        $el.val(_(value).pluck('email').join(','));
                    } else if (_.isObject($el[0].selectize)) {
                        $el[0].selectize.clear(true);

                        _(value).each(
                            function(editor) {
                                $el[0].selectize.addItem(editor.email, true);
                            }
                        );
                    }
                },
                getVal: function($el, event, options) {  // eslint-disable-line no-unused-vars
                    var newEditors = [];

                    _($el.val().split(',')).each(
                        function(editorKey) {
                            if (editorKey !== '') {
                                newEditors.push(
                                    this.options.data.staffers.findWhere({
                                        email: editorKey,
                                    }).toJSON()
                                );
                            }
                        }.bind(this)
                    );

                    return newEditors;
                },
                set: function(attr, value, options, config) {  // eslint-disable-line no-unused-vars
                    model.primaryContentItem.set('editors', value);
                },
            };

            bindingsObj[ui.headlineGroup.selector] = {
                observe: 'headlineStatus',
                update: function($el, value, mdl) {  // eslint-disable-line no-unused-vars
                    var variableGroupName = (
                            mdl.initialHeadlineStatus === 'voting'
                        ) ? mdl.initialHeadlineStatus : 'other',
                        activeGroup = $el.find(
                            '.hl-variable-group[data-mode="' + variableGroupName + '"]'
                        ),
                        closestCollapsibleGroup = $('#headline-fields').closest(
                            '.row.can-collapse'
                        ),
                        additionalInputHeights = ui.headlineVoteSubmissionToggle.outerHeight(true),
                        newHeight = (
                            18 +  // 12px for top spacer, 6 for bottom border/margin.
                            activeGroup.height()
                        );

                    if (mdl.initialHeadlineStatus === 'drafting') {
                        newHeight += additionalInputHeights;
                    }

                    $el.find('.hl-variable-group').removeClass('active');
                    activeGroup.addClass('active');

                    closestCollapsibleGroup.data('expandedHeight', newHeight);

                    if (closestCollapsibleGroup.height() > 0) {
                        closestCollapsibleGroup.height(newHeight);
                    }
                },
                getVal: function($el, event, options) {},  // eslint-disable-line no-unused-vars
            };

            bindingsObj[ui.headline1.selector] = {
                observe: 'headlineCandidates',
                onGet: function(values, options) { return model.headlineCandidateCollection; },  // eslint-disable-line no-unused-vars,max-len
                update: function($el, vals) {
                    var cID = $el.data('cid'),
                        thisVal = (cID !== '' && cID !== null) ? vals.get({cid: cID}) : vals.at(0);
                    $el.val(thisVal.get('text'));
                },
                updateModel: function(val) { return !_.isNull(val); },
                getVal: function($el, event, options) {  // eslint-disable-line no-unused-vars
                    return ($el.prop('readonly')) ? null : {text: $el.val(), cid: $el.data('cid')};
                },
                set: function(attr, value, options, config) {  // eslint-disable-line no-unused-vars
                    model.get(attr).get({cid: value.cid}).set(_.omit(_.clone(value), 'cid'));
                },
                attributes: [
                    {
                        name: 'data-cid',
                        observe: 'headlineCandidates',
                        onGet: function(values) {  // eslint-disable-line no-unused-vars
                            return model.headlineCandidateCollection.at(0).cid;
                        },
                    },
                    {
                        name: 'readonly',
                        observe: 'headlineStatus',
                        onGet: function() { return !(model.initialHeadlineStatus === 'drafting'); },
                    },
                ],
            };

            bindingsObj[ui.headline2.selector] = {
                observe: 'headlineCandidates',
                onGet: function(values, options) { return model.headlineCandidateCollection; },  // eslint-disable-line no-unused-vars,max-len
                update: function($el, vals) {
                    var cID = $el.data('cid'),
                        thisVal = (cID !== '' && cID !== null) ? vals.get({cid: cID}) : vals.at(1);
                    $el.val(thisVal.get('text'));
                },
                updateModel: function(val) { return !_.isNull(val); },
                getVal: function($el, event, options) {  // eslint-disable-line no-unused-vars
                    return ($el.prop('readonly')) ? null : {text: $el.val(), cid: $el.data('cid')};
                },
                set: function(attr, value, options, config) {  // eslint-disable-line no-unused-vars
                    model.get(attr).get({cid: value.cid}).set(_.omit(_.clone(value), 'cid'));
                },
                attributes: [
                    {
                        name: 'data-cid',
                        observe: 'headlineCandidates',
                        onGet: function(values) {  // eslint-disable-line no-unused-vars
                            return model.headlineCandidateCollection.at(1).cid;
                        },
                    },
                    {
                        name: 'readonly',
                        observe: 'headlineStatus',
                        onGet: function() { return !(model.initialHeadlineStatus === 'drafting'); },
                    },
                ],
            };

            bindingsObj[ui.headline3.selector] = {
                observe: 'headlineCandidates',
                onGet: function(values, options) { return model.headlineCandidateCollection; },  // eslint-disable-line no-unused-vars,max-len
                update: function($el, vals) {
                    var cID = $el.data('cid'),
                        thisVal = (cID !== '' && cID !== null) ? vals.get({cid: cID}) : vals.at(2);
                    $el.val(thisVal.get('text'));
                },
                updateModel: function(val) { return !_.isNull(val); },
                getVal: function($el, event, options) {  // eslint-disable-line no-unused-vars
                    return ($el.prop('readonly')) ? null : {text: $el.val(), cid: $el.data('cid')};
                },
                set: function(attr, value, options, config) {  // eslint-disable-line no-unused-vars
                    model.get(attr).get({cid: value.cid}).set(_.omit(_.clone(value), 'cid'));
                },
                attributes: [
                    {
                        name: 'data-cid',
                        observe: 'headlineCandidates',
                        onGet: function(values) {  // eslint-disable-line no-unused-vars
                            return model.headlineCandidateCollection.at(2).cid;
                        },
                    },
                    {
                        name: 'readonly',
                        observe: 'headlineStatus',
                        onGet: function() { return !(model.initialHeadlineStatus === 'drafting'); },
                    },
                ],
            };

            bindingsObj[ui.headline4.selector] = {
                observe: 'headlineCandidates',
                onGet: function(values, options) { return model.headlineCandidateCollection; },  // eslint-disable-line no-unused-vars,max-len
                update: function($el, vals) {
                    var cID = $el.data('cid'),
                        thisVal = (cID !== '' && cID !== null) ? vals.get({cid: cID}) : vals.at(3);
                    $el.val(thisVal.get('text'));
                },
                updateModel: function(val) { return !_.isNull(val); },
                getVal: function($el, event, options) {  // eslint-disable-line no-unused-vars
                    return ($el.prop('readonly')) ? null : {text: $el.val(), cid: $el.data('cid')};
                },
                set: function(attr, value, options, config) {  // eslint-disable-line no-unused-vars
                    model.get(attr).get({cid: value.cid}).set(_.omit(_.clone(value), 'cid'));
                },
                attributes: [
                    {
                        name: 'data-cid',
                        observe: 'headlineCandidates',
                        onGet: function(values) {  // eslint-disable-line no-unused-vars
                            return model.headlineCandidateCollection.at(3).cid;
                        },
                    },
                    {
                        name: 'readonly',
                        observe: 'headlineStatus',
                        onGet: function() { return !(model.initialHeadlineStatus === 'drafting'); },
                    },
                ],
            };

            bindingsObj[ui.headlineVoteSubmissionToggle.selector] = {
                observe: 'headlineStatus',
                update: function($el, value, mdl) {},  // eslint-disable-line no-unused-vars
                getVal: function($el, event, options) {},  // eslint-disable-line no-unused-vars
                attributes: [
                    {
                        name: 'data-visible',
                        observe: 'headlineStatus',
                        onGet: function(val) {  // eslint-disable-line no-unused-vars
                            return (model.initialHeadlineStatus === 'drafting') ? 'true' : 'false';
                        },
                    },
                ],
            };

            bindingsObj[ui.headlineVoteSubmissionToggleInput.selector] = {
                observe: 'headlineStatus',
                update: function($el, value, mdl, config) {},  // eslint-disable-line no-unused-vars
                updateModel: function(value, event, options) {  // eslint-disable-line no-unused-vars,max-len
                    if (model.initialHeadlineStatus === 'drafting') {
                        if (model.get('headlineStatus') === 'drafting' && value === 'voting') {
                            return true;
                        }

                        if (model.get('headlineStatus') === 'voting' && value === 'drafting') {
                            return true;
                        }
                    }

                    return false;
                },
                getVal: function($el, event, options) {  // eslint-disable-line no-unused-vars
                    return ($el.prop('checked') === true) ? 'voting' : 'drafting';
                },
                attributes: [
                    {
                        name: 'readonly',
                        observe: 'headlineStatus',
                        onGet: function(value) {  // eslint-disable-line no-unused-vars
                            return (model.initialHeadlineStatus !== 'drafting');
                        },
                    },
                    {
                        name: 'checked',
                        observe: 'headlineStatus',
                        onGet: function(value) {  // eslint-disable-line no-unused-vars
                            return (
                                (model.initialHeadlineStatus === 'drafting') &&
                                (value === 'voting')
                            );
                        },
                    },
                ],
            };

            bindingsObj[ui.notesField.selector] = {
                observe: 'notes',
                events: ['updateText'],
                initialize: function($el, mdl, opts) {  // eslint-disable-line no-unused-vars
                    var richNotesField = new Quill($el.selector, {
                            modules: {
                                toolbar: this.ui.notesToolbar.selector,
                                'link-tooltip': true,
                            },
                            theme: 'snow',
                        }),
                        rnRoot = richNotesField.root,
                        closestCollapse = $(rnRoot.closest('.row.can-collapse')),
                        activeHeight = $(rnRoot.closest('.collapsable-inner')).outerHeight(true);

                    richNotesField.on(
                        'text-change',
                        function(delta, source) {  // eslint-disable-line no-unused-vars
                            var newHTML = this.editor.innerHTML;
                            $el.trigger('updateText', newHTML);
                        }
                    );

                    closestCollapse.data('expandedHeight', activeHeight);

                    if (closestCollapse.height > 0) {
                        $(rnRoot.closest('.row.can-collapse')).height(activeHeight);
                    }

                    this.richNotesField = richNotesField;
                },
                update: function($el, value, mdl) {  // eslint-disable-line no-unused-vars
                    if (!$el.hasClass('ql-container')) {
                        // Quill has not yet been initialized. Insert the note
                        // text as raw HTML.
                        $el.html(value);
                    } else {
                        // Quill is active. Insert the note text using its API.
                        this.richNotesField.setHTML(value);
                    }
                },
                updateModel: function(val, event, options) {  // eslint-disable-line no-unused-vars
                    return true;
                },
                getVal: function($el, event, options, newText) {
                    return newText[0];
                },
            };

            bindingsObj[ui.publishingGroup.selector] = {
                observe: 'publishGroupHeight',
                update: function($el, value, mdl) {  // eslint-disable-line no-unused-vars
                    var closestCollapsibleGroup = $el.closest(
                            '.row.can-collapse'
                        ),
                        newHeight = (
                            18 +  // 12px for top spacer, 6 for bottom border/margin.
                            $el.outerHeight()
                        );

                    closestCollapsibleGroup.data('expandedHeight', newHeight);

                    if (closestCollapsibleGroup.height() > 0) {
                        closestCollapsibleGroup.height(newHeight);
                    }
                },
                getVal: function($el, event, options) {},  // eslint-disable-line no-unused-vars
            };

            bindingsObj[ui.urlField.selector] = {
                observe: 'publishedUrl',
            };

            bindingsObj[ui.printRunDateStartField.selector] = {
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
                        var currentRange = model.get('printRunDate'),
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
                                model.tempSavedStart = date;
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

                        this.ui.printRunDateEndField.focus();
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
                        newDates = _.clone(model.get('printRunDate'));

                    if (_.has(inputDates, 'start')) {
                        if (_.isNull(inputDates.start)) {
                            newDates = null;
                        } else {
                            if (_.isNull(newDates)) { newDates = [null, null]; }

                            newDates[0] = (
                                inputDates.start !== ''
                            ) ? model.parseRunDate('YYYY-MM-DD', inputDates.start) : null;
                        }
                    }

                    if (_.has(inputDates, 'end')) {
                        if (_.isNull(inputDates.end)) {
                            newDates = null;
                        } else {
                            if (_.isNull(newDates)) { newDates = [null, null]; }

                            newDates[1] = (
                                inputDates.end !== ''
                            ) ? model.parseRunDate('YYYY-MM-DD', inputDates.end) : null;
                        }
                    }

                    return newDates;
                },
            };

            bindingsObj[ui.printRunDateEndField.selector] = {
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
                        var currentRange = model.get('printRunDate'),
                            newEnd = date,
                            savedStart,
                            newDatePair;

                        if (date === '') {
                            newDatePair = {end: null};
                        } else if (!datePckr.preventDefault) {
                            if (!_.isNull(currentRange) && currentRange.length === 2) {
                                savedStart = moment(
                                    model.get('printRunDate')[0],
                                    'YYYY-MM-DD'
                                ).toDate();
                            } else {
                                savedStart = model.tempSavedStart;
                            }

                            newDatePair = {
                                end: moment(newEnd).add({days: 1}).format('YYYY-MM-DD'),
                            };

                            if (savedStart.getTime() > newEnd.getTime()) {
                                newDatePair.start = moment(date).format('YYYY-MM-DD');
                            }
                        }

                        $el.trigger('setPrintRunDate', newDatePair);
                    };

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
                        newDates = _.clone(model.get('printRunDate'));

                    if (_.has(inputDates, 'start')) {
                        if (_.isNull(inputDates.start)) {
                            newDates = null;
                        } else {
                            if (_.isNull(newDates)) { newDates = [null, null]; }

                            newDates[0] = (
                                inputDates.start !== ''
                            ) ? model.parseRunDate('YYYY-MM-DD', inputDates.start) : null;
                        }
                    }

                    if (_.has(inputDates, 'end')) {
                        if (_.isNull(inputDates.end)) {
                            newDates = null;
                        } else {
                            if (_.isNull(newDates)) { newDates = [null, null]; }

                            newDates[1] = (
                                inputDates.end !== ''
                            ) ? model.parseRunDate('YYYY-MM-DD', inputDates.end) : null;
                        }
                    }

                    return newDates;
                },
            };

            bindingsObj[ui.printSystemSlugField.selector] = {
                observe: 'printSystemSlug',
            };

            bindingsObj[ui.printPublicationDropdown.selector] = {
                observe: 'printSection',
                initialize: function($el, mdl, options) {  // eslint-disable-line no-unused-vars
                    var typeOpts = {
                        maxItems: 1,
                        options: this.printPlacementChoices,
                        render: {
                            item: function(dta, escape) {  // eslint-disable-line no-unused-vars
                                var dataType = 'fullText';  // eslint-disable-line no-unused-vars

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
                },
                onGet: function(values, options) {  // eslint-disable-line no-unused-vars,max-len
                    if (_.isEmpty(model.get('printSection'))) { return ''; }

                    return this.sectionPublicationMap[
                        model.get('printSection')[0]
                    ];
                },
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
                set: function(attr, value, options, config) {  // eslint-disable-line no-unused-vars
                    this.activePublication = value;
                    this.model.trigger('change:activePublication');
                },
            };

            bindingsObj[ui.printSectionCheckboxes.selector] = {
                observe: ['activePublication', 'printSection'],
                // eslint-disable-next-line no-unused-vars
                onGet: function(values, options) { return [this.activePublication, values[1]]; },
                update: function($el, values, mdl) {  // eslint-disable-line no-unused-vars
                    var newPublication = values[0],
                        selectedValues = model.get('printSection');

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
                                        newSections = _.clone(model.get('printSection'));

                                    if (thisEl.prop('checked')) {
                                        newSections = _.union(newSections, [sectionID]);
                                    } else {
                                        newSections = _.difference(newSections, [sectionID]);
                                    }

                                    // If 'newSections' is empty, apply these
                                    // changes silently.
                                    // That way, the selected publication won't
                                    // also be reset.
                                    model.set(
                                        'printSection',
                                        newSections,
                                        (_.isEmpty(newSections)) ? {silent: true} : {}
                                    );
                                });

                                $el.append(sectionCheckbox);
                            }
                        );
                    } else {
                        $el.hide();
                    }

                    this.model.trigger('change:publishGroupHeight');
                },
            };

            bindingsObj[ui.printFinalized.selector] = {
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

            bindingsObj[ui.packageDeleteTrigger.selector] = {
                observe: 'id',
                update: function($el, value, mdl) {},  // eslint-disable-line no-unused-vars
                getVal: function($el, event, options) {},  // eslint-disable-line no-unused-vars
                attributes: [
                    {
                        name: 'data-visible',
                        observe: 'id',
                        onGet: function(value) {  // eslint-disable-line no-unused-vars
                            return (_.isUndefined(value)) ? 'false' : 'true';
                        },
                    },
                ],
            };

            return bindingsObj;
        },

        events: {
            'mousedown @ui.addRequestButton': 'addButtonClickedClass',
            'click @ui.addRequestButton': 'openVisualsRequestForm',
            'click @ui.collapsibleRowHeaders': 'toggleCollapsibleRow',
            'click @ui.addAdditionalItemTrigger': 'addNewAdditionalItem',
            'mousedown @ui.persistentButton': 'addButtonClickedClass',
            'click @ui.packageSaveTrigger': 'savePackage',
            'click @ui.packageSaveAndContinueEditingTrigger': 'savePackageAndContinueEditing',
            'click @ui.packageDeleteTrigger': 'deleteEntirePackage',
        },

        modelEvents: {
            packageLoaded: 'bindForm',
        },

        initialize: function() {
            this.isFirstRender = true;

            this._radio = Backbone.Wreqr.radio.channel('global');

            this.collection = this.model.additionalContentCollection;

            /* Prior-path capturing. */

            this.priorViewName = this._radio.reqres.request(
                'getState',
                'meta',
                'listViewType'
            );

            this.priorPath = '/';
            if (
                !_.isUndefined(this.priorViewName) &&
                _.has(urlConfig, this.priorViewName)
            ) {
                this.priorPath = urlConfig[this.priorViewName].reversePattern;
            }


            /* Moment.js configuration. */

            moment.locale('en', {
                meridiem: function(hour, minute, isLowercase) {
                    var meridiemString;
                    if (hour < 12) {
                        meridiemString = 'a.m.';
                    } else {
                        meridiemString = 'p.m.';
                    }

                    if (!isLowercase) {
                        return meridiemString.toUpperCase();
                    }

                    return meridiemString;
                },
                monthsShort: [
                    'Jan.', 'Feb.', 'March', 'April', 'May', 'June',
                    'July', 'Aug.', 'Sept.', 'Oct.', 'Nov.', 'Dec.',
                ],
                week: {dow: 0},
            });


            /* Choice generation for selectize lists. */

            this.hubChoices = this.enumerateHubChoices();

            this.typeChoices = this.enumerateTypeChoices();

            this.stafferChoices = this.enumerateStafferChoices();


            /* Print-placement choice generation. */

            this.printPlacementChoices = this.enumeratePrintPlacementChoices();


            /* Additional-content holding initialization. */

            this.additionalItemCount = 0;


            /* Main model initialization. */

            this.options.initFinishedCallback(this);
        },

        // eslint-disable-next-line no-unused-vars
        filter: function(child, index, collection) {
            // Only show child views for items in 'this.collection' that
            // represent additional content (and not primary items).
            return (
                (!child.has('additionalForPackage')) ||
                (!_.isNull(child.get('additionalForPackage')))
            );
        },

        serializeData: function() {
            return {
                csrfToken: '',
                visualsRequestURL: settings.externalURLs.addVisualsRequest,
            };
        },

        onBeforeRender: function() {
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

        onAttach: function() {
            this.ui.packageForm.find('.row.can-collapse').each(function() {
                var $thisEl = $(this);

                $thisEl.data('expanded-height', $thisEl.outerHeight());

                $thisEl.addClass('collapse-enabled');
            });

            if (
                    _.has(this.options, 'boundData') &&
                    _.has(this.options.boundData, 'isEmpty')
            ) {
                if (this.options.boundData.isEmpty === true) {
                    this.model.trigger('packageLoaded');
                }
            }
        },

        bindForm: function() {
            this.stickit();
        },


        /*
         *   Choice enumerators.
         */

        enumerateHubChoices: function() {
            var choices = [],
                hubGroupsRaw = [];

            this.options.data.hubs.each(function(hub) {
                var hubVertical = hub.get('vertical');

                choices.push({
                    name: hub.get('name'),
                    type: hubVertical.slug,
                    value: hub.get('slug'),
                });

                if (!_.contains(
                        _.pluck(hubGroupsRaw, 'value'), hubVertical.slug)
                ) {
                    hubGroupsRaw.push({
                        name: hubVertical.name,
                        value: hubVertical.slug,
                    });
                }
            });

            return {
                options: choices,
                optgroups: _.map(
                    _.sortBy(hubGroupsRaw, 'value'),
                    function(obj, index) {
                        var newObj = _.clone(obj);
                        newObj.$order = index + 1;
                        return newObj;
                    }
                ),
            };
        },

        enumerateTypeChoices: function() {
            var choices = [];

            // eslint-disable-next-line no-unused-vars
            _.each(settings.contentTypes, function(v, k, i) {
                choices.push({
                    name: v.verboseName,
                    order: v.order,
                    value: k,
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
                    value: staffer.get('email'),
                });
            });

            return choices;
        },

        enumeratePrintPlacementChoices: function() {
            var sectionPublicationValues = [],
                publicationSections = [],
                placementChoices = _.compact(
                    this.options.data.printPublications.map(
                        function(publication) {
                            if (publication.get('isActive') === true) {
                                // Generate a second map with this
                                // publications' section IDs and the
                                //  publication's slug. This gets used on the
                                // selectize 'select' event.
                                sectionPublicationValues.push(
                                    _.map(
                                        publication.get('sections'),
                                        function(section) {
                                            return [
                                                section.id,
                                                publication.get('slug'),
                                            ];
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
                        }
                    )
                );

            this.printPublicationSections = _.chain(publicationSections)
                    .compact()
                    .reject(
                        function(mapping) { return _.isEmpty(mapping[1]); }
                    )
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
            var triggerElement = $(event.currentTarget);

            if (event.button === 0 && !(event.ctrlKey || event.metaKey)) {
                event.preventDefault();

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
                    height: toggleReceiver.data('expandedHeight'),
                });
                toggleReceiver.addClass('expanded');
            } else {
                toggleTarget.find('h4').removeClass('section-expanded');

                toggleReceiver.css({height: 0});
                toggleReceiver.removeClass('expanded');
            }
        },

        addNewAdditionalItem: function() {
            this.additionalItemCount++;

            this.collection.add([
                (
                    !_.isUndefined(this.model.id)
                ) ? {additionalForPackage: this.model.id} : {},
            ]);
        },

        saveAllComponents: function(successCallback, errorCallback) {
            var packageSave,
                savePromise = new $.Deferred(),
                cachedPrintSections = _.clone(this.model.get('printSection'));

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
                var packageID = mdl.id,
                    primaryContentSave,
                    wasCreated = (opts.statusText.toLowerCase() === 'created');

                // Restore the print sections that were cached on save -- for
                // some reason, they revert to their old values in the
                // re-hydration at the end of 'save()'.
                // That glitch is momentary, though: the correct updates still
                // get applied to the remote version. This is just a shim for
                // local rendering.
                this.model.set('printSection', cachedPrintSections);

                this.model.primaryContentItem.set(
                    'primaryForPackage',
                    packageID
                );

                primaryContentSave = this.model.primaryContentItem.save(
                    undefined,
                    {
                        xhrFields: {
                            withCredentials: true,
                        },
                    }
                );

                // eslint-disable-next-line no-unused-vars
                primaryContentSave.done(function(model, response, options) {
                    var additionalSaveRequests = [];

                    this.model.additionalContentCollection.each(
                        function(item) {
                            var additionalItemSave,
                                additionalItemDeferred = new $.Deferred();

                            item.set('additionalForPackage', packageID);

                            if (
                                (!item.isNew()) ||
                                (!_.isNull(item.get('type'))) ||
                                (!_.isEmpty(item.get('slugKey'))) ||
                                (!_.isEmpty(item.get('authors'))) ||
                                (!_.isEmpty(item.get('budgetLine')))
                            ) {
                                additionalSaveRequests.push(
                                    additionalItemDeferred
                                );

                                additionalItemSave = item.save(
                                    undefined,
                                    {
                                        xhrFields: {
                                            withCredentials: true,
                                        },
                                    }
                                );

                                /* eslint-disable no-unused-vars */
                                additionalItemSave.done(
                                    function(
                                            modelObj,
                                            responseObj,
                                            optionsObj
                                    ) {
                                        additionalItemDeferred.resolve();
                                    }
                                );
                                /* eslint-enable no-unused-vars */

                                additionalItemSave.fail(
                                    function(
                                            responseObj,
                                            textStatus,
                                            errorThrown
                                    ) {
                                        additionalItemDeferred.reject(
                                            responseObj,
                                            textStatus,
                                            errorThrown,
                                            'additional-item',
                                            item
                                        );
                                    }
                                );
                            } else {
                                // If all four empty-by-default fields are
                                // still empty on this model (and it has no
                                // ID), the model should get removed from the
                                // collection rather than being saved across
                                // the API.
                                item.destroy();
                            }
                        }
                    );

                    $.when.apply($, additionalSaveRequests).done(function() {
                        savePromise.resolve(wasCreated);
                    }.bind(this));  // eslint-disable-line no-extra-bind

                    $.when.apply($, additionalSaveRequests).fail(
                        function(
                                responseObj,
                                textStatus,
                                errorThrown,
                                itemType,
                                item
                        ) {
                            /* eslint-disable no-underscore-dangle */
                            var itemView = this.children._views[
                                    this.children._indexByModel[item.cid]
                                ];
                            /* eslint-enable no-underscore-dangle */

                            savePromise.reject(
                                responseObj,
                                textStatus,
                                errorThrown,
                                itemType,
                                itemView
                            );
                        }.bind(this)
                    );
                }.bind(this));

                primaryContentSave.fail(
                    function(response, textStatus, errorThrown) {
                        savePromise.reject(
                            response,
                            textStatus,
                            errorThrown,
                            'primary-item',
                            this
                        );
                    }.bind(this)
                );
            }.bind(this));

            packageSave.fail(function(response, textStatus, errorThrown) {
                savePromise.reject(
                    response,
                    textStatus,
                    errorThrown,
                    'package',
                    this
                );
            }.bind(this));

            savePromise.done(function(wasCreated) {
                if (_.isFunction(successCallback)) {
                    successCallback(wasCreated);
                }
            });

            // eslint-disable-next-line no-unused-vars
            savePromise.fail(function(
                    response,
                    textStatus,
                    errorThrown,
                    errorType,
                    errorView
            ) {
                var packageErrorHolder = this.ui.packageErrors,
                    boundErrors = {
                        raw: _.chain(errorView.bindings())
                                .mapObject(function(val, key) {
                                    var newVal = _.clone(val);
                                    newVal.selector = key;
                                    return newVal;
                                })
                                .values()
                                .filter(function(binding) {
                                    return _.has(binding, 'observeErrors');
                                })
                                .value(),
                    };

                if (response.status === 400) {
                    if (errorType === 'package') {
                        // For package errors, check if we also need to raise
                        // errors on required primary content item fields (when
                        // they haven't been filled out either).

                        // First check for type.
                        if (_.isNull(
                                this.model.primaryContentItem.get('type')
                        )) {
                            // eslint-disable-next-line no-param-reassign
                            response.responseJSON.type = [
                                'This field may not be null.',
                            ];
                        }

                        // Next check for slug keyword.
                        if (_.isEmpty(
                                this.model.primaryContentItem.get('slugKey')
                        )) {
                            // eslint-disable-next-line no-param-reassign
                            response.responseJSON.slugKey = [
                                'This field may not be blank.',
                            ];
                        }

                        // Then check for budget line.
                        if (_.isEmpty(
                                this.model.primaryContentItem.get('budgetLine')
                        )) {
                            // eslint-disable-next-line no-param-reassign
                            response.responseJSON.budgetLine = [
                                'This field may not be blank.',
                            ];
                        }

                        // Finally, check for author.
                        if (_.isEmpty(
                                this.model.primaryContentItem.get('authors')
                        )) {
                            // eslint-disable-next-line no-param-reassign
                            response.responseJSON.authors = [
                                'This field may not be empty.',
                            ];
                        }
                    }

                    if (_.keys(response.responseJSON).length) {
                        packageErrorHolder.html(
                            '<span class="inner">Please fix the errors below.</span>'
                        );
                        packageErrorHolder.show();
                    } else {
                        packageErrorHolder.html('');
                        packageErrorHolder.hide();
                    }

                    if (errorType !== 'additional-item') {
                        boundErrors.package = _.chain(boundErrors.raw)
                            .reject(function(binding) {
                                return _.contains(
                                    [
                                        'primaryContent',
                                        'additionalContent',
                                    ],
                                    _string_.strLeft(
                                        binding.observeErrors,
                                        '.'
                                    )
                                );
                            })
                            .value();

                        // Bind package errors.
                        _.each(
                            boundErrors.package,
                            function(errorBinding) {
                                this.bindError(
                                    response,
                                    errorBinding,
                                    errorBinding.observeErrors,
                                    errorView
                                );
                            }.bind(this)
                        );

                        boundErrors.primary = _.chain(boundErrors.raw)
                            .filter(function(binding) {
                                return _string_.strLeft(
                                    binding.observeErrors,
                                    '.'
                                ) === 'primaryContent';
                            })
                            .value();

                        // Bind primary-content-item errors.
                        _.each(
                            boundErrors.primary,
                            function(errorBinding) {
                                this.bindError(
                                    response,
                                    errorBinding,
                                    _string_.strRight(
                                        errorBinding.observeErrors,
                                        '.'
                                    ),
                                    errorView
                                );
                            }.bind(this)
                        );
                    } else {
                        boundErrors.additionals = _.chain(boundErrors.raw)
                            .filter(function(binding) {
                                return _string_.strLeft(
                                    binding.observeErrors,
                                    '.'
                                ) === 'additionalContent';
                            })
                            .value();

                        // Bind additional-content-item errors.
                        _.each(
                            boundErrors.additionals,
                            function(errorBinding) {
                                this.bindError(
                                    response,
                                    errorBinding,
                                    _string_.strRight(
                                        errorBinding.observeErrors,
                                        '.'
                                    ),
                                    errorView
                                );
                            }.bind(this)
                        );
                    }
                }

                if (_.isFunction(errorCallback)) {
                    errorCallback(response, textStatus, errorThrown, errorType);
                }
            }.bind(this));

            return savePromise;
        },

        bindError: function(response, errorBinding, fieldKey, errorView) {
            var assignedErrorClass = (
                    _.has(errorBinding, 'getErrorClass')
                ) ? (
                    errorBinding.getErrorClass(
                        errorView.$el.find(errorBinding.selector)
                    )
                ) : (
                    errorView.$el.find(errorBinding.selector)
                        .closest('.form-group')
                ),
                errorTextHolder = (
                    _.has(errorBinding, 'getErrorTextHolder')
                ) ? (
                    errorBinding.getErrorTextHolder(
                        errorView.$el.find(errorBinding.selector)
                    )
                ) : (
                    errorView.$el.find(errorBinding.selector)
                        .closest('.form-group')
                        .find('.form-help')
                );

            if (_.has(response.responseJSON, fieldKey)) {
                // This field has errors. Add 'has-error' class
                // (if not already attached) and show all
                // applicable error messages.
                if (!assignedErrorClass.hasClass('has-error')) {
                    assignedErrorClass.addClass('has-error');
                }

                errorTextHolder.html(
                    _.map(
                        response.responseJSON[fieldKey],
                        function(message) {
                            return (
                                _.has(errorBinding.errorTranslations, message)
                            ) ? (
                                errorBinding.errorTranslations[message]
                            ) : (
                                message
                            );
                        }
                    ).join(' | ')
                );
            } else {
                // This field has no errors. Remove 'has-error'
                // class (if attached), empty and hide any
                // error messages.
                if (assignedErrorClass.hasClass('has-error')) {
                    assignedErrorClass.removeClass('has-error');
                }

                if (errorTextHolder.html().length !== 0) {
                    errorTextHolder.html('');
                }
            }
        },

        savePackage: function() {
            var saveProgressModal = {
                    modalTitle: '',
                    innerID: 'package-save-progress-modal',
                    contentClassName: 'package-modal',
                    extraHTML: '',
                    escapeButtonCloses: false,
                    overlayClosesOnClick: false,
                    buttons: [],
                },
                allComponentsSave;

            this.modalView = new ModalView({modalConfig: saveProgressModal});

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

            allComponentsSave = this.saveAllComponents();

            allComponentsSave.done(function(wasCreated) {
                setTimeout(function() {
                    this.saveSuccessCallback('saveOnly', wasCreated);

                    // this.saveErrorCallback('saveOnly', 'processingError', [requestParams[0]]);
                }.bind(this), 1500);
            }.bind(this));

            allComponentsSave.fail(function(response, textStatus, errorThrown) {
                this.saveErrorCallback(
                    'saveOnly',
                    'hardError',
                    [
                        response,
                        textStatus,
                        errorThrown,
                    ]
                );
            }.bind(this));
        },

        savePackageAndContinueEditing: function() {
            var saveProgressModal = {
                    modalTitle: 'Are you sure?',
                    innerID: 'package-save-progress-modal',
                    contentClassName: 'package-modal',
                    extraHTML: '',
                    escapeButtonCloses: false,
                    overlayClosesOnClick: false,
                    buttons: [],
                },
                allComponentsSave;

            this.modalView = new ModalView({modalConfig: saveProgressModal});

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

            allComponentsSave = this.saveAllComponents();

            allComponentsSave.done(function(wasCreated) {
                setTimeout(function() {
                    this.saveSuccessCallback('saveAndContinue', wasCreated);
                }.bind(this), 1500);
            }.bind(this));

            allComponentsSave.fail(function(response, textStatus, errorThrown, errorType) {
                this.saveErrorCallback(
                    'saveAndContinue',
                    'hardError',
                    [
                        response,
                        textStatus,
                        errorThrown,
                        errorType,
                    ]
                );
            }.bind(this));
        },

        deleteEntirePackage: function() {
            var dbPrimarySlug,
                currentPrimarySlug,
                itemSlugEndings,
                itemsToDelete,
                deleteConfirmationModal = {
                    modalTitle: 'Are you sure?',
                    innerID: 'additional-delete-confirmation-modal',
                    contentClassName: 'package-modal deletion-modal',
                    escapeButtonCloses: false,
                    overlayClosesOnClick: false,
                    buttons: [
                        {
                            buttonID: 'delete-package-delete-button',
                            buttonClass: 'flat-button delete-action expand-past-button ' +
                                            'delete-trigger',
                            innerLabel: 'Delete',
                            clickCallback: function(modalContext) {
                                var $el = modalContext.$el,
                                    deleteRequest;

                                $el.parent()
                                    .addClass('waiting-transition')
                                    .addClass('delete-waiting-transition');

                                $el.append(
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
                                    $el.find('.loading-animation').addClass('active');
                                }.bind(this), 600);  // eslint-disable-line no-extra-bind

                                setTimeout(function() {
                                    $el.find('.modal-inner').css({visibility: 'hidden'});
                                }, 450);

                                setTimeout(function() {
                                    $el.parent().addClass('waiting').addClass('delete-waiting')
                                                .removeClass('waiting-transition')
                                                .removeClass('delete-waiting-transition');
                                }, 500);

                                deleteRequest = this.model.destroy({
                                    xhrFields: {
                                        withCredentials: true,
                                    },
                                });

                                // eslint-disable-next-line no-unused-vars
                                deleteRequest.done(function(mdl, resp, opts) {
                                    setTimeout(function() {
                                        this.deleteSuccessCallback(resp);
                                    }.bind(this), 1500);
                                }.bind(this));

                                // eslint-disable-next-line no-unused-vars
                                deleteRequest.fail(function(response, textStatus, errorThrown) {
                                    this.deleteErrorCallback(
                                        'hardError',
                                        [response, textStatus, errorThrown]
                                    );
                                }.bind(this));
                            }.bind(this),
                        },
                        {
                            buttonID: 'delete-package-cancel-button',
                            buttonClass: 'flat-button primary-action cancel-trigger',
                            innerLabel: 'Cancel',
                            clickCallback: function(ctx) {  // eslint-disable-line no-unused-vars
                                this._radio.commands.execute('destroyModal');
                            }.bind(this),
                        },
                    ],
                };

            dbPrimarySlug = this.model.primaryContentItem.get('slug');
            currentPrimarySlug = this.ui.packageTitle.text();
            itemSlugEndings = this.model.additionalContentCollection.map(
                function(additionalItem) {
                    return _.last(
                        additionalItem.get('slug').split(
                            dbPrimarySlug + '.'
                        )
                    );
                }
            );

            itemSlugEndings.unshift('');

            itemsToDelete = '<ul class="to-be-deleted-list">' + _.chain(
                _.map(
                    itemSlugEndings,
                    function(slugEnding) {
                        var slugSuffix = '';

                        if (slugEnding !== '') {
                            slugSuffix = '.' + slugEnding;
                        }

                        return currentPrimarySlug + slugSuffix;
                    }
                )
            )
                .map(
                    function(additionalSlug) {
                        return '<li class="to-be-deleted-item">' + additionalSlug + '</li>';
                    }
                )
                .reduce(
                    function(memo, num) { return memo + num; },
                    ''
                )
                .value() + '</ul>';

            deleteConfirmationModal.extraHTML = '' +
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

            this.modalView = new ModalView({modalConfig: deleteConfirmationModal});

            setTimeout(function() {
                this._radio.commands.execute('showModal', this.modalView);
            }.bind(this), 200);
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
                    var fieldEl = $(field),
                        formGroup = fieldEl.closest('.form-group');

                    if (_.isEmpty(field.value)) {
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

        deleteSuccessCallback: function(response) {  // eslint-disable-line no-unused-vars
            // Close this popup and destroy it.
            setTimeout(function() {
                this._radio.commands.execute('destroyModal');
            }.bind(this),
            500);

            // Navigate to the index view
            this._radio.commands.execute('navigate', this.priorPath, {trigger: true});

            // Display snackbar:
            this._radio.commands.execute(
                'showSnackbar',
                new SnackbarView({
                    snackbarClass: 'success',
                    text: 'Item has been successfully deleted.',
                    action: {promptText: 'Dismiss'},
                })
            );
        },

        deleteErrorCallback: function(errorType, errorArgs) {  // eslint-disable-line no-unused-vars
            // Close this popup and destroy it:
            setTimeout(function() {
                this._radio.commands.execute('destroyModal');
            }.bind(this), 500);

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

        // eslint-disable-next-line no-unused-vars
        saveSuccessCallback: function(mode, wasCreated) {
            // Configure success-message snackbar.
            var successSnackbarOpts = {
                snackbarClass: 'success',
                text: 'Item successfully saved.',
                action: {promptText: 'Dismiss'},
            };

            // Close this popup and destroy it.
            setTimeout(function() {
                this._radio.commands.execute('destroyModal');
            }.bind(this),
            500);

            // Navigate to the index view (or to the same page if save and continue)
            if (mode === 'saveOnly') {
                this._radio.commands.execute('navigate', this.priorPath, {trigger: true});
            } else if (mode === 'saveAndContinue') {
                this._radio.commands.execute(
                    'navigate',
                    'edit/' + this.model.id + '/',
                    {trigger: true}
                );

                successSnackbarOpts.containerClass = 'edit-page';
            }

            // Display snackbar:
            this._radio.commands.execute(
                'showSnackbar',
                new SnackbarView(successSnackbarOpts)
            );
        },

        saveErrorCallback: function(mode, errorType, args) {  // eslint-disable-line no-unused-vars
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
        },  // End serializeForm.
    });
});
