import Backbone from 'backbone';
import deline from 'deline';
import jQuery from 'jquery';
import Mn from 'backbone.marionette';
import _ from 'underscore';
import _string_ from 'underscore.string';
import 'daterange-picker-ex';
import 'selectize';
import 'timedropper-ex';

import settings from '../../../common/settings';

import AdditionalContentForm from '../../itemviews/additional-content/additional-form';
import BaseStructureBindingsView from '../../itemviews/package-edit-bindings/base-structure';
import HeadlineGroupBindingsView from '../../itemviews/package-edit-bindings/headline-group';
import MainFormBindingsView from '../../itemviews/package-edit-bindings/main-form';
import ModalView from '../../itemviews/modals/modal-window';
import NotesGroupBindingsView from '../../itemviews/package-edit-bindings/notes-group';
import PubGroupBindingsView from '../../itemviews/package-edit-bindings/publishing-group';
import SnackbarView from '../../itemviews/snackbars/snackbar';
import urlConfig from '../../misc/urls';

const uiElements = {
    colorDot: '.single-page .package-header .color-dot',
    packageTitle: '.single-page .package-header h1',
        /* eslint-disable indent */
        packageForm: '#package-form',
        packageErrors: '#package-form .error-message',
        /* eslint-enable indent */
    hubDropdown: '#package-form #hub',
    typeDropdown: '#package-form #type',
    lengthGroup: '#package-form .length-group',
    lengthField: '#package-form #length',
    pitchLinkGroup: '#package-form .request-link-group',
    addRequestButton: '#package-form .request-link-group .material-button',
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
    printRunDatesGroup: '#package-form #publishing-fields #print-run-dates',
    printPublicationDropdown: '#package-form #print-publication',
    printSystemSlugField: '#package-form #print-system-slug',
    printSectionCheckboxes: '#package-form #print-sections',
    printFinalized: '#package-form #is_placement_finalized',
        /* eslint-disable indent */
        addAdditionalItemTrigger: '.single-page .add-additional-content-trigger',
        bottomButtonHolder: '.single-page .bottom-button-holder',
        persistentHolder: '.edit-bar .button-holder',
        persistentButton: '.edit-bar .button-holder .material-button',
                packageDeleteTrigger: '.edit-bar .button-holder .material-button.delete-trigger',
        packageSaveTrigger: '.edit-bar .button-holder .material-button.save-trigger',
        packageSaveAndContinueEditingTrigger: '.edit-bar .button-holder .save-and-continue-editing-trigger',
        /* eslint-enable indent */
};

