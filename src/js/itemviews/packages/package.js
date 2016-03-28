define(
    [
        'backbone',
        'jquery',
        'marionette',
        'underscore',
        'itemviews/modals/modal-window.js',
        'itemviews/snackbars/snackbar.js',
        'misc/settings',
        'misc/tpl'

    ],
    function(
        Backbone,
        $,
        Mn,
        _,
        ModalView,
        SnackbarView,
        settings,
        tpl
    ) {
        'use strict';

        return Mn.ItemView.extend({
            template: tpl('package-item'),

            className: 'package-sheet-holder',

            ui: {
                slugHeadlineHolder: '.slug-headline-holder',
                packageSheetOuter: '.package-sheet',
                expansionTrigger: '.expand-package',
                notesModalTrigger: '.notes',
                printInfoModalTrigger: '.print-info',
                webInfoModalTrigger: '.web-info'
            },

            events: {
                'click @ui.expansionTrigger': 'expandPackageSheet',
                'click @ui.slugHeadlineHolder': 'showHeadlineVotingModal',
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

                if (packageObj.headlines.candidates.length) {
                    packageObj.leadingHeadline = _.chain(packageObj.headlines.candidates)
                                                        .sortBy('votes')
                                                        .last()
                                                        .value()
                                                        .headline;
                }
// "has-leading-headline"

                return packageObj;
            },

            expandPackageSheet: function(e) {
                this.ui.packageSheetOuter.toggleClass('expanded');
            },

            showHeadlineVotingModal: function(e) {
                if (this.ui.slugHeadlineHolder.hasClass('has-leading-headline')) {
                    var headlineFields = _.chain(this.model.get('headlines').candidates)
                        .map(function(hed) {
                            return '' +
                            '<div class="radio">' +
                                '<label>' +
                                    '<input id="headline' + hed.id + '" name="modalHeadlines" ' +
                                        'type="radio" value="' + hed.id + '">' +
                                    '<i class="helper"></i>' +
                                    '<span class="radio-label">' +
                                        hed.headline +
                                    '</span>' +
                                '</label>' +
                            '</div>';
                        })
                        .reduce(function(memo, num){ return memo + num; }, '')
                        .value(),
                        headlineVotingModal = {
                            'modalTitle': 'Vote for your favorite headline',
                            'innerID': 'headline-voting-modal',
                            'extraHTML': '' +
                                '<form>' +
                                    '<div class="row">' +
                                        '<div class="medium-12 columns form-radio">' +
                                            headlineFields +
                                            // '<div class="radio">' +
                                            //     '<label>' +
                                            //     '<input id="headlineOther" ' +
                                            //         'name="modalHeadlines" ' +
                                            //         'data-form="package" ' +
                                            //         'type="radio" ' +
                                            //         'value="other" />' +
                                            //             '<i class="helper"></i>' +
                                            //             '<span class="radio-label">' +
                                            //                 'Other headline' +
                                            //             '</span>' +
                                            //     '</label>' +
                                            // '</div>' +
                                        '</div>' +
                                    '</div>' +
                                '</form>',
                            'buttons': [
                                {
                                    'buttonID': 'headline-voting-record-vote-button',
                                    'buttonClass': 'flat-button disabled save-action expand-past-button record-vote-trigger',
                                    'innerLabel': 'Vote',
                                    'clickCallback': function(modalContext) {
                                        var voteData = {
                                            packageID: this.model.get('id'),
                                            chosenHeadline: modalContext.$el.find('form').serializeArray()[0].value,
                                            userName: 'TK',
                                        };

                                        modalContext.$el.parent().addClass('waiting-transition');

                                        modalContext.$el.parent().parent().css({
                                            'pointer-events': 'none'
                                        });

                                        modalContext.$el.append(
                                            '<div class="loading-animation deletion-loading-animation">' +
                                                '<div class="loader">' +
                                                    '<svg class="circular" viewBox="25 25 50 50">' +
                                                        '<circle class="path" cx="50" cy="50" r="20" ' +
                                                                'fill="none" stroke-width="2" ' +
                                                                'stroke-miterlimit="10"/>' +
                                                    '</svg>' +
                                                    '<i class="fa fa-commenting-o fa-2x fa-fw"></i>' +
                                                '</div>' +
                                                '<p class="loading-text">Recording your vote...</p>' +
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
                                            500
                                        );

                                        setTimeout(
                                            function() {
                                                modalContext.$el.parent()
                                                                    .addClass('waiting')
                                                                    .addClass('save-waiting')
                                                                    .removeClass('waiting-transition');
                                            },
                                            500
                                        );

                                        // $.ajax({
                                        //     type: "POST",
                                        //     url: settings.urlConfig.postEndpoints.recordHeadlineVote,
                                        //     data: voteData,
                                        //     success: function(data) {
                                        //         // Close this popup and destroy it.
                                        //         modalContext.$el.parent().foundation('close');
                                        //         setTimeout(function() {
                                        //             this._radio.commands.execute('destroyModal');
                                        //         }.bind(this),
                                        //         500);

                                        //         // Get the latest vote counts for this package's headlines
                                        //         // TK.

                                        //         // Display snackbar:
                                        //         this._radio.commands.execute(
                                        //             'showSnackbar',
                                        //             new SnackbarView({
                                        //                 snackbarClass: 'success',
                                        //                 text: 'Your vote has been counted.',
                                        //                 action: {
                                        //                     promptText: 'Dismiss'
                                        //                 },
                                        //             })
                                        //         );
                                        //     },
                                        //     error: function(jqXHR, textStatus, errorThrown) {
                                        //         // Display snackbar:
                                        //         this._radio.commands.execute(
                                        //             'showSnackbar',
                                        //             new SnackbarView({
                                        //                 snackbarClass: 'failure',
                                        //                 text: 'Could not save your vote. Try again later.',
                                        //             })
                                        //         );
                                        //     },
                                        //     dataType: 'json'
                                        // });


                                        setTimeout(
                                            function() {
                                                // Log POST payload to the console.
                                                console.log(voteData);

                                                // Close this popup and destroy it.
                                                modalContext.$el.parent().foundation('close');
                                                setTimeout(function() {
                                                    this._radio.commands.execute('destroyModal');
                                                }.bind(this),
                                                500);

                                                // Get the latest vote counts for this package's headlines
                                                // TK.

                                                // Display snackbar:
                                                this._radio.commands.execute(
                                                    'showSnackbar',
                                                    new SnackbarView({
                                                        snackbarClass: 'success',
                                                        text: 'Your vote has been counted.',
                                                        action: {
                                                            promptText: 'Dismiss'
                                                        },
                                                    })
                                                );
                                            }.bind(this),
                                            5000
                                        );
                                    }.bind(this)
                                },
                                {
                                    'buttonID': 'headline-voting-cancel-button',
                                    'buttonClass': 'flat-button primary-action cancel-trigger',
                                    'innerLabel': 'Cancel',
                                    'clickCallback': function(modalContext) {
                                        modalContext.$el.parent().foundation('close');

                                        setTimeout(
                                            function() {
                                                this._radio.commands.execute('destroyModal');
                                            }.bind(this),
                                            500
                                        );
                                    }.bind(this)
                                }
                            ]
                        };

                    this.modalView = new ModalView({
                        modalConfig: headlineVotingModal,
                        renderCallback: function() {
                            this.modalView.$el.find('label').click(
                                function() {
                                    $(this).closest('.form-replacement').find('.record-vote-trigger').removeClass('disabled');
                                }
                            );
                        }.bind(this)
                    });


                    this._radio.commands.execute('showModal', this.modalView);
                }
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