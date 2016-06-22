define(
    [
        'jquery',
        'underscore',
        'backbone',
        'marionette',
        'selectize',
        'common/settings',
        'common/tpl',
        'budget/itemviews/modals/modal-window.js',
        'budget/itemviews/snackbars/snackbar.js',
        // 'utils/expanding-text-field'
    ],
    function(
        $,
        _,
        Backbone,
        Mn,
        selectize,
        settings,
        tpl,
        ModalView,
        SnackbarView
        // expandingTextField
    ) {
        'use strict';

        return Mn.ItemView.extend({
            template: tpl('additional-content-form'),
            tagName: 'form',
            className: 'additional-item-form',

            attributes: function() {
                return {id: this.generateFormID()};
            },

/* eslint-disable indent */
            ui: {
                packageTitle: '.content-header .package-title',
                typeDropdown: '.field-type',
                lengthGroup: '.length-group',
                lengthField: '.length-group .field-length',
                pitchLinkGroup: '.request-link-group',
                addRequestButton: '.request-link-group .button',
                slugGroup: '.slug-group-holder',
                slugField: '.keyword-group input',
                slugPlaceholder: '.keyword-group .keyword-value',
slugSuffixHolder: '.slug-group-holder .slug-suffix',
                budgetLineField: '.expanding-holder .field-budgetline',
                budgetLinePlaceholder: '.expanding-holder .budget-spacer',
                authorsDropdown: '.field-authors',
                editorsDropdown: '.field-editors',
deleteTrigger: '.delete-additional',
            },
/* eslint-enable indent */

            bindings: function() {
                var bindingsObj = {},
                    ui = this.ui,
                    model = this.model;

                bindingsObj[ui.packageTitle.selector] = {
                    observe: [
                        'parentSlug',
                        'slugKey',
                    ],
                    onGet: function(values, options) {  // eslint-disable-line no-unused-vars
                        return [
                            this.options.primarySlug,
                            values[1],
                        ];
                    },
                    update: function($el, vals, mdl) {  // eslint-disable-line no-unused-vars
                        $el.text((vals[1] !== '') ? vals.join('.') : vals[0] + '.keyword');
                    },
                };

                bindingsObj[ui.typeDropdown.selector] = {
                    observe: 'type',
                    initialize: function($el, mdl, options) {  // eslint-disable-line no-unused-vars
                        var typeOpts = {
                            maxItems: 1,
                            options: this.options.typeChoices,
                            render: {
                                item: function(dta, escape) {  // eslint-disable-line no-unused-vars
                                    var dataType = 'fullText';  // eslint-disable-line no-unused-vars,max-len
                                    if (typeof(dta.type) !== 'undefined') { dataType = dta.type; }
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
                        var oldType = model.get('type'),
                            oldKeyMatch = (oldType === 'text') ? 'article' : oldType;

                        if ($el.val()) {
                            if (
                                (!model.has('slugKey')) ||
                                (model.get('slugKey') === '') ||
                                (model.get('slugKey') === oldKeyMatch)
                            ) {
                                model.set(
                                    'slugKey',
                                    ($el.val() === 'text') ? 'article' : $el.val()
                                );
                            }

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
                    observe: 'type',
                    update: function($el, value, mdl) {  // eslint-disable-line no-unused-vars
                        var field = $el.find('input');

                        if (value && settings.contentTypes[value].usesLengthAttribute) {
                            if (field.prop('disabled')) { field.prop('disabled', false); }
                        } else {
                            if (!field.prop('disabled')) { field.prop('disabled', true); }
                        }
                    },
                    attributes: [
                        {
                            name: 'field-active',
                            observe: 'type',
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
                    observe: 'length',
                    getVal: function($el, event, options) { return $el.val() || null; },   // eslint-disable-line no-unused-vars,max-len
                };

                bindingsObj[ui.pitchLinkGroup.selector] = {
                    observe: 'type',
                    update: function($el, value, mdl) {},  // eslint-disable-line no-unused-vars
                    attributes: [
                        {
                            name: 'field-active',
                            observe: 'type',
                            onGet: function(value) {
                                if (value && settings.contentTypes[value].usesPitchSystem) {
                                    return 'true';
                                }

                                return 'false';
                            },
                        },
                    ],
                };

                bindingsObj[ui.slugGroup.selector] = {
                    observe: [
                        'parentSlug',
                        'slugKey',
                    ],
                    initialize: function($el, mdl, options) {  // eslint-disable-line no-unused-vars
                        $el.on(
                            'recalculateSpacing',
                            function(event) {  // eslint-disable-line no-unused-vars
                                var slugGroup = ui.slugField.closest('.slug-group-holder'),
                                    primaryWidth = slugGroup.find('.primary-content-slug').width(),
                                    inputPadding = {};

                                inputPadding.left = primaryWidth + 5;
                                inputPadding.right = slugGroup.find('.slug-suffix').width();

                                ui.slugField.css({
                                    left: -1 * inputPadding.left,
                                });
                                ui.slugField.css({
                                    'padding-left': inputPadding.left,
                                });
                                ui.slugField.css({
                                    'padding-right': inputPadding.right,
                                });
                                ui.slugField.css({
                                    width: slugGroup.width(),
                                });
                            }.bind(this)  // eslint-disable-line no-extra-bind
                        );

                        setTimeout(function() {
                            $el.trigger('recalculateSpacing');
                        }.bind(this), 0);  // eslint-disable-line no-extra-bind
                    },
                    onGet: function(values, options) {  // eslint-disable-line no-unused-vars
                        return [
                            this.options.primarySlug,
                            values[1],
                        ];
                    },
                    update: function($el, values, mdl) {  // eslint-disable-line no-unused-vars
                        var slugGroup = ui.slugField.closest('.slug-group-holder'),
                            primaryWidth = slugGroup.find('.primary-content-slug');

                        primaryWidth.text(values[0] + '.');

                        // TODO: Also bind 'recalculateSpacing' on browser resize.
                        $el.trigger('recalculateSpacing');
                    },
                    getVal: function($el, event, options) {},  // eslint-disable-line no-unused-vars
                };

                bindingsObj[ui.slugField.selector] = {
                    observe: 'slugKey',
                    initialize: function($el, mdl, options) {
                        $el.attr('data-original-value', mdl.get(options.observe));

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
                };

                bindingsObj[ui.slugPlaceholder.selector] = {
                    observe: 'slugKey',
                    update: function($el, value, mdl) {  // eslint-disable-line no-unused-vars
                        $el.text((value !== '') ? value : ui.slugField.attr('placeholder'));
                    },
                    getVal: function($el, event, options) {},  // eslint-disable-line no-unused-vars
                };

                bindingsObj[ui.budgetLineField.selector] = {
                    observe: 'budgetLine',
                    initialize: function($el, mdl, options) {  // eslint-disable-line no-unused-vars
                        $el.closest('.expanding-holder').addClass('expanding-enabled');
                        $el.bind('focus', function() {
                            $(this).parent().addClass('input-focused');
                        });
                        $el.bind('blur', function() {
                            $(this).parent().removeClass('input-focused');
                        });
                    },
                    update: function($el, value, mdl) {  // eslint-disable-line no-unused-vars
                        $el.text(value);
                    },
                };

                bindingsObj[ui.budgetLinePlaceholder.selector] = {
                    observe: 'budgetLine',
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
                    observe: 'authors',
                    setOptions: {silent: true},
                    initialize: function($el, mdl, options) {  // eslint-disable-line no-unused-vars
                        var authorOpts = {
                            closeAfterSelect: false,
                            plugins: ['remove_button', 'restore_on_backspace'],

                            options: this.options.stafferChoices,

                            render: {
                                item: function(dta, escape) {  // eslint-disable-line no-unused-vars
                                    var dataType = 'fullText';  // eslint-disable-line no-unused-vars,max-len
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
                                        this.options.staffers.findWhere({
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
                    observe: 'editors',
                    setOptions: {silent: true},
                    initialize: function($el, mdl, options) {  // eslint-disable-line no-unused-vars
                        var editorOpts = {
                            closeAfterSelect: false,
                            plugins: ['remove_button', 'restore_on_backspace'],

                            options: this.options.stafferChoices,

                            render: {
                                item: function(dta, escape) {  // eslint-disable-line no-unused-vars
                                    var dataType = 'fullText';  // eslint-disable-line no-unused-vars,max-len
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
                                        this.options.staffers.findWhere({
                                            email: editorKey,
                                        }).toJSON()
                                    );
                                }
                            }.bind(this)
                        );

                        return newEditors;
                    },
                };

                return bindingsObj;
            },

            events: {
                'mousedown @ui.addRequestButton': 'addButtonClickedClass',
                'click @ui.addRequestButton': 'openVisualsRequestForm',
                'click @ui.deleteTrigger': 'deleteItem',
            },

            // modelEvents: {
            //     'change': 'render'
            // },

            initialize: function() {
                this._radio = Backbone.Wreqr.radio.channel('global');

                if (this.model.has('id')) {
                    this.slugSuffixRaw = _.last(
                        _.last(
                            this.model.get('slug').split('.')
                        ).split(
                            this.model.get('slugKey')
                        )
                    );
                } else {
                    this.slugSuffixRaw = '';
                }
            },

            serializeData: function() {
                return {
                    formID: this.generateFormID(),
                    visualsRequestURL: settings.externalURLs.addVisualsRequest,
                };
            },

            onRender: function() {
                this.stickit();
            },

            onShow: function() {},

            onAttach: function() {},


            /*
             *   Instantiation methods.
             */

            generateFormID: function() {
                var thisIndex,
                    boundFormCount;

                if (this.model.has('id')) {
                    return 'additionalBound' + this.model.get('id');
                }

                thisIndex = this.model.collection.indexOf(this.model);
                boundFormCount = this.model.collection.filter(
                    function(i) { return i.has('id'); }
                ).length;

                return 'additionalUnbound' + (thisIndex - boundFormCount + 1);
            },


            /*
             *   Event handlers.
             */

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

            deleteItem: function() {
                var deleteConfirmationModal = {
                    modalTitle: 'Are you sure?',
                    innerID: 'additional-delete-confirmation-modal',
                    contentClassName: 'package-modal',
                    extraHTML: '<p class="delete-confirmation-text">' +
                                     'You are about to delete the following budgeted content:' +
                                 '</p>' +
                                 '<ul class="to-be-deleted-list">' +
                                     '<li class="to-be-deleted-item">' +
                                         this.model.get('slug') +
                                     '</li>' +
                                 '</ul>' +
                                 '<p class="delete-confirmation-text">' +
                                     'Items can&rsquo;t be recovered once they&rsquo;ve ' +
                                     'been deleted.' +
                                 '</p>' +
                                 '<p class="delete-confirmation-text">' +
                                     'If you&rsquo;re sure you want to delete this item, ' +
                                     'click the <span class="button-text-inline">delete</span> ' +
                                     'button below.' +
                                 '</p>',
                    escapeButtonCloses: false,
                    overlayClosesOnClick: false,
                    buttons: [
                        {

                            buttonID: 'delete-package-delete-button',
                            buttonClass: 'flat-button delete-action ' +
                                            'expand-past-button delete-trigger',
                            innerLabel: 'Delete',
                            clickCallback: function(modalContext) {
                                var toDeleteDict = {
                                    itemToDeleteID: this.model.id,
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
                                }.bind(this), 600);  // eslint-disable-line no-extra-bind

                                setTimeout(function() {
                                    modalContext.$el.find('.modal-inner').css({
                                        visibility: 'hidden',
                                    });

                                    modalContext.$el.addClass('red-background');
                                }, 450);

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
                                    type: 'POST',
                                    url: settings.apiEndpoints.POST.additionalItem.delete,
                                    contentType: 'application/json; charset=utf-8',
                                    data: JSON.stringify(toDeleteDict),
                                    processData: false,
                                    success: function(data) {
                                        setTimeout(function() {
                                            if (data.success) {
                                                this.deleteSuccessCallback(data);
                                            } else {
                                                this.deleteErrorCallback(
                                                    'processingError',
                                                    [data]
                                                );
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
                            buttonID: 'delete-additional-content-cancel-button',
                            buttonClass: 'flat-button primary-action cancel-trigger',
                            innerLabel: 'Cancel',
                            clickCallback: function(modalContext) {  // eslint-disable-line no-unused-vars,max-len
                                this._radio.commands.execute('destroyModal');
                            }.bind(this),
                        },
                    ],
                };

                if (this.model.has('id')) {
                    this.modalView = new ModalView({
                        modalConfig: deleteConfirmationModal,
                    });

                    this._radio.commands.execute('showModal', this.modalView);
                } else {
                    this.model.destroy();
                }
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

                // Destroy view.
                this.destroy();

                // Display snackbar:
                this._radio.commands.execute(
                    'showSnackbar',
                    new SnackbarView({
                        containerClass: 'edit-page',
                        snackbarClass: 'success',
                        text: 'Successfully deleted additional item.',
                        action: {
                            promptText: 'Dismiss',
                        },
                    })
                );
            },

            deleteErrorCallback: function(errorType, errorArgs) {  // eslint-disable-line no-unused-vars,max-len
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
                        text: 'Could not delete additional item. Try again later.',
                    })
                );
            },


            /*
             *   Form serializer.
             */

            serializeForm: function() {
                var rawFormData = {},
                    formIsUnbound = false,
                    finalAdditionalContent = {},
                    nonNullValues;

                if (!this.model.has('id')) {
                    formIsUnbound = true;
                }

                _.each(
                    this.$el.find(
                        "[data-form='" + this.generateFormID() + "']"
                    ),
                    function(field) {
                        if (!field.disabled) {
                            rawFormData[field.name.split('_')[1]] = field.value;
                        }
                    }
                );

                finalAdditionalContent.slugKey = rawFormData.slugkey;
                finalAdditionalContent.type = rawFormData.type;
                finalAdditionalContent.budgetLine = rawFormData.budgetline;

                if (_.has(rawFormData, 'length')) {
                    finalAdditionalContent.length = rawFormData.length;
                }

                if (rawFormData.authors !== '') {
                    finalAdditionalContent.authors = _.map(
                        rawFormData.authors.split(','),
                        function(authorEmail) {
                            return this.options.staffers.findWhere({
                                email: authorEmail,
                            }).toJSON();
                        }.bind(this)
                    );
                }

                if (rawFormData.editors !== '') {
                    finalAdditionalContent.editors = _.map(
                        rawFormData.editors.split(','),
                        function(editorEmail) {
                            return this.options.staffers.findWhere({
                                email: editorEmail,
                            }).toJSON();
                        }.bind(this)
                    );
                }

                if (formIsUnbound) {
                    nonNullValues = _.chain(finalAdditionalContent)
                                            .values()
                                            .uniq()
                                            .compact()
                                            .flatten()
                                            .value();
                    if (_.isEmpty(nonNullValues)) {
                        finalAdditionalContent = {};
                    }
                } else {
                    finalAdditionalContent.id = rawFormData.id;
                }

                return finalAdditionalContent;
            },
        });
    }
);