export default Mn.CompositeView.extend({
    id: 'package-edit',
    template: 'budget/packages-edit',

    childView: AdditionalContentForm,
    childViewContainer: '#additional-content-children',
    childViewOptions() {
        return {
            primarySlug: this.model.generatePackageTitle(),
            staffers: this.options.data.staffers,
            stafferChoices: this.enumerateStafferChoices(),
            typeChoices: this.enumerateTypeChoices(),
        };
    },

    ui: uiElements,

    bindings() {
        const baseStructureBindings = new BaseStructureBindingsView({
            model: this.model,
            parentUI: this.ui,
            uiElements,

            extraContext: {
                childViews: this.children,
                hubList: this.options.data.hubs,
                loopChildViews: (childViewFn) => {
                    this.children.each((view) => { childViewFn(view); });
                },
            },
        });

        const mainFormBindings = new MainFormBindingsView({
            model: this.model,
            parentUI: this.ui,
            uiElements,

            extraContext: {
                hubChoices: this.hubChoices,
                stafferChoices: this.stafferChoices,
                stafferData: this.options.data.staffers,
                typeChoices: this.typeChoices,
            },
        });

        const headlineGroupBindings = new HeadlineGroupBindingsView({
            model: this.model,
            parentUI: this.ui,
            uiElements,

            extraContext: {},
        });

        const notesGroupBindings = new NotesGroupBindingsView({
            model: this.model,
            parentUI: this.ui,
            uiElements,

            extraContext: {},
        });

        const pubGroupBindings = new PubGroupBindingsView({
            model: this.model,
            parentUI: this.ui,
            uiElements,

            extraContext: {
                getActivePublication: () => this.activePublication,
                printPlacementChoices: this.printPlacementChoices,
                printPublicationSections: this.printPublicationSections,
                sectionPublicationMap: this.sectionPublicationMap,
                setActivePublication: (newPub) => { this.activePublication = newPub; },
            },
        });

        return Object.assign(
            baseStructureBindings.getBindings(),
            mainFormBindings.getBindings(),
            headlineGroupBindings.getBindings(),
            notesGroupBindings.getBindings(),
            pubGroupBindings.getBindings(),
        );
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

    initialize() {
        this.isFirstRender = true;

        this.radio = Backbone.Wreqr.radio.channel('global');

        this.collection = this.model.additionalContentCollection;

        /* Prior-path capturing. */

        this.priorViewName = this.radio.reqres.request(
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
        settings.moment.locale('en-us-apstyle');


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


        /* Set meridiem formatting for time picker. */

        jQuery.TDExLang.en.am = 'a.m.';
        jQuery.TDExLang.en.pm = 'p.m.';
    },

    // eslint-disable-next-line no-unused-vars
    filter(child, index, collection) {
        // Only show child views for items in 'this.collection' that
        // represent additional content (and not primary items).
        return (
            (!child.has('additionalForPackage')) ||
            (!_.isNull(child.get('additionalForPackage')))
        );
    },

    serializeData() {
        return {
            csrfToken: '',
            visualsRequestURL: settings.externalURLs.addVisualsRequest,
        };
    },

    onBeforeRender() {
    },

    onRender() {
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

    onAttach() {
        this.ui.collapsibleRows.each((i, el) => {
            const $el = jQuery(el);

            $el.data('expanded-height', $el.outerHeight());
            $el.addClass('collapse-enabled');
        });

        if (
                _.has(this.options, 'boundData') &&
                _.has(this.options.boundData, 'isEmpty') &&
                (this.options.boundData.isEmpty === true)
        ) {
            this.model.trigger('packageLoaded');
        }
    },

    bindForm() {
        this.stickit();
    },


    /*
     *   Choice enumerators.
     */

    enumerateHubChoices() {
        const choices = [];
        const hubGroupsRaw = [];

        this.options.data.hubs.each((hub) => {
            const hubVertical = hub.get('vertical');

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
                (obj, index) => {
                    const newObj = _.clone(obj);
                    newObj.$order = index + 1;
                    return newObj;
                }
            ),
        };
    },

    enumerateTypeChoices() {
        const choices = [];

        _.each(settings.contentTypes, (v, k) => {
            choices.push({
                name: v.verboseName,
                order: v.order,
                value: k,
            });
        });

        return _.map(
            _.sortBy(choices, 'order'),
            choice => _.omit(choice, 'order')
        );
    },

    enumerateStafferChoices() {
        const choices = [];

        this.options.data.staffers.each((staffer) => {
            choices.push({
                name: staffer.get('fullName'),
                value: staffer.get('email'),
            });
        });

        return choices;
    },

    enumeratePrintPlacementChoices() {
        const sectionPublicationValues = [];
        const publicationSections = [];
        const placementChoices = _.compact(
            this.options.data.printPublications.map(
                (publication) => {
                    if (publication.get('isActive') === true) {
                        // Generate a second map with this
                        // publications' section IDs and the
                        //  publication's slug. This gets used on the
                        // selectize 'select' event.
                        sectionPublicationValues.push(
                            _.map(
                                publication.get('sections'),
                                section => [
                                    section.id,
                                    publication.get('slug'),
                                ]
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
                .reject(mapping => _.isEmpty(mapping[1]))
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
    changePublishedDate(datePkr, nextDate) {
        /* eslint-disable no-param-reassign*/

        datePkr.lastSelectedDate = nextDate;
        datePkr.silent = true;
        datePkr.date = nextDate;
        datePkr.silent = false;

        // eslint-disable-next-line no-underscore-dangle
        datePkr.nav._render();
        datePkr.selectedDates = [nextDate];

        // eslint-disable-next-line no-underscore-dangle
        datePkr._setInputValue();

        // eslint-disable-next-line no-underscore-dangle
        datePkr.views[datePkr.currentView]._render();
        datePkr.preventDefault = false;

        /* eslint-enable no-param-reassign*/
    },

    updateBottomButtonVisibility() {
        if (this.collection.length > 1) {
            if (this.ui.bottomButtonHolder.is(':hidden')) {
                this.ui.bottomButtonHolder.show();
            }
        } else if (!this.ui.bottomButtonHolder.is(':hidden')) {
            this.ui.bottomButtonHolder.hide();
        }
    },

    addButtonClickedClass(event) {
        const thisEl = jQuery(event.currentTarget);

        thisEl.addClass('active-state');
        thisEl.removeClass('click-init');

        setTimeout(
            () => { thisEl.removeClass('hover').removeClass('active-state'); },
            1000
        );

        setTimeout(() => { thisEl.addClass('click-init'); }, 2000);
    },

    openVisualsRequestForm(event) {
        const triggerElement = jQuery(event.currentTarget);

        if (event.button === 0 && !(event.ctrlKey || event.metaKey)) {
            event.preventDefault();

            window.open(triggerElement.find('a').attr('href'), '_blank');
        }
    },

    toggleCollapsibleRow(event) {
        const toggleTarget = jQuery(event.currentTarget);
        const toggleSlug = toggleTarget.data('expand-target');
        const toggleReceiver = this.ui.collapsibleRows.filter(
            `[data-expand-receiver="${toggleSlug}"]`
        ).first();

        if (toggleReceiver.height() === 0) {
            toggleTarget.find('h4').addClass('section-expanded');

            toggleReceiver.css({
                height: toggleReceiver.data('expandedHeight'),
            });
            toggleReceiver.addClass('expanded');
        } else {
            toggleTarget.find('h4').removeClass('section-expanded');

            toggleReceiver.css({ height: 0 });
            toggleReceiver.removeClass('expanded');
        }
    },

    addNewAdditionalItem() {
        this.additionalItemCount += 1;

        this.collection.add([
            (
                !_.isUndefined(this.model.id)
            ) ? { additionalForPackage: this.model.id } : {},
        ]);
    },

    saveAllComponents(successCallback, errorCallback) {
        const savePromise = new jQuery.Deferred();
        const cachedPrintSections = _.clone(this.model.get('printSection'));

        const packageSave = this.model.save(
            undefined,
            {
                xhrFields: {
                    withCredentials: true,
                },
                deepLoad: false,
            }
        );

        packageSave.done((mdl, resp, opts) => {
            const packageID = mdl.id;
            const wasCreated = (opts.statusText.toLowerCase() === 'created');

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

            const primaryContentSave = this.model.primaryContentItem.save(
                undefined,
                {
                    xhrFields: {
                        withCredentials: true,
                    },
                }
            );

            // eslint-disable-next-line no-unused-vars
            primaryContentSave.done((model, response, options) => {
                const additionalSaveRequests = [];

                this.model.additionalContentCollection.each(
                    (item) => {
                        const additionalItemDeferred = new jQuery.Deferred();

                        item.set('additionalForPackage', packageID);

                        if (
                            (!item.isNew()) ||
                            (!_.isNull(item.get('type'))) ||
                            (!_.isEmpty(item.get('slugKey'))) ||
                            (!_.isEmpty(item.get('authors'))) ||
                            (!_.isEmpty(item.get('budgetLine')))
                        ) {
                            additionalSaveRequests.push(additionalItemDeferred);

                            const additionalItemSave = item.save(
                                undefined,
                                {
                                    xhrFields: {
                                        withCredentials: true,
                                    },
                                }
                            );

                            /* eslint-disable no-unused-vars */
                            additionalItemSave.done(
                                (modelObj, responseObj, optionsObj) => {
                                    additionalItemDeferred.resolve();
                                }
                            );
                            /* eslint-enable no-unused-vars */

                            additionalItemSave.fail(
                                (responseObj, textStatus, errorThrown) => {
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

                jQuery.when(...additionalSaveRequests).done(() => {
                    savePromise.resolve(wasCreated);
                });

                jQuery.when(...additionalSaveRequests).fail(
                    (responseObj, textStatus, errorThrown, itemType, item) => {
                        /* eslint-disable no-underscore-dangle */
                        const itemView = this.children._views[
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
                    }
                );
            });

            primaryContentSave.fail(
                (response, textStatus, errorThrown) => {
                    savePromise.reject(
                        response,
                        textStatus,
                        errorThrown,
                        'primary-item',
                        this
                    );
                }
            );
        });

        packageSave.fail((response, textStatus, errorThrown) => {
            savePromise.reject(
                response,
                textStatus,
                errorThrown,
                'package',
                this
            );
        });

        savePromise.done((wasCreated) => {
            if (_.isFunction(successCallback)) {
                successCallback(wasCreated);
            }
        });

        // eslint-disable-next-line no-unused-vars
        savePromise.fail(
            (response, textStatus, errorThrown, errorType, errorView) => {
                const packageErrorHolder = this.ui.packageErrors;
                const boundErrors = {
                    raw: _.chain(errorView.bindings())
                            .mapObject((val, key) => {
                                const newVal = _.clone(val);
                                newVal.selector = key;
                                return newVal;
                            })
                            .values()
                            .filter(binding => _.has(binding, 'observeErrors'))
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
                            .reject(binding => _.contains(
                                ['primaryContent', 'additionalContent'],
                                _string_.strLeft(binding.observeErrors, '.')
                            ))
                            .value();

                        // Bind package errors.
                        _.each(
                            boundErrors.package,
                            (errorBinding) => {
                                this.bindError(
                                    response,
                                    errorBinding,
                                    errorBinding.observeErrors,
                                    errorView
                                );
                            }
                        );

                        boundErrors.primary = _.chain(boundErrors.raw)
                            .filter((binding) => {
                                const errorBase = _string_.strLeft(
                                    binding.observeErrors,
                                    '.'
                                );

                                return errorBase === 'primaryContent';
                            })
                            .value();

                        // Bind primary-content-item errors.
                        _.each(
                            boundErrors.primary,
                            (errorBinding) => {
                                this.bindError(
                                    response,
                                    errorBinding,
                                    _string_.strRight(
                                        errorBinding.observeErrors,
                                        '.'
                                    ),
                                    errorView
                                );
                            }
                        );
                    } else {
                        boundErrors.additionals = _.chain(boundErrors.raw)
                            .filter(
                                (binding) => {
                                    const errorBase = _string_.strLeft(
                                        binding.observeErrors,
                                        '.'
                                    );
                                    return errorBase === 'additionalContent';
                                }
                            )
                            .value();

                        // Bind additional-content-item errors.
                        _.each(
                            boundErrors.additionals,
                            (errorBinding) => {
                                this.bindError(
                                    response,
                                    errorBinding,
                                    _string_.strRight(
                                        errorBinding.observeErrors,
                                        '.'
                                    ),
                                    errorView
                                );
                            }
                        );
                    }
                }

                if (_.isFunction(errorCallback)) {
                    errorCallback(response, textStatus, errorThrown, errorType);
                }
            }
        );

        return savePromise;
    },

    bindError(response, errorBinding, fieldKey, errorView) {
        const assignedErrorClass = (
            _.has(errorBinding, 'getErrorClass')
        ) ? (
            errorBinding.getErrorClass(
                errorView.$el.find(errorBinding.selector)
            )
        ) : (
            errorView.$el.find(errorBinding.selector)
                .closest('.form-group')
        );
        const errorTextHolder = (
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
                    (message) => {
                        const errorTranslation = (
                            _.has(errorBinding.errorTranslations, message)
                        ) ? (
                            errorBinding.errorTranslations[message]
                        ) : (
                            message
                        );
                        return errorTranslation;
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

    savePackage() {
        const saveProgressModal = {
            modalTitle: '',
            innerID: 'package-save-progress-modal',
            contentClassName: 'package-modal',
            extraHTML: '',
            escapeButtonCloses: false,
            overlayClosesOnClick: false,
            buttons: [],
        };

        this.modalView = new ModalView({ modalConfig: saveProgressModal });

        setTimeout(
            () => {
                this.radio.commands.execute('showModal', this.modalView);

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

                setTimeout(() => {
                    this.modalView.$el.find('.loading-animation').addClass('active');
                }, 270);
            },
            200
        );

        const allComponentsSave = this.saveAllComponents();

        allComponentsSave.done((wasCreated) => {
            setTimeout(() => {
                this.saveSuccessCallback('saveOnly', wasCreated);

                // this.saveErrorCallback('saveOnly', 'processingError', [requestParams[0]]);
            }, 1500);
        });

        allComponentsSave.fail((response, textStatus, errorThrown) => {
            this.saveErrorCallback(
                'saveOnly',
                'hardError',
                [
                    response,
                    textStatus,
                    errorThrown,
                ]
            );
        });
    },

    savePackageAndContinueEditing() {
        const saveProgressModal = {
            modalTitle: 'Are you sure?',
            innerID: 'package-save-progress-modal',
            contentClassName: 'package-modal',
            extraHTML: '',
            escapeButtonCloses: false,
            overlayClosesOnClick: false,
            buttons: [],
        };

        this.modalView = new ModalView({ modalConfig: saveProgressModal });

        setTimeout(
            () => {
                this.radio.commands.execute('showModal', this.modalView);

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

                setTimeout(() => {
                    this.modalView.$el.find('.loading-animation').addClass('active');
                }, 270);
            },
            200
        );

        const allComponentsSave = this.saveAllComponents();

        allComponentsSave.done((wasCreated) => {
            setTimeout(() => {
                this.saveSuccessCallback('saveAndContinue', wasCreated);
            }, 1500);
        });

        allComponentsSave.fail((response, textStatus, errorThrown, errorType) => {
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
        });
    },

    deleteEntirePackage() {
        const deleteConfirmationModal = {
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
                    clickCallback: (modalContext) => {
                        const $el = modalContext.$el;

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

                        setTimeout(() => {
                            $el.find('.loading-animation').addClass('active');
                        }, 600);

                        setTimeout(() => {
                            $el.find('.modal-inner').css(
                                { visibility: 'hidden' }
                            );
                        }, 450);

                        setTimeout(() => {
                            $el.parent().addClass('waiting').addClass('delete-waiting')
                                        .removeClass('waiting-transition')
                                        .removeClass('delete-waiting-transition');
                        }, 500);

                        const deleteRequest = this.model.destroy({
                            xhrFields: {
                                withCredentials: true,
                            },
                        });

                        deleteRequest.done((mdl, resp) => {
                            setTimeout(() => {
                                this.deleteSuccessCallback(resp);
                            }, 1500);
                        });

                        // eslint-disable-next-line no-unused-vars
                        deleteRequest.fail(
                            (response, textStatus, errorThrown) => {
                                this.deleteErrorCallback(
                                    'hardError',
                                    [response, textStatus, errorThrown]
                                );
                            }
                        );
                    },
                },
                {
                    buttonID: 'delete-package-cancel-button',
                    buttonClass: 'flat-button primary-action cancel-trigger',
                    innerLabel: 'Cancel',
                    clickCallback: () => {
                        this.radio.commands.execute('destroyModal');
                    },
                },
            ],
        };

        const dbPrimarySlug = this.model.primaryContentItem.get('slug');
        const currentPrimarySlug = this.ui.packageTitle.text();
        const itemSlugEndings = this.model.additionalContentCollection.map(
            additionalItem => _.last(
                additionalItem.get('slug').split(`${dbPrimarySlug}.`)
            )
        );

        itemSlugEndings.unshift('');

        const itemsToDelete = deline`
            <ul class="to-be-deleted-list">${
                _.chain(
                    _.map(itemSlugEndings, (slugEnding) => {
                        const slugSuffix = (
                            slugEnding !== ''
                        ) ? `.${slugEnding}` : '';
                        return currentPrimarySlug + slugSuffix;
                    })
                ).map(additionalSlug => deline`
                    <li class="to-be-deleted-item">${additionalSlug}</li>`
                ).reduce((memo, num) => memo + num, '')
                .value()
            }</ul>`;

        deleteConfirmationModal.extraHTML = deline`
            <p class="delete-confirmation-text">You are about to delete
            the following budgeted content:</p>

            ${itemsToDelete}

            <p class="delete-confirmation-text">Items can&rsquo;t be
            recovered once they&rsquo;ve been deleted.</p>

            <p class="delete-confirmation-text">If you&rsquo;re sure you
            want to delete this item, click the
            <span class="button-text-inline">delete</span>
            button below.</p>`;

        this.modalView = new ModalView({ modalConfig: deleteConfirmationModal });

        setTimeout(
            () => { this.radio.commands.execute('showModal', this.modalView); },
            200
        );
    },


    /*
     *   Form error callbacks.
     */

    raiseFormErrors() {
        // Add a 'Please fix the errors below.' message to the top of the
        // edit form.
        this.ui.packageErrors.text('Please fix the errors below.');
        this.ui.packageErrors.show();

        // Loop through each required field, adding help text and the
        // 'has-error' class to any one that has no value.
        _.each(
            this.ui.packageForm.find("[data-form][isRequired='true']"),
            (field) => {
                const fieldEl = jQuery(field);
                const formGroup = fieldEl.closest('.form-group');

                if (_.isEmpty(field.value)) {
                    formGroup.addClass('has-error');
                    formGroup.find('.form-help').text('This value is required.');

                    fieldEl.on('change changeData', () => {
                        const thisEl = jQuery(this);
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

    deleteSuccessCallback(response) {  // eslint-disable-line no-unused-vars
        // Close this popup and destroy it.
        setTimeout(
            () => { this.radio.commands.execute('destroyModal'); },
            500
        );

        // Navigate to the index view
        this.radio.commands.execute('navigate', this.priorPath, { trigger: true });

        // Display snackbar:
        this.radio.commands.execute(
            'showSnackbar',
            new SnackbarView({
                snackbarClass: 'success',
                text: 'Item has been successfully deleted.',
                action: { promptText: 'Dismiss' },
            })
        );
    },

    deleteErrorCallback() {
        // Close this popup and destroy it:
        setTimeout(
            () => { this.radio.commands.execute('destroyModal'); },
            500
        );

        // Display snackbar:
        this.radio.commands.execute(
            'showSnackbar',
            new SnackbarView({
                containerClass: 'edit-page',
                snackbarClass: 'failure',
                text: 'Item could not be deleted. Try again later.',
            })
        );
    },

    saveSuccessCallback(mode) {
        // Configure success-message snackbar.
        const successSnackbarOpts = {
            snackbarClass: 'success',
            text: 'Item successfully saved.',
            action: { promptText: 'Dismiss' },
        };

        // Close this popup and destroy it.
        setTimeout(
            () => { this.radio.commands.execute('destroyModal'); },
            500
        );

        // Navigate to the index view (or to the same page if save and continue)
        if (mode === 'saveOnly') {
            this.radio.commands.execute('navigate', this.priorPath, { trigger: true });
        } else if (mode === 'saveAndContinue') {
            this.radio.commands.execute(
                'navigate',
                `edit/${this.model.id}/`,
                { trigger: true }
            );

            successSnackbarOpts.containerClass = 'edit-page';
        }

        // Display snackbar:
        this.radio.commands.execute(
            'showSnackbar',
            new SnackbarView(successSnackbarOpts)
        );
    },

    saveErrorCallback() {
        // Close this popup and destroy it.
        setTimeout(
            () => { this.radio.commands.execute('destroyModal'); },
            500
        );

        // Display snackbar:
        this.radio.commands.execute(
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

    serializeForm() {},  // End serializeForm.
});
