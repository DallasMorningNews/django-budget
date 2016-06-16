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

            ui: {
                titleKeyword: '.content-header .keyword',
                titleUniqueModifier: '.content-header .unique-modifier',
                slugField: '.field-slugkey',
                slugSuffixHolder: '.slug-group-holder .slug-suffix',
                budgetLineField: '.field-budgetline',
                typeDropdown: '.field-type',
                lengthGroup: '.length-group',
                lengthField: '.length-group .field-length',
                pitchLinkGroup: '.request-link-group',
                addRequestButton: '.request-link-group .button',
                authorsDropdown: '.field-authors',
                editorsDropdown: '.field-editors',
                deleteTrigger: '.delete-additional',
                // packageSheetOuter: '.package-sheet',
                // expansionTrigger: '.expand-package',
                // notesModalTrigger: '.notes',
                // printInfoModalTrigger: '.print-info',
                // webInfoModalTrigger: '.web-info'
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
                var modelJSON = this.model.toJSON(),
                    templateContext = {};

                if (!_.isEmpty(modelJSON)) {
                    templateContext.config = modelJSON;

                    templateContext.additionalType = settings.contentTypes[
                        modelJSON.type
                    ];
                }

                templateContext.formID = this.generateFormID();

                if (this.model.has('id') && this.model.has('length')) {
                    templateContext.formattedLength = parseInt(
                        this.model.get('length'),
                        10
                    );
                }

                templateContext.primarySlug = this.options.primarySlug;

                templateContext.slugSuffixRaw = this.slugSuffixRaw;

                templateContext.visualsRequestURL = settings.externalURLs.addVisualsRequest;

                return templateContext;
            },

            onRender: function() {
                this.initializeTypeDropdown();
                this.initializeSlugField();
                // expandingTextField.make(this.ui.budgetLineField);
                this.initializeAuthorDropdown();
                this.initializeEditorDropdown();
            },

            onShow: function() {
                this.updateSlugGroup();
            },

            onAttach: function() {
                this.updateSlugGroup();
            },


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
             *   Control initializers (for selectize boxes, datepickers, etc.).
             */

            initializeTypeDropdown: function() {
                this.ui.typeDropdown.selectize({
                    closeAfterSelect: true,
                    maxItems: 1,
                    openOnFocus: true,
                    plugins: ['restore_on_backspace'],
                    // selectOnTab: true,

                    options: this.options.typeChoices,
                    labelField: 'name',
                    searchField: ['name'],
                    valueField: 'value',

                    render: {
                        item: function(data, escape) {  // eslint-disable-line no-unused-vars
                            var dataType = 'fullText';  // eslint-disable-line no-unused-vars
                            if (typeof(data.type) !== 'undefined') {
                                dataType = data.type;
                            }

                            return '<div data-value="' + data.value +
                                        '" class="selected-item">' + data.name +
                                    '</div>';
                        },
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

                        if (_.isEmpty(this.ui.slugField.val())) {
                            this.ui.slugField.val(value);
                        } else {
                            if (!_.isUndefined(this.$el.data('type'))) {
                                if (this.ui.slugField.val() === this.$el.data('type')) {
                                    this.ui.slugField.val(value);
                                }
                            }
                        }

                        this.$el.data('type', value);
                    }.bind(this),
                    onItemRemove: function(value) {
                        var typeConfig = settings.contentTypes[value];

                        if (typeConfig.usesLengthAttribute) {
                            this.hideField(this.ui.lengthField, this.ui.lengthGroup);
                        } else if (typeConfig.usesPitchSystem) {
                            this.hideField(null, this.ui.pitchLinkGroup);
                        }

                        if (!_.isEmpty(this.ui.slugField.val())) {
                            if (value === this.ui.slugField.val()) {
                                this.ui.slugField.val('');
                            }
                        }

                        this.$el.removeData('type', value);
                    }.bind(this),
                });
            },

            initializeSlugField: function() {
                var slugField = this.ui.slugField;

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

                        if (!($.trim(slugField.val()))) {
                            slugField.siblings('.keyword-value').html(
                                slugField.attr('placeholder')
                            );
                        }

                        if (this.model.has('id')) {
                            if (
                                _.isEmpty(this.slugSuffixRaw)
                            ) {
                                // There is no initial trailing number at the
                                // end of this slug.
                                this.ui.slugSuffixHolder.text('');
                                this.ui.slugSuffixHolder.hide();

                                this.updateAdditionalTitle(
                                    slugField.val(),
                                    null
                                );
                            } else {
                                // There is an initial trailing number at the
                                // end of this slug.
                                this.ui.slugSuffixHolder.text('');
                                this.ui.slugSuffixHolder.show();

                                this.updateAdditionalTitle(
                                    slugField.val(),
                                    this.slugSuffixRaw
                                );
                            }
                        } else {
                            this.ui.slugSuffixHolder.text('');
                            this.ui.slugSuffixHolder.show();

                            this.updateAdditionalTitle(
                                slugField.val(),
                                null
                            );
                        }
                    }.bind(this)
                );
            },

            initializeAuthorDropdown: function() {
                this.ui.authorsDropdown.selectize({
                    // closeAfterSelect: true,
                    openOnFocus: true,
                    plugins: ['remove_button', 'restore_on_backspace'],
                    // selectOnTab: true,

                    options: this.options.stafferChoices,
                    labelField: 'name',
                    searchField: ['name'],
                    valueField: 'value',

                    render: {
                        item: function(data, escape) {  // eslint-disable-line no-unused-vars
                            var dataType = 'fullText';  // eslint-disable-line no-unused-vars
                            if (typeof(data.type) !== 'undefined') {
                                dataType = data.type;
                            }

                            return '<div data-value="' + data.value +
                                        '" class="selected-item-multichoice">' +
                                        data.name +
                                    '</div>';
                        },
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
                    onItemAdd: function(value, $item) {},  // eslint-disable-line no-unused-vars
                    onItemRemove: function(value) {},  // eslint-disable-line no-unused-vars
                });
            },

            initializeEditorDropdown: function() {
                this.ui.editorsDropdown.selectize({
                    // closeAfterSelect: true,
                    openOnFocus: true,
                    plugins: ['remove_button', 'restore_on_backspace'],
                    // selectOnTab: true,

                    options: this.options.stafferChoices,
                    labelField: 'name',
                    searchField: ['name'],
                    valueField: 'value',

                    render: {
                        item: function(data, escape) {  // eslint-disable-line no-unused-vars
                            var dataType = 'fullText';  // eslint-disable-line no-unused-vars
                            if (typeof(data.type) !== 'undefined') {
                                dataType = data.type;
                            }

                            return '<div data-value="' + data.value +
                                        '" class="selected-item-multichoice">' +
                                        data.name +
                                    '</div>';
                        },
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
                    onItemAdd: function(value, $item) {},  // eslint-disable-line no-unused-vars
                    onItemRemove: function(value) {},  // eslint-disable-line no-unused-vars
                });
            },


            /*
             * Control modifiers.
             */

            updateAdditionalTitle: function(newSlugValue, newSuffixValue) {
                this.ui.titleKeyword.text(newSlugValue);

                if (!_.isNull(newSlugValue)) {
                    this.ui.titleUniqueModifier.text(newSuffixValue);
                } else {
                    this.ui.titleUniqueModifier.text('');
                }
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

            updateSlugGroup: function(hubValue) {  // eslint-disable-line no-unused-vars
                var slugField = this.ui.slugField,
                    slugGroup = slugField.closest('.slug-group-holder'),
                    inputPadding = {};

                inputPadding.left = slugGroup.find('.primary-content-slug').width() + 5;
                inputPadding.right = slugGroup.find('.slug-suffix').width();

                slugField.css({
                    left: -1 * inputPadding.left,
                });
                slugField.css({
                    'padding-left': inputPadding.left,
                });
                slugField.css({
                    'padding-right': inputPadding.right,
                });
                slugField.css({
                    width: slugGroup.width(),
                });
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
