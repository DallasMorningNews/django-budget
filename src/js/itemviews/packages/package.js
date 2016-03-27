define(
    [
        'jquery',
        'underscore',
        'backbone',
        'marionette',
        'misc/settings',
        'misc/tpl',
        'itemviews/modals/modal-window.js'
    ],
    function(
        $,
        _,
        Backbone,
        Mn,
        settings,
        tpl,
        ModalView
    ) {
        'use strict';

        return Mn.ItemView.extend({
            template: tpl('package-item'),

            className: 'package-sheet-holder',

            ui: {
                packageSheetOuter: '.package-sheet',
                expansionTrigger: '.expand-package',
                notesModalTrigger: '.notes',
                printInfoModalTrigger: '.print-info',
                webInfoModalTrigger: '.web-info'
            },

            events: {
                'click @ui.expansionTrigger': 'expandPackageSheet',
                'click @ui.notesModalTrigger': 'showNotesModal',
                'click @ui.printInfoModalTrigger': 'showPrintInfoModal',
                'click @ui.webInfoModalTrigger': 'showWebInfoModal'
            },

            modelEvents: {
                'change': 'render'
            },

            initialize: function() {
                this._radio = Backbone.Wreqr.radio.channel('global');
            },

            serializeData: function() {
                var packageObj = this.model.toJSON(),
                    packageHub = this.options.hubConfigs.findWhere({
                        slug: packageObj.hub
                    });

                if (!_.isUndefined(packageHub)){
                    packageObj.hubDotColor = packageHub.get('color');
                    packageObj.verticalSlug = packageHub.get('vertical').slug;
                }

                packageObj.allPeople = _.union(
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

                packageObj.primaryContent.typeMeta = settings.contentTypes[
                    this.model.get('primaryContent').type
                ];

                packageObj.additionalTypes = _.map(
                    _.pluck(this.model.get('additionalContent'), 'type'),
                    function(typeSlug) {
                        var typeObj = _.clone(settings.contentTypes[typeSlug]);
                        typeObj.slug = typeSlug;
                        return typeObj;
                    }
                );

                return packageObj;
            },

            expandPackageSheet: function(e) {
                this.ui.packageSheetOuter.toggleClass('expanded');
            },

            showNotesModal: function(e) {
                var notesModal = {
                    'modalTitle': 'Production notes',
                    'innerID': 'production-notes-modal',
                    'extraHTML': '<div class="mode-toggle">' +
                                 '    <div trigger-mode="read-only">Read</div>' +
                                 '    <div trigger-mode="edit">Edit</div>' +
                                 '</div>' +
                                 '<div class="modes">' +
                                 '    <div class="read-only">' + this.model.get('notes') + '</div>' +
                                 '    <div class="edit"><textarea>' + this.model.get('notes') + '</textarea></div>' +
                                 '</div>',
                    'buttons': [
                        {'ariaHidden': true, 'ariaLabel': 'Close modal', 'class': '', 'dataAttrs': 'data-close', 'innerLabel': 'Close', 'name': '', 'type': 'button'},
                        {'ariaHidden': true, 'ariaLabel': 'Close modal', 'class': 'confirm', 'dataAttrs': 'data-close', 'innerLabel': 'Save', 'name': '', 'type': 'button'}
                    ]
                };

                this.modalView = new ModalView({
                    modalConfig: notesModal
                });

                this._radio.commands.execute('showModal', this.modalView);
            },

            showPrintInfoModal: function(e) {
                var printInfoModal = {
                    'modalTitle': 'Print placement info',
                    'innerID': 'package-print-info',
                    'formConfig': {
                        'rows': [
                            {'extraClasses': '', 'fields': [
                                {'widthClasses': 'small-12 medium-12 large-12', 'labelText': 'Print run date', 'inputName': 'print_issue', 'inputType': 'date', 'inputValue': this.model.get('printPlacement').printIssue},
                                {'widthClasses': 'small-12 medium-12 large-12', 'labelText': 'Page(s)', 'inputName': 'print_pages', 'inputType': 'text', 'inputValue': this.model.get('printPlacement').printPages}
                            ]}
                        ]
                    },
                    'buttons': [
                        {'ariaHidden': true, 'ariaLabel': 'Close modal', 'class': '', 'dataAttrs': 'data-close', 'innerLabel': 'Close', 'name': '', 'type': 'button'},
                        {'ariaHidden': true, 'ariaLabel': 'Save', 'class': 'save', 'dataAttrs': '', 'innerLabel': 'Save', 'name': 'Save', 'type': 'submit'}
                    ]
                };

                this.modalView = new ModalView({
                    modalConfig: printInfoModal
                });

                this._radio.commands.execute('showModal', this.modalView);
            },

            showWebInfoModal: function(e) {
                var webInfoModal = {
                    'modalTitle': 'Web placement info',
                    'innerID': 'package-web-info',
                    'formConfig': {
                        'rows': [
                            {'extraClasses': '', 'fields': [
                                {'widthClasses': 'small-12 medium-12 large-12', 'labelText': 'URL', 'inputName': 'url', 'inputType': 'text', 'inputValue': ''}
                            ]},
                            {'extraClasses': '', 'fields': [
                                {'widthClasses': 'small-6 medium-8 large-8', 'labelText': 'Date published (online)', 'inputID': 'pubDate', 'inputName': 'pub_date', 'inputType': 'date', 'inputValue': ''},
                                {'widthClasses': 'small-6 medium-4 large-4', 'labelText': 'Time published', 'inputID': 'pubTime', 'inputName': 'pub_time', 'inputType': 'time', 'inputValue': ''}
                            ]}
                        ]
                    },
                    'buttons': [
                        {'ariaHidden': true, 'ariaLabel': 'Close modal', 'class': '', 'dataAttrs': 'data-close', 'innerLabel': 'Close', 'name': '', 'type': 'button'},
                        {'ariaHidden': true, 'ariaLabel': 'Save', 'class': 'save', 'dataAttrs': '', 'innerLabel': 'Save', 'name': 'Save', 'type': 'submit'}
                    ]
                };

                this.modalView = new ModalView({
                    modalConfig: webInfoModal
                });

                this._radio.commands.execute('showModal', this.modalView);
            }
        });
    }
);