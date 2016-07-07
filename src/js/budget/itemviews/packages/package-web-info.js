define(
    [
        'dateRangePicker',
        'jquery',
        'moment',
        'moment-timezone',
        'underscore',
        'underscore.string',
        'common/settings',
        'common/tpl',
        'budget/itemviews/modals/modal-window.js',
        'budget/itemviews/packages/package-base',
    ],
    function(
        dateRangePicker,
        $,
        moment,
        mmtz,
        _,
        _string_,
        settings,
        tpl,
        ModalView,
        PackageItemView
    ) {
        'use strict';

        return PackageItemView.extend({
            template: tpl('package-item-web'),

            ui: {
                packageSheetOuter: '.package-sheet',
                slugBar: '.package-sheet .minimal-card .slug-bar',
                contentsBar: '.package-sheet .minimal-card .contents-bar',
                rippleButton: '.package-sheet .button',
                editPackageTrigger: '.package-sheet .edit-package',
                notesModalTrigger: '.package-sheet .view-notes',
                subscriptionModalTrigger: '.package-sheet .subscribe',
                expansionTrigger: '.package-sheet .expand-package',
                printInfoModalTrigger: '.package-sheet .print-info',
                webInfoModalTrigger: '.package-sheet .web-info',
            },

            events: {
                'click @ui.slugBar': 'expandOnMobile',
                'click @ui.contentsBar': 'expandOnMobile',
                'mousedown @ui.rippleButton': 'addButtonClickedClass',
                'click @ui.editPackageTrigger': 'showPackageEdit',
                'click @ui.notesModalTrigger': 'showNotesModal',
                'click @ui.subscriptionModalTrigger': 'showSubscriptionModal',
                'click @ui.expansionTrigger': 'expandPackageSheet',
                'click @ui.printInfoModalTrigger': 'showPrintInfoModal',
                'click @ui.webInfoModalTrigger': 'showWebInfoModal',
            },

            hasPrimary: false,

            initEnd: function() {
                this.primaryIsExpanded = false;

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
                    week: {dow: 1},
                });
            },

            serializeData: function() {
                var templateContext = {},
                    packageObj = this.model.toJSON(),
                    packageHub = this.options.hubConfigs.findWhere({
                        slug: packageObj.hub,
                    }),
                    additionals = this.model.additionalContentCollection;

                // Template context, in order of appearance:

                // Has-primary item (used to show or hide packages).
                templateContext.hasPrimary = this.hasPrimary;

                // Expanded (or not) package state.
                templateContext.primaryIsExpanded = this.primaryIsExpanded;

                // Underlying model.
                templateContext.packageObj = _.clone(packageObj);

                templateContext.packageObj.primaryContent = _.clone(
                    this.model.primaryContentItem.toJSON()
                );

                // Hub color and vertical slug.
                if (!_.isUndefined(packageHub)) {
                    templateContext.hubDotColor = packageHub.get('color');
                    templateContext.verticalSlug = packageHub.get('vertical').slug;
                }

                // Formatted run date.
                templateContext.publishDate = this.model.generateFormattedPublishDate().join(' ');

                // Editor and author lists.
                templateContext.allPeople = _.union(
                    _.pluck(this.model.primaryContentItem.get('editors'), 'email'),
                    _.pluck(this.model.primaryContentItem.get('authors'), 'email'),
                    _.pluck(_.flatten(additionals.pluck('editors')), 'email'),
                    _.pluck(_.flatten(additionals.pluck('authors')), 'email')
                ).join(' ');

                // Leading headline (if voting is open),
                // or winning headline if one was selected.
                if (packageObj.headlineCandidates.length > 0) {
                    templateContext.leadingHeadline = _.chain(
                        packageObj.headlineCandidates
                    )
                        .sortBy('votes')
                        .last()
                        .value()
                        .text;
                }

                // Verbose name and other information for primary content type icon.
                templateContext.primaryTypeMeta = settings.contentTypes[
                    this.model.primaryContentItem.get('type')
                ];

                // Fallback function for comma-formatted length (1 of 2).
                // if (_.has(packageObj.primaryContentItem, 'length')) {
                //     templateContext.primaryLengthFormatted = _string_.numberFormat(
                //         packageObj.primaryContentItem.get('length')
                //     );
                // }

                // List of additional content item types and icons
                // (Needed for "Includes [other icons]" list).
                templateContext.additionalItemTypes = _.map(
                    additionals.pluck('type'),
                    function(typeSlug) {
                        var typeObj = _.clone(settings.contentTypes[typeSlug]);
                        typeObj.slug = typeSlug;
                        return typeObj;
                    }
                );

                // List of additional content items, in an object with
                // on-model ('model') and 'typemeta' attributes.
                templateContext.additionalWithTypeMetas = additionals.map(function(item) {
                    var additionalConfig = {
                        model: item.toJSON(),
                        typeMeta: settings.contentTypes[item.get('type')],
                    };

                    return additionalConfig;
                });

                return templateContext;
            },

            onRenderCallback: function() {
                this.ui.rippleButton.addClass('click-init');
            },


            /*
             *   Event handlers.
             */

            expandOnMobile: function(e) {  // eslint-disable-line no-unused-vars
                if ($(window).width() < settings.buttonHideWidth) {
                    this.expandPackageSheet();
                }
            },

            showPackageEdit: function(event) {
                var triggerElement = $(event.currentTarget);

                if (event.button === 0 && !(event.ctrlKey || event.metaKey)) {
                    event.preventDefault();

                    this._radio.commands.execute(
                        'navigate',
                        triggerElement.find('a').attr('href'),
                        {trigger: true}
                    );
                }
            },

            expandPackageSheet: function(e) {  // eslint-disable-line no-unused-vars
                if (this.primaryIsExpanded) {
                    // Strike the 'is-expanded' class, then remove the
                    // 'overflow-visible' class at the end of the
                    // 'is-expanded' animation.
                    this.ui.packageSheetOuter.removeClass('is-expanded');

                    this.ui.packageSheetOuter
                                .find('.primary-description')
                                .removeClass('overflow-visible');

                    this.primaryIsExpanded = false;
                } else {
                    // Add the 'is-expanded' class, then add the
                    // 'overflow-visible' class at the end of the
                    // 'is-expanded' animation.
                    this.ui.packageSheetOuter.addClass('is-expanded');

                    setTimeout(
                        function() {
                            this.ui.packageSheetOuter
                                        .find('.primary-description')
                                        .addClass('overflow-visible');
                        }.bind(this),
                        1500
                    );

                    this.primaryIsExpanded = true;
                }
            },

            showNotesModal: function(e) {  // eslint-disable-line no-unused-vars
                var notesModal = {
                    modalTitle: 'Production notes',
                    innerID: 'production-notes-modal',
                    contentClassName: 'package-modal',
                    extraHTML: '<div class="mode-toggle">' +
                                 '    <div trigger-mode="read-only">Read</div>' +
                                 '    <div trigger-mode="edit">Edit</div>' +
                                 '</div>' +
                                 '<div class="modes">' +
                                 '    <div class="read-only">' +
                                            this.model.get('notes') +
                                    '</div>' +
                                 '    <div class="edit"><textarea>' +
                                            this.model.get('notes') +
                                    '</textarea></div>' +
                                 '</div>',
                    buttons: [
                        {
                            buttonID: 'package-notes-save-button',
                            buttonClass: 'flat-button primary-action ' +
                                            'save-trigger expand-past-button',
                            innerLabel: 'Save',
                            clickCallback: function(modalContext) {},  // eslint-disable-line no-unused-vars,max-len
                        },
                        {
                            buttonID: 'package-notes-close-button',
                            buttonClass: 'flat-button primary-action close-trigger',
                            innerLabel: 'Close',
                            clickCallback: function(modalContext) {  // eslint-disable-line no-unused-vars,max-len
                                this._radio.commands.execute('destroyModal');
                            }.bind(this),
                        },
                    ],
                };

                this.modalView = new ModalView({
                    modalConfig: notesModal,
                });

                this._radio.commands.execute('showModal', this.modalView);
            },

            showSubscriptionModal: function(e) {  // eslint-disable-line no-unused-vars
                var subscriptionModal = {
                    modalTitle: 'Coming soon',
                    innerID: 'subscription-modal',
                    contentClassName: 'package-modal',
                    extraHTML: '' +
                        '<p>Soon you will be able to follow budgeted content on Slack. ' +
                                'We&rsquo;ll keep track of everything you follow, and let you ' +
                                'know any time it&rsquo;s updated.</p>' +
                        '<p>Check back shortly as we finish implementing this feature.</p>',
                    buttons: [
                        {
                            buttonID: 'package-notes-close-button',
                            buttonClass: 'flat-button primary-action close-trigger',
                            innerLabel: 'Close',
                            clickCallback: function(modalContext) {  // eslint-disable-line no-unused-vars,max-len
                                this._radio.commands.execute('destroyModal');
                            }.bind(this),
                        },
                    ],
                };

                this.modalView = new ModalView({
                    modalConfig: subscriptionModal,
                });

                this._radio.commands.execute('showModal', this.modalView);
            },
        });
    }
);
