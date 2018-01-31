import Backbone from 'backbone';
import jQuery from 'jquery';
import Mn from 'backbone.marionette';
import _ from 'underscore';
import _string_ from 'underscore.string';
import 'daterange-picker-ex';
import 'selectize';
import 'timedropper-ex';

import deline from '../../../vendored/deline';

import AdditionalContentForm from '../../itemviews/additional-content/additional-form';
import BaseStructureBindingsView from '../../itemviews/package-edit-bindings/base-structure';
import ContentPlacement from '../../models/content-placement';
import ContentPlacementCollection from '../../collections/content-placements';
import ContentPlacementForm from '../../itemviews/modals/content-placement-form';
import formatDateRange from '../../../common/date-range-formatter';
import HeadlineGroupBindingsView from '../../itemviews/package-edit-bindings/headline-group';
import MainFormBindingsView from '../../itemviews/package-edit-bindings/main-form';
import ModalView from '../../itemviews/modals/modal-window';
import NotesGroupBindingsView from '../../itemviews/package-edit-bindings/notes-group';
import PublishingGroupBindingsView from '../../itemviews/package-edit-bindings/publishing-group';
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
  notesField: '#package-form #notes-quill',
  urlField: '#package-form #url',
        /* eslint-disable indent */
        addAdditionalItemTrigger: '.single-page .add-additional-content-trigger',
        bottomButtonHolder: '.single-page .bottom-button-holder',
        persistentHolder: '.edit-bar .button-holder',
        persistentButton: '.edit-bar .button-holder .material-button',
                packageDeleteTrigger: '.edit-bar .button-holder .material-button.delete-trigger',
        packageSaveTrigger: '.edit-bar .button-holder .material-button.save-trigger',
        packageSaveAndContinueEditingTrigger: '.edit-bar .button-holder .save-and-continue-editing-trigger',
        /* eslint-enable indent */
  contentPlacements: '#content-placements-table',
  contentPlacementsPlaceholder: '#content-placements-loading',
  contentPlacementsAddTrigger: '#content-placements-table .create-placement',
  contentPlacementsTableGroup: '#content-placements-table .table-holder',
  contentPlacementsTable: '#content-placements-table table',
  contentPlacementsTableBody: '#content-placements-table table tbody',
  contentPlacementsTableRows: '#content-placements-table table tbody tr',
  contentPlacementsPgStart: '#content-placements-table .table-pagination .range-start',
  contentPlacementsPgEnd: '#content-placements-table .table-pagination .range-end',
  contentPlacementsPgTotal: '#content-placements-table .table-pagination .total-records',
  contentPlacementsDeleteTriggers: '#content-placements-table table tbody .delete-trigger .material-button',
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
    const showHeadlines = this.radio.reqres.request('getSetting', 'showHeadlines');

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

    let headlineGroupBindings;
    if (showHeadlines === true) {
      headlineGroupBindings = new HeadlineGroupBindingsView({
        model: this.model,
        parentUI: this.ui,
        uiElements,

        extraContext: {},
      });
    }

    const notesGroupBindings = new NotesGroupBindingsView({
      model: this.model,
      parentUI: this.ui,
      uiElements,

      extraContext: {},
    });

    const publishingGroupBindings = new PublishingGroupBindingsView({
      model: this.model,
      parentUI: this.ui,
      uiElements,

      extraContext: {},
    });

    if (showHeadlines === true) {
      return Object.assign(
        baseStructureBindings.getBindings(),
        mainFormBindings.getBindings(),
        headlineGroupBindings.getBindings(),
        notesGroupBindings.getBindings(),
        publishingGroupBindings.getBindings(),
      );
    }

    return Object.assign(
      baseStructureBindings.getBindings(),
      mainFormBindings.getBindings(),
      notesGroupBindings.getBindings(),
      publishingGroupBindings.getBindings(),
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
    'mousedown @ui.contentPlacementsAddTrigger': 'addButtonClickedClass',
    'click @ui.contentPlacementsAddTrigger': 'createContentPlacement',
    'mousedown @ui.contentPlacementsDeleteTriggers': 'addButtonClickedClass',
  },

  modelEvents: {
    packageLoaded: 'bindForm',
  },

  childEvents: {
    destroy: 'removeAdditionalItem',
  },

  appendAdditionalItem(model) {
    const initialList = this.model.get('additionalContent');
    const idToAdd = model.id;

    const additionalIDs = new Set(initialList);
    additionalIDs.add(idToAdd);
    const finalList = Array.from(additionalIDs);

    this.model.set('additionalContent', finalList);
  },

  removeAdditionalItem(additionalView) {
    const initialList = this.model.get('additionalContent');
    const idToRemove = additionalView.model.id;

    const additionalIDs = new Set(initialList);
    additionalIDs.delete(idToRemove);
    const finalList = Array.from(additionalIDs);

    this.model.set('additionalContent', finalList);
  },

  initialize() {
    this.isFirstRender = true;

    this.radio = Backbone.Wreqr.radio.channel('global');

    this.collection = this.model.additionalContentCollection;

    /* Prior-path capturing. */

    this.priorViewName = this.radio.reqres.request('getState', 'meta', 'listViewType');

    this.priorPath = urlConfig.listPage.reversePattern;
    if (
        !_.isUndefined(this.priorViewName) &&
        _.has(urlConfig, this.priorViewName)
    ) {
      this.priorPath = urlConfig[this.priorViewName].reversePattern;
    }


    /* Moment.js configuration. */
    const moment = this.radio.reqres.request('getSetting', 'moment');
    moment.locale('en-us-apstyle');
    this.moment = moment;


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

  filter(child) {  // args: child, index, collection
    // Only show child views for items in 'this.collection' that
    // represent additional content (and not primary items).
    return (
      (!child.has('additionalForPackage')) ||
      (!_.isNull(child.get('additionalForPackage')))
    );
  },

  serializeData() {
    //  TODO: Reflect this setting in the new-type placement edit form.
    const context = {
      // hasPrintSystemSlug: false,
      showHeadlines: this.radio.reqres.request('getSetting', 'showHeadlines'),
    };

    // const printSlugName = this.radio.reqres.request('getSetting', 'printSlugName');
    // if (printSlugName !== null) {
    //   context.hasPrintSystemSlug = true;
    //   context.printSlugName = printSlugName;
    // }

    const externalURLs = this.radio.reqres.request('getSetting', 'externalURLs');

    if (_.has(externalURLs, 'addVisualsRequest')) {
      context.visualsRequestURL = externalURLs.addVisualsRequest;
    }

    return context;
  },

  onBeforeRender() {
  },

  onRender() {
    if (this.isFirstRender) {
      this.isFirstRender = false;

      this.collection.on('update', this.updateBottomButtonVisibility.bind(this));
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

    this.initContentPlacements();
  },

  initContentPlacements() {
    this.contentPlacementAddMode = 'after-initial-save';

    if (!_.isUndefined(this.model.id)) {
      this.contentPlacementAddMode = 'immediate-async';
      this.loadContentPlacements({
        success: this.contentPlacementLoadSuccess.bind(this),
        error: this.contentPlacementLoadError.bind(this),
      });
    } else {
      this.showContentPlacementsTable();
    }
  },

  loadContentPlacements(config) {
    this.contentPlacements = new ContentPlacementCollection();
    this.contentPlacements.fetch(Object.assign({}, config, {
      data: { package: this.model.id },
      xhrFields: { withCredentials: true },
    }));
  },

  contentPlacementLoadSuccess(collection) {
    this.ui.contentPlacementsTableBody.empty();

    collection.forEach((placementObj) => {
      const placementRow = jQuery(this.formatPlacementRow(placementObj));
      placementRow.appendTo(this.ui.contentPlacementsTableBody);

      placementRow.find('td').hover((event) => {
        if (
          (!event.currentTarget.classList.contains('delete-trigger')) &&
          (!placementRow.hasClass('being-deleted'))
        ) {
          placementRow.addClass('hovering');
        }
      }, (event) => {
        if (!event.currentTarget.classList.contains('delete-trigger')) {
          placementRow.removeClass('hovering');
        }
      });

      const handleClick = event => this.handlePlacementClick(event, placementObj);

      placementRow.on('click', handleClick);
    });

    if (collection.length > 0) {
      this.ui.contentPlacementsPgStart.text('1');
      this.ui.contentPlacementsPgEnd.text(collection.length);
      this.ui.contentPlacementsPgTotal.text(collection.length);
    }

    this.showContentPlacementsTable();
  },

  handlePlacementClick(event, placement) {
    // Dispatch differently depending on whether delete trigger or rest of body
    // was clicked.
    const target = event.currentTarget;
    const $targetEl = jQuery(target);

    if (!$targetEl.hasClass('being-deleted')) {
      if (event.target === $targetEl.find('.delete-action')[0]) {
        this.deleteContentPlacement(target, placement, true, event);
      } else if (event.target === $targetEl.find('.delete-trigger')[0]) {
        // Pass.
      } else {
        this.editContentPlacement(event);
      }
    }
  },

  editContentPlacement(event) {
    const placementToEdit = this.contentPlacements.findWhere({
      id: parseInt(event.currentTarget.id.replace('content-placement_', ''), 10),
    });

    this.showContentPlacementForm(placementToEdit);
  },

  createContentPlacement() {
    const newPlacement = new ContentPlacement({
      package: this.model.id,
      runDate: [
        this.moment().add(1, 'days').format('YYYY-MM-DD'),
        this.moment().add(2, 'days').format('YYYY-MM-DD'),
      ],
    });

    this.showContentPlacementForm(newPlacement);
  },

  showContentPlacementForm(model) {
    const clonedFields = [
      'destination',
      'externalSlug',
      'placementDetails',
      'isFinalized',
    ];

    const initialValues = _.chain(model.attributes).clone().pick(clonedFields).value();
    initialValues.runDate = _.clone(model.get('runDate'));
    initialValues.placementTypes = _.clone(model.get('placementTypes'));

    const contentPlacementForm = new ContentPlacementForm({
      model,
      // extraContext: this,
      extraContext: {
        destinationModels: this.options.data.printPublications,
        destinations: this.printPlacementChoices,
        destinationPlacements: this.printPublicationSections,
      },
      callbacks: {
        delete: () => {
          this.radio.commands.execute('destroyModal');
          const targetsTable = this.ui.contentPlacementsTableBody;
          const targetEl = jQuery(targetsTable).find(`#content-placement_${
            model.id
          }`);

          setTimeout(() => { targetEl.addClass('being-deleted'); }, 300);

          setTimeout(() => {
            this.proceedWithPlacementDelete(targetEl, model);
          }, 1400);
        },
        save: () => {
          if (this.contentPlacementAddMode === 'immediate-async') {
            setTimeout(() => {
              model.save({}, {
                xhrFields: {
                  withCredentials: true,
                },
                success: () => {
                  if (!this.contentPlacements.contains(model)) {
                    this.contentPlacements.add(model);
                  }

                  this.contentPlacementLoadSuccess(this.contentPlacements);

                  this.radio.commands.execute('destroyModal');

                  this.radio.commands.execute('showSnackbar', new SnackbarView({
                    containerClass: 'edit-page',
                    snackbarClass: 'success',
                    text: 'Successfully saved content placement.',
                    action: { promptText: 'Dismiss' },
                  }));
                },
                error: () => {
                  /* eslint-disable no-console */
                  if (!_.isUndefined(model.id)) {
                    console.warn(`Error: Could not save content placement with ID ${
                      model.id
                    }`);
                  } else {
                    console.warn('Error: Could not create new content placement.');
                  }
                  /* eslint-enable no-console */

                  this.radio.commands.execute('destroyModal');

                  this.radio.commands.execute('showSnackbar', new SnackbarView({
                    containerClass: 'edit-page',
                    snackbarClass: 'failure',
                    text: 'Couldn\'t save content placement. Please try again.',
                    action: { promptText: 'Dismiss' },
                  }));
                },
              });
            }, 1500);
          } else {
            // TODO: Handle add (and also delete) placement when done before
            // parent Package is saved for the first time.
            // eslint-disable-next-line no-console
            console.log(this.contentPlacementAddMode);
            this.radio.commands.execute('destroyModal');
          }
        },
        close: () => {
          this.radio.commands.execute('destroyModal');
          if (!_.isUndefined(model.id)) {
            model.set(initialValues);
          }
        },
      },
    });

    contentPlacementForm.extendConfig({
      formConfig: { rows: contentPlacementForm.getFormRows() },
    });

    this.modalView = new ModalView({ model, view: contentPlacementForm });

    this.radio.commands.execute('showModal', this.modalView);
  },

  contentPlacementLoadError() {
    // eslint-disable-next-line no-console
    console.warn('ERROR: Could not load content placements.');
    this.showContentPlacementsTable();
  },

  deleteContentPlacement(target, placement, needsModal) {
    const $targetEl = jQuery(target);
    const $targetRow = $targetEl.closest('tr');

    $targetRow.addClass('being-deleted');

    if (needsModal) {  // Prompt to delete with a modal.
      const confirmationModal = {
        modalTitle: 'Are you sure?',
        innerID: 'placement-delete-confirmation-modal',
        contentClassName: 'package-modal deletion-modal',
        escapeButtonCloses: false,
        overlayClosesOnClick: false,
        buttons: [
          {
            buttonID: 'delete-package-delete-button',
            buttonClass: 'flat-button delete-action delete-trigger',
            innerLabel: 'Delete',
            clickCallback: () => {
              this.radio.commands.execute('destroyModal');

              setTimeout(() => {
                this.proceedWithPlacementDelete(target, placement);
              }, 700);
            },
          },
          {
            buttonID: 'delete-package-cancel-button',
            buttonClass: 'flat-button primary-action cancel-trigger',
            innerLabel: 'Cancel',
            clickCallback: () => {
              target.classList.remove('being-deleted');
              this.radio.commands.execute('destroyModal');
            },
          },
        ],
      };

      const destinations = this.options.data.printPublications;

      const placementDestinationName = destinations.findWhere({
        id: placement.get('destination'),
      }).get('name');

      confirmationModal.extraHTML = '' +
          '<p class="delete-confirmation-text">' +
            `Do you want to remove this placement in <strong>${
              placementDestinationName
            }</strong>?` +
          '</p>';

      this.modalView = new ModalView({ modalConfig: confirmationModal });

      setTimeout(() => {
        this.radio.commands.execute('showModal', this.modalView);
      }, 700);
    } else {
      this.proceedWithPlacementDelete(target, placement);
    }
  },

  proceedWithPlacementDelete(target, placement) {
    placement.destroy({
      xhrFields: {
        withCredentials: true,
      },
      success: () => {
        target.remove();

        this.radio.commands.execute('showSnackbar', new SnackbarView({
          containerClass: 'edit-page',
          snackbarClass: 'success',
          text: 'Successfully deleted content placement.',
          action: { promptText: 'Dismiss' },
        }));
      },
      error: (model, response) => {
        /* eslint-disable no-console */
        console.warn(`Could not remove placement with ID '${model.id}'.`);
        console.warn('Response was:');
        console.warn(response);
        /* eslint-enable no-console */
        target.classList.remove('being-deleted');
      },
    });
  },

  formatPlacementRow(placementObj) {
    const runDate = placementObj.get('runDate');

    const startDate = this.moment(runDate[0]);
    const endDate = this.moment(runDate[1]).subtract(1, 'day');

    const dateRangeFormatted = formatDateRange(startDate, endDate);

    const rowPublicationDestination = this.options.data.printPublications.findWhere({
      id: placementObj.get('destination'),
    });

    const destinationSections = rowPublicationDestination
                                    .get('sections')
                                    .map(section => section.slug);

    const filteredSections = placementObj
                                .get('placementTypes')
                                .filter(plc => destinationSections.includes(plc));

    const matches = rowPublicationDestination
                        .get('sections')
                        .filter(sectionObj => filteredSections.includes(sectionObj.slug));

    const richFilteredSections = _.sortBy(matches, 'priority');

    const formattedValues = {
      destination: rowPublicationDestination.get('name'),
      runDate: dateRangeFormatted,
      externalSlug: placementObj.get('externalSlug'),
      placementTypeClass: (_.isEmpty(richFilteredSections)) ? 'empty-val' : '',
      placementTypes: (
        _.isEmpty(richFilteredSections)
      ) ? (
        '(None)'
      ) : (
        richFilteredSections
          .map(section => section.name)
          .reduce((memo, val) => `${memo}, ${val}`)
      ),
      // isFinalizedClass: placementObj.get('isFinalized').toString(),
      // isFinalizedIcon: (
      //   placementObj.get('isFinalized')
      // ) ? (
      //   'done'
      // ) : (
      //   'not_interested'
      // ),
    };

    const hasPageNumber = (
      (placementObj.get('pageNumber') !== null) &&
      (placementObj.get('pageNumber') !== undefined)
    );

    const hasPlacementDetails = (
      (placementObj.get('placementDetails') !== null) &&
      (placementObj.get('placementDetails') !== undefined) &&
      (placementObj.get('placementDetails').length > 0)
    );

    formattedValues.pageAndDetails = `${
      (hasPageNumber === true) ? placementObj.get('pageNumber') : 'TK'
    } / ${
      (hasPlacementDetails === true) ? placementObj.get('placementDetails') : 'TK'
    }`;

    const placementHTML = deline`<tr id="content-placement_${placementObj.id}" class="">
        <td class="destination">
            <div class="background-shim"><div class="delete-expansion"></div><div class="deleting-message">Removing this placement...</div></div>
            <span>${formattedValues.destination}</span>
        </td>
        <td class="run-date">
            <span>${formattedValues.runDate}</span>
        </td>
        <td class="external-slug">
            <span>${formattedValues.externalSlug}</span>
        </td>
        <td class="placement-types ${formattedValues.placementTypeClass}">
            <span>${formattedValues.placementTypes}</span>
        </td>
        <td class="page-and-details">
            <span>${formattedValues.pageAndDetails}</span>
        </td>
        <td class="delete-trigger">
            <div class="material-button flat-button delete-action click-init"><i class="material-icons">delete</i></div>
        </td>
    </tr>`;

    return placementHTML;
  },

  showContentPlacementsTable() {
    this.ui.contentPlacementsPlaceholder.hide();
    this.ui.contentPlacementsTableGroup.show();
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
      optgroups: _.map(_.sortBy(hubGroupsRaw, 'value'), (obj, index) => {
        const newObj = _.clone(obj);
        newObj.$order = index + 1;
        return newObj;
      }),
    };
  },

  enumerateTypeChoices() {
    const choices = [];

    _.each(this.radio.reqres.request('getSetting', 'contentTypes'), (v, k) => {
      choices.push({
        name: v.verboseName,
        order: v.order,
        value: k,
      });
    });

    return _.map(_.sortBy(choices, 'order'), choice => _.omit(choice, 'order'));
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
    const destinations = this.options.data.printPublications;
    const placementChoices = _.compact(destinations.map((publication) => {
      if (publication.get('isActive') === true) {
        // Generate a second map with this
        // publications' section IDs and the
        // publication's slug. This gets used on the
        // selectize 'select' event.
        sectionPublicationValues.push(_.map(publication.get('sections'), section => [
          section.id,
          publication.get('slug'),
        ]));

        publicationSections.push([
          publication.get('slug'),
          publication.get('sections'),
        ]);

        return {
          name: publication.get('name'),
          value: publication.get('slug'),
        };
      }

      return null;
    }));

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
    /* eslint-disable no-param-reassign */
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
    /* eslint-enable no-param-reassign */
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

    setTimeout(() => {
      thisEl.removeClass('hover').removeClass('active-state');
    }, 1000);

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
    const toggleReceiver = this.ui.collapsibleRows.filter(`[data-expand-receiver="${
      toggleSlug
    }"]`).first();

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

    const packageSave = this.model.save(undefined, {
      xhrFields: {
        withCredentials: true,
      },
      deepLoad: false,
    });

    packageSave.done((mdl, resp, opts) => {
      const packageID = mdl.id;
      const wasCreated = (opts.statusText.toLowerCase() === 'created');

      this.model.primaryContentItem.set('primaryForPackage', packageID);

      const primaryContentSave = this.model.primaryContentItem.save(undefined, {
        xhrFields: {
          withCredentials: true,
        },
      });

      primaryContentSave.done(() => {  // args: model, response, options
        const additionalSaveRequests = [];

        this.model.additionalContentCollection.each((item) => {
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

            const additionalItemSave = item.save(undefined, {
              xhrFields: {
                withCredentials: true,
              },
            });

            /* eslint-disable no-unused-vars */
            additionalItemSave.done((modelObj, responseObj, optionsObj) => {
              if (optionsObj.status === 201) {  // If initial create.
                this.appendAdditionalItem(modelObj);
              }

              additionalItemDeferred.resolve();
            });
            /* eslint-enable no-unused-vars */

            additionalItemSave.fail((responseObj, textStatus, errorThrown) => {
              additionalItemDeferred.reject(
                responseObj,
                textStatus,
                errorThrown,
                'additional-item',
                item  // eslint-disable-line comma-dangle
              );
            });
          } else {
            // If all four empty-by-default fields are
            // still empty on this model (and it has no
            // ID), the model should get removed from the
            // collection rather than being saved across
            // the API.
            item.destroy();
          }
        });

        jQuery.when(...additionalSaveRequests).done(() => {
          savePromise.resolve(wasCreated);
        });

        jQuery
          .when(...additionalSaveRequests)
          .fail((responseObj, textStatus, errorThrown, itemType, item) => {
            /* eslint-disable no-underscore-dangle */
            const itemView = this.children._views[
                this.children._indexByModel[item.cid]
            ];
            /* eslint-enable no-underscore-dangle */

            savePromise.reject(responseObj, textStatus, errorThrown, itemType, itemView);
          });
      });

      primaryContentSave.fail((response, textStatus, errorThrown) => {
        savePromise.reject(response, textStatus, errorThrown, 'primary-item', this);
      });
    });

    packageSave.fail((response, textStatus, errorThrown) => {
      savePromise.reject(response, textStatus, errorThrown, 'package', this);
    });

    savePromise.done((wasCreated) => {
      if (_.isFunction(successCallback)) {
        successCallback(wasCreated);
      }
    });

    savePromise.fail((response, textStatus, errorThrown, errorType, errorView) => {
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
          if (_.isNull(this.model.primaryContentItem.get('type'))) {
            // eslint-disable-next-line no-param-reassign
            response.responseJSON.type = [
              'This field may not be null.',
            ];
          }

          // Next check for slug keyword.
          if (_.isEmpty(this.model.get('slugKey'))) {
            // eslint-disable-next-line no-param-reassign
            response.responseJSON.slugKey = [
              'This field may not be blank.',
            ];
          }

          // Then check for budget line.
          if (_.isEmpty(this.model.primaryContentItem.get('budgetLine'))) {
            // eslint-disable-next-line no-param-reassign
            response.responseJSON.budgetLine = [
              'This field may not be blank.',
            ];
          }

          // Finally, check for author.
          if (_.isEmpty(this.model.primaryContentItem.get('authors'))) {
            // eslint-disable-next-line no-param-reassign
            response.responseJSON.authors = [
              'This field may not be empty.',
            ];
          }
        }

        if (_.keys(response.responseJSON).length) {
          packageErrorHolder.html('' +
            '<span class="inner">' +
              'Please fix the errors below.' +
            '</span>');
          packageErrorHolder.show();
        } else {
          packageErrorHolder.html('');
          packageErrorHolder.hide();
        }

        if (errorType !== 'additional-item') {
          boundErrors.package = _.chain(boundErrors.raw)
              .reject(binding => _.contains([
                'primaryContent',
                'additionalContent',
              ], _string_.strLeft(binding.observeErrors, '.')))
              .value();

          // Bind package errors.
          _.each(boundErrors.package, (errorBinding) => {
            const observeErrors = errorBinding.observeErrors;
            this.bindError(response, errorBinding, observeErrors, errorView);
          });

          boundErrors.primary = _.chain(boundErrors.raw)
              .filter((binding) => {
                const errorBase = _string_.strLeft(binding.observeErrors, '.');

                return errorBase === 'primaryContent';
              })
              .value();

          // Bind primary-content-item errors.
          _.each(boundErrors.primary, (errorBinding) => {
            const observeErrors = errorBinding.observeErrors;
            const observeErrorsRight = _string_.strRight(observeErrors, '.');
            this.bindError(response, errorBinding, observeErrorsRight, errorView);
          });
        } else {
          boundErrors.additionals = _.chain(boundErrors.raw)
              .filter((binding) => {
                const errorBase = _string_.strLeft(binding.observeErrors, '.');
                return errorBase === 'additionalContent';
              })
              .value();

          // Bind additional-content-item errors.
          _.each(boundErrors.additionals, (errorBinding) => {
            const observeErrors = errorBinding.observeErrors;
            const observeErrorsRight = _string_.strRight(observeErrors, '.');
            this.bindError(response, errorBinding, observeErrorsRight, errorView);
          });
        }
      }

      if (_.isFunction(errorCallback)) {
        errorCallback(response, textStatus, errorThrown, errorType);
      }
    });

    return savePromise;
  },

  bindError(response, errorBinding, fieldKey, errorView) {
    const assignedErrorClass = (
        _.has(errorBinding, 'getErrorClass')
    ) ? (
      errorBinding.getErrorClass(errorView.$el.find(errorBinding.selector))
    ) : (
      errorView.$el.find(errorBinding.selector)
          .closest('.form-group')
    );
    const errorTextHolder = (
      _.has(errorBinding, 'getErrorTextHolder')
    ) ? (
      errorBinding.getErrorTextHolder(errorView.$el.find(errorBinding.selector))
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

      errorTextHolder.html(_.map(response.responseJSON[fieldKey], (message) => {
        const errorTranslation = (
          _.has(errorBinding.errorTranslations, message)
        ) ? (
          errorBinding.errorTranslations[message]
        ) : (
          message
        );
        return errorTranslation;
      }).join(' | '));
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

    setTimeout(() => {
      this.radio.commands.execute('showModal', this.modalView);

      this.modalView.$el.parent()
                      .addClass('waiting')
                      .addClass('save-waiting');

      this.modalView.$el.append('' +
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
      '</div>');

      setTimeout(() => {
        this.modalView.$el.find('.loading-animation').addClass('active');
      }, 270);
    }, 200);

    const allComponentsSave = this.saveAllComponents();

    allComponentsSave.done((wasCreated) => {
      setTimeout(() => {
        this.saveSuccessCallback('saveOnly', wasCreated);

        // this.saveErrorCallback('saveOnly', 'processingError', [requestParams[0]]);
      }, 1500);
    });

    allComponentsSave.fail((response, textStatus, errorThrown) => {
      this.saveErrorCallback('saveOnly', 'hardError', [
        response,
        textStatus,
        errorThrown,
      ]);
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

    setTimeout(() => {
      this.radio.commands.execute('showModal', this.modalView);

      this.modalView.$el.parent()
                      .addClass('waiting')
                      .addClass('save-waiting');

      this.modalView.$el.append('' +
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
      '</div>');

      setTimeout(() => {
        this.modalView.$el.find('.loading-animation').addClass('active');
      }, 270);
    }, 200);

    const allComponentsSave = this.saveAllComponents();

    allComponentsSave.done((wasCreated) => {
      setTimeout(() => {
        this.saveSuccessCallback('saveAndContinue', wasCreated);
      }, 1500);
    });

    allComponentsSave.fail((response, textStatus, errorThrown, errorType) => {
      this.saveErrorCallback('saveAndContinue', 'hardError', [
        response,
        textStatus,
        errorThrown,
        errorType,
      ]);
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

            $el.append('' +
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
            '</div>');

            setTimeout(() => {
              $el.find('.loading-animation').addClass('active');
            }, 600);

            setTimeout(() => {
              $el.find('.modal-inner').css({ visibility: 'hidden' });
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

            deleteRequest.fail((response, textStatus, errorThrown) => {
              this.deleteErrorCallback('hardError', [
                response,
                textStatus,
                errorThrown,
              ]);
            });
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

    // const dbPrimarySlug = this.model.get('slug');
    const currentPrimarySlug = this.ui.packageTitle.text();
    const itemSlugEndings = this.model.additionalContentCollection
                  .map(additionalItem => additionalItem.get('slugKey'));

    // Add blank additional key to begining of slugs list (which will represent
    // the primary content item/parent package).
    itemSlugEndings.unshift('');

    const itemsToDelete = deline`
        <ul class="to-be-deleted-list">${
            _.chain(_.map(itemSlugEndings, (slugEnd) => {
              const slugSuffix = (slugEnd !== '') ? `.${slugEnd}` : '';
              return `${currentPrimarySlug}${slugSuffix}`;
            })).map(additionalSlug => deline`
            <li class="to-be-deleted-item">${additionalSlug}
            </li>`).reduce((memo, num) => memo + num, '')
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

    setTimeout(() => {
      this.radio.commands.execute('showModal', this.modalView);
    }, 200);
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
    _.each(this.ui.packageForm.find("[data-form][isRequired='true']"), (field) => {
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
    });
  },


    /*
     *   Save & delete callbacks.
     */

  deleteSuccessCallback() {  // args: response
    // Close this popup and destroy it.
    setTimeout(() => { this.radio.commands.execute('destroyModal'); }, 500);

    // Navigate to the index view
    this.radio.commands.execute('navigate', this.priorPath, { trigger: true });

    // Display snackbar:
    this.radio.commands.execute('showSnackbar', new SnackbarView({
      snackbarClass: 'success',
      text: 'Item has been successfully deleted.',
      action: { promptText: 'Dismiss' },
    }));
  },

  deleteErrorCallback() {
    // Close this popup and destroy it:
    setTimeout(() => { this.radio.commands.execute('destroyModal'); }, 500);

    // Display snackbar:
    this.radio.commands.execute('showSnackbar', new SnackbarView({
      containerClass: 'edit-page',
      snackbarClass: 'failure',
      text: 'Item could not be deleted. Try again later.',
    }));
  },

  saveSuccessCallback(mode) {
    // Configure success-message snackbar.
    const successSnackbarOpts = {
      snackbarClass: 'success',
      text: 'Item successfully saved.',
      action: { promptText: 'Dismiss' },
    };

    // Close this popup and destroy it.
    setTimeout(() => {
      this.radio.commands.execute('destroyModal');
    }, 500);

    // Navigate to the index view (or to the same page if save and continue)
    if (mode === 'saveOnly') {
      this.radio.commands.execute('navigate', this.priorPath, { trigger: true });
    } else if (mode === 'saveAndContinue') {
      const redirectURL = `${urlConfig.editPage.reversePattern}${this.model.id}/`;
      this.radio.commands.execute('navigate', redirectURL, { trigger: true });

      successSnackbarOpts.containerClass = 'edit-page';
    }

    // Display snackbar:
    this.radio.commands.execute('showSnackbar', new SnackbarView(successSnackbarOpts));
  },

  saveErrorCallback() {
    // Close this popup and destroy it.
    setTimeout(() => { this.radio.commands.execute('destroyModal'); }, 500);

    // Display snackbar:
    this.radio.commands.execute('showSnackbar', new SnackbarView({
      containerClass: 'edit-page',
      snackbarClass: 'failure',
      text: 'Item could not be saved. Try again later.',
    }));
  },


  /*
  *   Form serializer.
  */

  serializeForm() {},  // End serializeForm.
});
