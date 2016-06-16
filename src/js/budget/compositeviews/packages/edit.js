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
    'budget/collections/additional-content-items',
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
    AdditionalContentItems,
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
            urlField: '#package-form #url',
            printRunDateField: '#package-form #print_run_date',
            printPlacementGroup: '#package-form .placement-inputs',
            printPlacementFields: '#package-form .placement-inputs .pitched_placements',
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
                getVal: function($el, event, options) {},  // eslint-disable-line no-unused-vars
            };

            bindingsObj[ui.packageTitle.selector] = {
                observe: [
                    'hub',
                    'primaryContent.slugKey',
                    'pubDate.resolution',
                    'pubDate.timestamp',
                ],
                update: function($el, values, mdl) {
                    // TODO: this should also handle the changes triggered in
                    // the 'updatePackageTitle()' method.

                    // updatePackageTitle: function(hubValue) {
                    //     // this.children.each(
                    //     //     function(childView) {
                    //     //         childView.options.primarySlug = slugText;
                    //     //     }
                    //     // );

                    //     // this.childViewOptions = function(model, index) {
                    //     //     return this.generateChildViewOptions(slugText);
                    //     // };

                    //     // this._renderChildren();
                    // },

                    $el.text(mdl.generatePackageTitle());
                },
            };

            bindingsObj[ui.hubDropdown.selector] = {
                observe: 'hub',
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
                getVal: function($el, event, options) {  // eslint-disable-line no-unused-vars
                    if ($el.val()) {
                        return $el.val();
                    }

                    return null;
                },
                update: function($el, value, mdl) {  // eslint-disable-line no-unused-vars
                    if (_.isUndefined($el[0].selectize)) {
                        $el.val(value);
                    } else if (_.isObject($el[0].selectize)) {
                        $el[0].selectize.setValue(value, true);
                    }
                },
            };

            bindingsObj[ui.typeDropdown.selector] = {
                observe: 'primaryContent.type',
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
                getVal: function($el, event, options) {  // eslint-disable-line no-unused-vars
                    if ($el.val()) {
                        return $el.val();
                    }

                    return null;
                },
                update: function($el, value, mdl) {  // eslint-disable-line no-unused-vars
                    if (_.isUndefined($el[0].selectize)) {
                        $el.val(value);
                    } else if (_.isObject($el[0].selectize)) {
                        $el[0].selectize.setValue(value, true);
                    }
                },
            };

            bindingsObj[ui.lengthGroup.selector] = {
                observe: 'primaryContent.type',
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
                        onGet: function(value) {
                            if (value && settings.contentTypes[value].usesLengthAttribute) {
                                return 'true';
                            }

                            return 'false';
                        },
                    },
                ],
            };

            bindingsObj[ui.lengthField.selector] = {
                observe: 'primaryContent.length',
                getVal: function($el, event, options) {  // eslint-disable-line no-unused-vars
                    if ($el.val()) {
                        return $el.val();
                    }

                    return null;
                },
            };

            bindingsObj[ui.pitchLinkGroup.selector] = {
                observe: 'primaryContent.type',
                update: function($el, value, mdl) {},  // eslint-disable-line no-unused-vars
                attributes: [
                    {
                        name: 'field-active',
                        observe: 'primaryContent.type',
                        onGet: function(value) {
                            if (value && settings.contentTypes[value].usesPitchSystem) {
                                return 'true';
                            }

                            return 'false';
                        },
                    },
                ],
            };

            bindingsObj[ui.pubDateResolution.selector] = {
                observe: 'pubDate.resolution',
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
                getVal: function($el, event, options) {  // eslint-disable-line no-unused-vars
                    if ($el.val()) {
                        return $el.val();
                    }

                    return null;
                },
                set: function(attr, value, options, config) {  // eslint-disable-line no-unused-vars
                    model.resetPubDateResolution(value);
                },
                update: function($el, value, mdl) {  // eslint-disable-line no-unused-vars
                    if (_.isUndefined($el[0].selectize)) {
                        $el.val(value);
                    } else if (_.isObject($el[0].selectize)) {
                        $el[0].selectize.setValue(value, true);
                    }
                },
            };

            bindingsObj[ui.pubDateGroup.selector] = {
                observe: 'pubDate.resolution',
                update: function($el, value, mdl) {  // eslint-disable-line no-unused-vars
                    var control = this.ui.pubDateField.data('datepicker'),
                        resolution = mdl.get('pubDate.resolution'),
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
                        observe: 'pubDate.resolution',
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
                observe: 'pubDate.formatted',
                events: ['blur'],
                update: function($el, value, mdl) {
                    var datePckr = ui.pubDateField.data('datepicker'),
                        newDate;

                    if (_.isNull(value) || value === '') {
                        window.ddd = datePckr;
                        datePckr.clear();
                    } else {
                        if (mdl.has('pubDate.timestamp')) {
                            newDate = moment.unix(
                                mdl.get('pubDate.timestamp')
                            ).tz('America/Chicago');

                            // Weeks need to be passed as the beginning date.
                            if (mdl.get('pubDate.resolution') === 'w') {
                                newDate = newDate.startOf('week');
                            }

                            datePckr.date = newDate.toDate();
                            datePckr.selectDate(newDate.toDate());
                        }
                    }
                },
                getVal: function($el, event, options) {  // eslint-disable-line no-unused-vars
                    if ($el.val() === '') {
                        return null;
                    }

                    if (model.get('pubDate.resolution') === 't') {
                        return [
                            $el.val(),
                            model.generateFormattedPubDate()[1],
                        ].join(' ');
                    }

                    return $el.val();
                },
                set: function(attr, value, options, config) {  // eslint-disable-line no-unused-vars
                    if (!_.isNull(value)) {
                        model.updateFormattedPubDate(value);
                    } else {
                        model.set('pubDate.timestamp', null);
                        model.set('pubDate.formatted', null);
                    }
                },
                attributes: [
                    {
                        name: 'disabled',
                        observe: 'pubDate.resolution',
                        onGet: function(value) {
                            if (_.isNull(value)) {
                                return true;
                            }

                            return false;
                        },
                    },
                ],
            };

            bindingsObj[ui.pubTimeGroup.selector] = {
                observe: 'pubDate.resolution',
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
                        observe: 'pubDate.resolution',
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
                observe: 'pubDate.formatted',
                events: ['blur'],
                update: function($el, value, mdl) {
                    var timePckr = ui.pubTimeField.data('timepicker');

                    if (!_.isNull(mdl.get('pubDate.timestamp'))) {
                        timePckr.selectTime(
                            mdl.generateFormattedPubDate(
                                mdl.get('pubDate.resolution'),
                                mdl.get('pubDate.timestamp')
                            )[1]
                        );
                    } else {
                        timePckr.selectTime('12:00 p.m.');
                    }
                },
                getVal: function($el, event, options) {  // eslint-disable-line no-unused-vars
                    if (model.get('pubDate.resolution') === 't') {
                        if (_.isUndefined(model.get('timestamp'))) {
                            return null;
                        }

                        console.log('O');
                        return [
                            model.generateFormattedPubDate()[0],
                            $el.val(),
                        ].join(' ');
                    }

                    return null;
                },
                set: function(attr, value, options, config) {  // eslint-disable-line no-unused-vars
                    if (!_.isNull(value)) {
                        model.updateFormattedPubDate(value);
                    } else {
                        model.set('pubDate.timestamp', null);
                        model.set('pubDate.formatted', null);
                    }
                },
                attributes: [
                    {
                        name: 'disabled',
                        observe: 'pubDate.resolution',
                        onGet: function(value) {
                            if (value !== 't') {
                                return true;
                            }

                            return false;
                        },
                    },
                ],
            };

            bindingsObj[ui.slugGroup.selector] = {
                observe: [
                    'hub',
                    'primaryContent.slugKey',
                    'pubDate.resolution',
                    'pubDate.timestamp',
                ],
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

                    // TODO: Add validation to StickIt version.
                    // slugField.bind(
                    //     'input',
                    //     function() {
                    //         var formGroup = slugField.closest('.form-group');

                    //         if (slugField.val().match(/[^a-z0-9\-]/)) {
                    //             if (!formGroup.hasClass('has-error')) {
                    //                 formGroup.addClass('has-error');
                    //             }

                    //             formGroup.find('.form-help').html(
                    //                 'Please use only lowercase letters, ' +
                    //                 'numbers and hyphens in slugs.'
                    //             );
                    //         } else if (slugField.val().length > 20) {
                    //             if (!formGroup.hasClass('has-error')) {
                    //                 formGroup.addClass('has-error');
                    //             }

                    //             formGroup.find('.form-help').html(
                    //                 'Please keep your slug to 20 characters or less.'
                    //             );
                    //         } else {
                    //             if (formGroup.hasClass('has-error')) {
                    //                 formGroup.removeClass('has-error');
                    //             }

                    //             formGroup.find('.form-help').html('');
                    //         }
                    //     }.bind(this)
                    // );
                },
            };

            bindingsObj[ui.slugPlaceholder.selector] = {
                observe: 'primaryContent.slugKey',
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
                initialize: function($el, mdl, options) {  // eslint-disable-line no-unused-vars
                    $el.closest('.expanding-holder').addClass('expanding-enabled');
                    $el.bind('focus', function() { $(this).parent().addClass('input-focused'); });
                    $el.bind('blur', function() { $(this).parent().removeClass('input-focused'); });
                },
                update: function($el, value, mdl) {  // eslint-disable-line no-unused-vars
                    $el.text(value);
                },
            };

            bindingsObj[ui.budgetLinePlaceholder.selector] = {
                observe: 'primaryContent.budgetLine',
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
            };

            bindingsObj[ui.headlineGroup.selector] = {
                observe: 'headlineStatus',
                update: function($el, value, mdl) {  // eslint-disable-line no-unused-vars
                    var variableGroupName = (value === 'voting') ? value : 'other',
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

                    if (value === 'drafting') {
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
                update: function($el, valueList, mdl) {  // eslint-disable-line no-unused-vars
                    // TODO: Could this produce stale values?
                    $el.val(this.orderedHeadlines[0].text);
                },
                updateModel: function(val, event, options) {  // eslint-disable-line no-unused-vars
                    return !_.isNull(val);
                },
                getVal: function($el, event, options) {  // eslint-disable-line no-unused-vars
                    if (!$el.prop('readonly')) {
                        return {
                            text: $el.val(),
                            id: $el.data('headlineId'),
                        };
                    }
                    return null;
                },
                set: function(attr, value, options, config) {  // eslint-disable-line no-unused-vars
                    model.updateHeadlineCandidate(value, {silent: true});
                },
                attributes: [
                    {
                        name: 'data-headline-id',
                        observe: 'headlineCandidates',
                        onGet: function(valueList) {  // eslint-disable-line no-unused-vars
                            return (
                                _.has(this.orderedHeadlines[0], 'id')
                            ) ? this.orderedHeadlines[0].id : '';
                        },
                    },
                    {
                        name: 'readonly',
                        observe: 'headlineStatus',
                        onGet: function(value) { return !(value === 'drafting'); },
                    },
                ],
            };

            bindingsObj[ui.headline2.selector] = {
                observe: 'headlineCandidates',
                update: function($el, valueList, mdl) {  // eslint-disable-line no-unused-vars
                    $el.val(this.orderedHeadlines[1].text);
                },
                updateModel: function(val, event, options) {  // eslint-disable-line no-unused-vars
                    return !_.isNull(val);
                },
                getVal: function($el, event, options) {  // eslint-disable-line no-unused-vars
                    if (!$el.prop('readonly')) {
                        return {
                            text: $el.val(),
                            id: $el.data('headlineId'),
                        };
                    }
                    return null;
                },
                set: function(attr, value, options, config) {  // eslint-disable-line no-unused-vars
                    model.updateHeadlineCandidate(value, {silent: true});
                },
                attributes: [
                    {
                        name: 'data-headline-id',
                        observe: 'headlineCandidates',
                        onGet: function(valueList) {  // eslint-disable-line no-unused-vars
                            return (
                                _.has(this.orderedHeadlines[1], 'id')
                            ) ? this.orderedHeadlines[1].id : '';
                        },
                    },
                    {
                        name: 'readonly',
                        observe: 'headlineStatus',
                        onGet: function(value) { return !(value === 'drafting'); },
                    },
                ],
            };

            bindingsObj[ui.headline3.selector] = {
                observe: 'headlineCandidates',
                update: function($el, valueList, mdl) {  // eslint-disable-line no-unused-vars
                    $el.val(this.orderedHeadlines[2].text);
                },
                updateModel: function(val, event, options) {  // eslint-disable-line no-unused-vars
                    return !_.isNull(val);
                },
                getVal: function($el, event, options) {  // eslint-disable-line no-unused-vars
                    if (!$el.prop('readonly')) {
                        return {
                            text: $el.val(),
                            id: $el.data('headlineId'),
                        };
                    }
                    return null;
                },
                set: function(attr, value, options, config) {  // eslint-disable-line no-unused-vars
                    model.updateHeadlineCandidate(value, {silent: true});
                },
                attributes: [
                    {
                        name: 'data-headline-id',
                        observe: 'headlineCandidates',
                        onGet: function(valueList) {  // eslint-disable-line no-unused-vars
                            return (
                                _.has(this.orderedHeadlines[2], 'id')
                            ) ? this.orderedHeadlines[2].id : '';
                        },
                    },
                    {
                        name: 'readonly',
                        observe: 'headlineStatus',
                        onGet: function(value) { return !(value === 'drafting'); },
                    },
                ],
            };

            bindingsObj[ui.headline4.selector] = {
                observe: 'headlineCandidates',
                update: function($el, valueList, mdl) {  // eslint-disable-line no-unused-vars
                    $el.val(this.orderedHeadlines[3].text);
                },
                updateModel: function(val, event, options) {  // eslint-disable-line no-unused-vars
                    return !_.isNull(val);
                },
                getVal: function($el, event, options) {  // eslint-disable-line no-unused-vars
                    if (!$el.prop('readonly')) {
                        return {
                            text: $el.val(),
                            id: $el.data('headlineId'),
                        };
                    }
                    return null;
                },
                set: function(attr, value, options, config) {  // eslint-disable-line no-unused-vars
                    model.updateHeadlineCandidate(value, {silent: true});
                },
                attributes: [
                    {
                        name: 'data-headline-id',
                        observe: 'headlineCandidates',
                        onGet: function(valueList) {  // eslint-disable-line no-unused-vars
                            return (
                                _.has(this.orderedHeadlines[3], 'id')
                            ) ? this.orderedHeadlines[3].id : '';
                        },
                    },
                    {
                        name: 'readonly',
                        observe: 'headlineStatus',
                        onGet: function(value) { return !(value === 'drafting'); },
                    },
                ],
            };

            bindingsObj[ui.headlineRadio1.selector] = {
                observe: '',
                update: function($el, value, mdl) {},  // eslint-disable-line no-unused-vars
            };

            bindingsObj[ui.headlineVoteSubmissionToggle.selector] = {
                observe: 'headlineStatus',
                update: function($el, value, mdl) {},  // eslint-disable-line no-unused-vars
                getVal: function($el, event, options) {},  // eslint-disable-line no-unused-vars
                attributes: [
                    {
                        name: 'data-visible',
                        observe: 'headlineStatus',
                        onGet: function(val) { return (val === 'drafting') ? 'true' : 'false'; },
                    },
                ],
            };

            bindingsObj[ui.headlineVoteSubmissionToggleInput.selector] = {
                observe: 'headlinesSubmitted',
                update: function($el, value, mdl, config) {
                    var currentModelValue = mdl.get(config.observe) || false;

                    $el.prop(
                        'checked',
                        (_.isBoolean(currentModelValue)) ? currentModelValue : false
                    );
                },
                getVal: function($el, event, options) {  // eslint-disable-line no-unused-vars
                    return ($el.prop('checked') === true);
                },
                attributes: [
                    {
                        name: 'readonly',
                        observe: 'headlineStatus',
                        onGet: function(value) { return !(value === 'drafting'); },
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

            bindingsObj[ui.urlField.selector] = {
                observe: 'URL',
            };

            bindingsObj[ui.printPlacementGroup.selector] = {
                observe: 'printPlacement.printPlacements',
                initialize: function($el, mdl, opts) {  // eslint-disable-line no-unused-vars
                    var placementInputs = _.map(
                        this.printPlacementChoices,
                        function(choice) {
                            return '' +
                                '<label>' +
                                '    <input id="' + choice.slug + '"' +
                                            'class="pitched_placements"' +
                                            'name="pitched_placements[]"' +
                                            'type="checkbox"' +
                                            'value="' + choice.slug + '" />' +
                                    '<i class="helper"></i>' +
                                    choice.verboseName +
                                '</label>';
                        }
                    );

                    $el.append(placementInputs);

                    setTimeout(function() {
                        var activeGroup = $el.closest('.collapsable-inner'),
                            closestCollapsibleGroup = $el.closest('.row.can-collapse'),
                            newHeight = (
                                6 +  // 6px for bottom border/margin.
                                activeGroup.height()
                            );

                        closestCollapsibleGroup.data('expandedHeight', newHeight);

                        if (closestCollapsibleGroup.height() > 0) {
                            closestCollapsibleGroup.height(newHeight);
                        }
                    }, 0);
                },
                update: function($el, value, mdl) {},  // eslint-disable-line no-unused-vars
                getVal: function($el, event, options) {},  // eslint-disable-line no-unused-vars
            };

            bindingsObj[ui.printRunDateField.selector] = {
                observe: 'printPlacement.printRunDate',
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
                        if (!datePckr.preventDefault) {
                            $el.trigger('setPrintRunDate', date);
                        }
                    };

                    if (!_.isNull(inputValue)) {
                        newDate = mdl.generateFormattedRunDate('YYYY-MM-DD', inputValue);

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
                        newDate = mdl.generateFormattedRunDate('YYYY-MM-DD', value);

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
                getVal: function($el, event, options, newDate) {
                    return (
                        newDate[0] !== ''
                    ) ? model.parseRunDate('YYYY-MM-DD', newDate[0]) : null;
                },
            };

            bindingsObj[ui.printPlacementFields.selector] = {
                observe: 'printPlacement.printPlacements',
                update: function($el, activeValues, mdl) {  // eslint-disable-line no-unused-vars
                    _.each($el, function(choiceEl) {
                        var $choiceEl = $(choiceEl),
                            choiceSlug = $choiceEl.val();

                        $choiceEl.prop('checked', _.contains(activeValues, choiceSlug));
                    });
                },
                getVal: function($el, event, options) {  // eslint-disable-line no-unused-vars
                    var newValues = _($el).chain()
                            .filter(function(choiceEl) { return $(choiceEl).is(':checked'); })
                            .map(function(el) { return $(el).val(); })
                            .value();

                    return newValues;
                },
            };

            bindingsObj[ui.printFinalized.selector] = {
                observe: 'printPlacement.isFinalized',
                update: function($el, value, mdl) {},  // eslint-disable-line no-unused-vars
                getVal: function($el, event, options) {  // eslint-disable-line no-unused-vars
                    return $el.is(':checked');
                },
                attributes: [
                    {
                        name: 'checked',
                        observe: 'printPlacement.isFinalized',
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

        modelEvents: {},

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

        initialize: function() {
            this.isFirstRender = true;

            this._radio = Backbone.Wreqr.radio.channel('global');

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
                week: {
                    dow: 1,
                },
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

        serializeData: function() {
            return {
                csrfToken: '',
                visualsRequestURL: settings.externalURLs.addVisualsRequest,
            };
        },

        updateCollection: function(argument) {  // eslint-disable-line no-unused-vars
            // Translate each additional content item into a model
            // in this.collection.
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
            // If there are fewer than 4 headline candidates, generate
            // placeholder objects for all that are unaccounted for.
            var currentHeds = this.model.get('headlineCandidates');

            if (currentHeds.length < 4) {
                this.model.set(
                    'headlineCandidates',
                    currentHeds.concat(
                        _.map(
                            _.range(4 - currentHeds.length),
                            function(index) {
                                return {
                                    id: '__placeholder' + (index + 1),
                                    text: '',
                                    votes: 0,
                                    winner: false,
                                };
                            }
                        )
                    )
                );
            }

            // Update this.collection to reflect the current additional items.
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

            this.orderedHeadlines = _.sortBy(this.model.get('headlineCandidates'), 'id');

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

                if (!_.contains(_.pluck(hubGroupsRaw, 'value'), hubVertical.slug)) {
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

            _.each(settings.contentTypes, function(v, k, i) {  // eslint-disable-line no-unused-vars
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
            return _.map(
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
            } else {
                toggleTarget.find('h4').removeClass('section-expanded');

                toggleReceiver.css({height: 0});
            }
        },

        addNewAdditionalItem: function() {
            this.additionalItemCount++;

            this.collection.add([{
                // formID: 'additionalUnbound' + this.additionalItemCount,
            }]);
        },

        savePackage: function() {
            var packageDict = this.serializeForm(),
                saveProgressModal = {
                    modalTitle: '',
                    innerID: 'package-save-progress-modal',
                    contentClassName: 'package-modal',
                    extraHTML: '',
                    escapeButtonCloses: false,
                    overlayClosesOnClick: false,
                    buttons: [],
                };

            if (_.isNull(packageDict)) {
                this.raiseFormErrors();
            } else {
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

                $.ajax({
                    type: 'POST',
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
                        this.saveErrorCallback(
                            'saveOnly',
                            'hardError',
                            [
                                jqXHR,
                                textStatus,
                                errorThrown,
                            ]
                        );
                    }.bind(this),
                    dataType: 'json',
                });
            }
        },

        savePackageAndContinueEditing: function() {
            var packageDict = this.serializeForm(),
                saveProgressModal = {
                    modalTitle: 'Are you sure?',
                    innerID: 'package-save-progress-modal',
                    contentClassName: 'package-modal',
                    extraHTML: '',
                    escapeButtonCloses: false,
                    overlayClosesOnClick: false,
                    buttons: [],
                };

            if (_.isNull(packageDict)) {
                this.raiseFormErrors();
            } else {
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

                $.ajax({
                    type: 'POST',
                    url: settings.apiEndpoints.POST.package.save,
                    contentType: 'application/json; charset=utf-8',
                    data: JSON.stringify(packageDict),
                    processData: false,
                    success: function(data) {
                        setTimeout(function() {
                            if (data.success) {
                                this.saveSuccessCallback('saveAndContinue', data);
                            } else {
                                this.saveErrorCallback(
                                    'saveAndContinue',
                                    'processingError',
                                    [data]
                                );
                            }
                        }.bind(this), 1500);
                    }.bind(this),
                    error: function(jqXHR, textStatus, errorThrown) {
                        this.saveErrorCallback(
                            'saveAndContinue',
                            'hardError',
                            [jqXHR, textStatus, errorThrown]
                        );
                    }.bind(this),
                    dataType: 'json',
                });
            }
        },

        deleteEntirePackage: function() {
            var serializedForm = this.serializeForm(),
                dbPrimarySlug,
                currentPrimarySlug,
                itemSlugEndings,
                itemsToDelete,
                deleteConfirmationModal = {
                    modalTitle: 'Are you sure?',
                    innerID: 'additional-delete-confirmation-modal',
                    contentClassName: 'package-modal',
                    escapeButtonCloses: false,
                    overlayClosesOnClick: false,
                    buttons: [
                        {
                            buttonID: 'delete-package-delete-button',
                            buttonClass: 'flat-button delete-action expand-past-button ' +
                                            'delete-trigger',
                            innerLabel: 'Delete',
                            clickCallback: function(modalContext) {
                                var toDeleteDict = {packageID: this.model.id},
                                    $el = modalContext.$el;

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
                                    $el.addClass('red-background');
                                }, 450);

                                setTimeout(function() {
                                    $el.parent().addClass('waiting').addClass('delete-waiting')
                                                .removeClass('waiting-transition')
                                                .removeClass('delete-waiting-transition');
                                }, 500);

                                $.ajax({
                                    type: 'POST',
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
                                        this.deleteErrorCallback(
                                            'hardError',
                                            [jqXHR, textStatus, errorThrown]
                                        );
                                    }.bind(this),
                                    dataType: 'json',
                                });
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

            if (_.isNull(serializedForm)) {
                this.raiseFormErrors();
            } else {
                dbPrimarySlug = this.model.get('primaryContent').slug;
                currentPrimarySlug = this.ui.packageTitle.text();
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

                // var itemSlugs = _.map(
                //         itemSlugEndings,
                //         function(slugEnding) {
                //             var slugSuffix = '';
                //
                //             if (slugEnding !== '') {
                //                 slugSuffix = '.' + slugEnding;
                //             }
                //
                //             return currentPrimarySlug + slugSuffix;
                //         }
                //     );


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

        deleteSuccessCallback: function(data) {  // eslint-disable-line no-unused-vars
            // Close this popup and destroy it.
            setTimeout(function() {
                this._radio.commands.execute('destroyModal');
            }.bind(this),
            500);

            // Pop item from the local collection.
            // TK.

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

        saveSuccessCallback: function(mode, data) {
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

            // Add/update item in the local collection.
            // TK.

            // Navigate to the index view (or to the same page if save and continue)
            if (mode === 'saveOnly') {
                this._radio.commands.execute('navigate', this.priorPath, {trigger: true});
            } else if (mode === 'saveAndContinue') {
                if (_.isUndefined(this.model)) {
                    this._radio.commands.execute(
                        'navigate',
                        'edit/' + data.packageID + '/',
                        {trigger: true}
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
