define(
    [
        'jquery',
        'underscore',
        'backbone',
        'marionette',
        'selectize',
        'itemviews/modals/modal-window.js',
        'misc/settings',
        'misc/tpl',
        'utils/expanding-text-field'
    ],
    function(
        $,
        _,
        Backbone,
        Mn,
        selectize,
        ModalView,
        settings,
        tpl,
        expandingTextField
    ) {
        'use strict';

        return Mn.ItemView.extend({
            template: tpl('additional-content-form'),

            tagName: 'form',

            className: 'additional-item-form',

            attributes: function() {
                return {
                    id: this.model.get('formID')
                };
            },

            ui: {
                budgetLineField: '.field-budgetline',
                typeDropdown: '.field-type',
                lengthGroup: '.length-group',
                lengthField:  '.length-group .field-length',
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
                'click @ui.deleteTrigger': 'deleteItem',
            },

            // modelEvents: {
            //     'change': 'render'
            // },

            initialize: function() {
                this._radio = Backbone.Wreqr.radio.channel('global');
            },

            serializeData: function() {
                var templateContext = {
                    config: this.model.toJSON(),
                };

                if (this.model.has('boundData') && _.has(this.model.get('boundData'), 'length')) {
                    templateContext.formattedLength = parseInt(
                        this.model.get('boundData').length,
                        10
                    );

                    console.log(templateContext.formattedLength);
                }

                return templateContext;
            },

            deleteItem: function() {
                if (this.model.has('boundData')) {
                    var deleteConfirmationModal = {
                        'modalTitle': 'Are you sure?',
                        'innerID': 'additional-delete-confirmation-modal',
                        'extraHTML': '<p class="delete-confirmation-text">' +
                                         'You are about to delete the following budgeted content:' +
                                     '</p>' +
                                     '<ul class="to-be-deleted-list">' +
                                         '<li class="to-be-deleted-item">' +
                                             this.model.get('boundData').slug +
                                         '</li>' +
                                     '</ul>' +
                                     '<p class="delete-confirmation-text">' +
                                         'Items can&rsquo;t be recovered once they&rsquo;ve been deleted.' +
                                     '</p>' +
                                     '<p class="delete-confirmation-text">' +
                                         'If you&rsquo;re sure you want to delete this item, click the <span class="button-text-inline">delete</span> button below.' +
                                     '</p>',
                        'buttons': [
                            {'ariaHidden': true, 'ariaLabel': 'Cancel', 'class': '', 'dataAttrs': 'data-close', 'innerLabel': 'Cancel', 'name': 'cancel', 'type': 'button'},
                            {'ariaHidden': true, 'ariaLabel': 'Delete', 'class': 'save', 'dataAttrs': '', 'innerLabel': 'Delete', 'name': 'delete', 'type': 'submit'}
                        ]
                    };

                    this.modalView = new ModalView({
                        modalConfig: deleteConfirmationModal
                    });

                    this._radio.commands.execute('showModal', this.modalView);
                } else {
                    this.model.destroy();
                }
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

            onRender: function() {
                expandingTextField.make(this.ui.budgetLineField);

                this.ui.typeDropdown.selectize({
                    closeAfterSelect: true,
                    maxItems: 1,
                    openOnFocus: true,
                    plugins: ['restore_on_backspace'],
                    // selectOnTab: true,

                    options: this.options.typeChoices,
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

                    options: this.options.stafferChoices,
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

                    options: this.options.stafferChoices,
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
            },

            serializeForm: function() {
                var rawFormData = {},
                    formIsUnbound = false;

                if (this.model.get('formID').indexOf('additionalUnbound') >= 0) {
                    formIsUnbound = true;
                }

                _.each(
                    this.$el.find(
                        "[data-form='" + this.model.get('formID') + "']"
                    ),
                    function(field) {
                        if (!field.disabled) {
                            rawFormData[field.name.split('_')[1]] = field.value;
                        }
                    }
                );

                var finalAdditionalContent = {};

                finalAdditionalContent.id = rawFormData.id;
                finalAdditionalContent.slug = rawFormData.slug;
                finalAdditionalContent.type = rawFormData.type;
                finalAdditionalContent.budgetLine = _.chain(
                    rawFormData.budgetline.split('</p>')
                ).map(
                    function(substring) {
                        var shortenedSubstring = substring.replace('<p>', '').trim();
                        if (shortenedSubstring !== '') {
                            return shortenedSubstring;
                        } else {
                            return false;
                        }
                    }
                ).compact().value();

                if (_.has(rawFormData, 'length')) {
                    finalAdditionalContent.length = rawFormData.length;
                }

                if (rawFormData.authors !== '') {
                    finalAdditionalContent.authors = _.map(
                        rawFormData.authors.split(','),
                        function(authorEmail) {
                            return this.options.staffers.findWhere({
                                'email': authorEmail
                            }).toJSON();
                        }.bind(this)
                    );
                }

                if (rawFormData.editors !== '') {
                    finalAdditionalContent.editors = _.map(
                        rawFormData.editors.split(','),
                        function(editorEmail) {
                            return this.options.staffers.findWhere({
                                'email': editorEmail
                            }).toJSON();
                        }.bind(this)
                    );
                }

                if (formIsUnbound) {
                    var nonNullValues = _.chain(finalAdditionalContent)
                                            .values()
                                            .uniq()
                                            .compact()
                                            .flatten()
                                            .value();
                    if (_.isEmpty(nonNullValues)) {
                        finalAdditionalContent = {};
                    }
                }

                return finalAdditionalContent;
            },
        });
    }
);