import 'underscore.string';
import _ from 'underscore';

// import deline from '../../../vendored/deline';

import formatDateRange from '../../../common/date-range-formatter';
import ModalView from '../modals/modal-window';
import PackageItemView from './package-base';
import PrintPublishingModalView from '../list-modals/print-publishing';

export default PackageItemView.extend({
  template: 'budget/package-item-print',

  ui: {
    packageSheetOuter: '.package-sheet',
    minimalCard: '.package-sheet .minimal-card',
    rippleButton: '.package-sheet .material-button',
    readinessIndicator: '.package-sheet .minimal-card .indicator-inner',
    editPackageTrigger: '.package-sheet .edit-package',
    notesModalTrigger: '.package-sheet .view-notes',
    subscriptionModalTrigger: '.package-sheet .subscribe',
    printInfoModalTrigger: '.package-sheet .print-info',
    webInfoModalTrigger: '.package-sheet .web-info',
  },

  events: {
    'click @ui.minimalCard': 'expandPackageSheet',
    'mousedown @ui.rippleButton': 'addButtonClickedClass',
    'click @ui.readinessIndicator': 'onReadinessIndicatorClick',
    'click @ui.editPackageTrigger': 'showPackageEdit',
    'click @ui.notesModalTrigger': 'showNotesModal',
    'click @ui.subscriptionModalTrigger': 'showSubscriptionModal',
    'click @ui.printInfoModalTrigger': 'showPrintInfoModal',
    'click @ui.webInfoModalTrigger': 'showWebInfoModal',
  },

  hasPrimary: false,

  initEnd() {
    this.primaryIsExpanded = false;

    if (_.has(this.options, 'currentSection')) {
      const destinationID = parseInt(this.options.currentSection.publication, 10);
      this.availableSections = this.options.allSections
              .filter(i => i.publication === destinationID);
    }

    this.moment = this.radio.reqres.request('getSetting', 'moment');
    this.moment.locale('en-us-apstyle');
    this.defaultTimezone = this.radio.reqres.request(
      'getSetting',
      'defaultTimezone'  // eslint-disable-line comma-dangle
    );
  },

  serializeData() {
    const templateContext = {};
    const packageObj = this.model.toJSON();
    const packageHub = this.options.hubConfigs.findWhere({ slug: packageObj.hub });
    const additionals = this.model.additionalContentCollection;

    // Template context, in order of appearance:

    // Edit-view link base.
    const navLinks = this.radio.reqres.request('getSetting', 'navigationLinks');
    const homeView = _.findWhere(navLinks, { name: 'Home' });
    templateContext.homeViewLink = homeView.destination;

    // Has-primary item (used to show or hide packages).
    templateContext.hasPrimary = this.hasPrimary;

    // Expanded (or not) package state.
    templateContext.primaryIsExpanded = this.primaryIsExpanded;

    // Underlying model.
    templateContext.packageObj = _.clone(packageObj);

    templateContext.packageObj.primaryContent = _.clone(
      this.model.primaryContentItem.toJSON()  // eslint-disable-line comma-dangle
    );

    // Slug date.
    templateContext.packageObj.slugDate = packageObj.slugDate;

    // Is-published indicator.
    templateContext.packageHasURL = !_.isNull(packageObj.publishedUrl);

    // Hub color and vertical slug.
    if (!_.isUndefined(packageHub)) {
      templateContext.hubDotColor = packageHub.get('color');
      templateContext.verticalSlug = packageHub.get('vertical').slug;
      templateContext.hubName = packageHub.get('name');
      templateContext.verticalName = packageHub.get('vertical').name;
    }

    // Editor and author lists.
    templateContext.allPeople = _.union(
        _.pluck(this.model.primaryContentItem.get('editors'), 'email'),
        _.pluck(this.model.primaryContentItem.get('authors'), 'email'),
        _.pluck(_.flatten(additionals.pluck('editors')), 'email'),
        // eslint-disable-next-line comma-dangle
        _.pluck(_.flatten(additionals.pluck('authors')), 'email')
    ).join(' ');

    // Leading headline (if voting is open),
    // or winning headline if one was selected.
    if (packageObj.headlineCandidates.length > 0) {
      templateContext.leadingHeadline = _.chain(packageObj.headlineCandidates)
        .sortBy('votes')
        .last()
        .value()
        .text;
    }

    const contentTypes = this.radio.reqres.request('getSetting', 'contentTypes');

    // Verbose name and other information for primary content type icon.
    templateContext.primaryTypeMeta = contentTypes[
        this.model.primaryContentItem.get('type')
    ];

    // Fallback function for comma-formatted length (1 of 2).
    // if (_.has(packageObj.primaryContent, 'length')) {
    //     templateContext.primaryLengthFormatted = _string_.numberFormat(
    //         packageObj.primaryContent.length
    //     );
    // }

    // List of additional content item types and icons
    // (Needed for "Includes [other icons]" list).
    templateContext.additionalItemTypes = _.map(
      additionals.pluck('type'),
      (typeSlug) => {
        const typeObj = _.clone(contentTypes[typeSlug]);
        typeObj.slug = typeSlug;
        return typeObj;
      }  // eslint-disable-line comma-dangle
    );

    // List of additional content items, in an object with
    // on-model ('model') and 'typemeta' attributes.
    templateContext.additionalWithTypeMetas = additionals.map((item) => {
      const additionalConfig = {
        model: item.toJSON(),
        typeMeta: contentTypes[item.get('type')],
      };

      return additionalConfig;
    });

    /*                                             */
    /* Content placement information for template. */
    /*                                             */

    if (
      _.has(this.options, 'placementList')
    ) {
      // Only grab the first matching print placement.
      // That'll mean the same content won't be budgetable twice in the
      // same publication, which we'll have to add validation for.
      templateContext.contentPlacements = this.options.placementList;

      const allCurrentPlacements = this.options.placementList.map(i => i.placementTypes);
      const currentPlacementList = _.flatten(allCurrentPlacements);

      const availablePlacements = this.availableSections.map(i => i.slug);

      const activePlacements = _.intersection(availablePlacements, currentPlacementList);

      templateContext.placementTypes = _.chain(activePlacements)
          .uniq()
          .map((placementSlug) => {
            const match = _.findWhere(this.availableSections, {
              slug: placementSlug,
            });
            return {
              name: match.name,
              priority: match.priority,
            };
          })
          .sortBy('priority')
          .pluck('name')
          .value();

      const rawRunDate = this.options.placementList[0].runDate;

      const runDate = {
        start: this.moment(rawRunDate[0], 'YYYY-MM-DD'),
        end: this.moment(rawRunDate[1], 'YYYY-MM-DD').subtract({ days: 1 }),
      };

      templateContext.formattedRunDateRange = formatDateRange(runDate.start, runDate.end);
    }

    return templateContext;
  },

  showPrintInfoModal(event) {
    event.stopPropagation();

    // Halt polling (so subsequent fetches from the server don't
    // overwrite what a user is setting).
      // eslint-disable-next-line no-underscore-dangle
    this._parent.poller.pause();

    console.log('Mk1');
    window.mk = { this: this };

    const printInfoModal = new PrintPublishingModalView({
      model: this.model,
      callbacks: {
        // eslint-disable-next-line no-underscore-dangle
        resumePolling: () => { this._parent.poller.resume(); },
        success: () => { this.infoModalSuccessCallback('print'); },
        error: () => { this.infoModalErrorCallback(); },
        close: () => { this.radio.commands.execute('destroyModal'); },
      },
      extraContext: {
        printPlacementChoices: this.printPlacementChoices,
        printPublicationSections: this.printPublicationSections,
        sectionPublicationMap: this.sectionPublicationMap,
      },
    });

    const formRows = [];
    formRows.push(
      {
        id: 'print_run_date_inputs',
        extraClasses: '',
        fields: [
          {
            type: 'input',
            widthClasses: 'small-6 medium-6 large-6',
            labelText: 'Print run date (start)',
            inputID: 'print_run_date_start',
            inputName: 'print_run_date_start',
            inputType: 'text',
          },
          {
            type: 'input',
            widthClasses: 'small-6 medium-6 large-6',
            labelText: 'Print run date (end)',
            inputID: 'print_run_date_end',
            inputName: 'print_run_date_end',
            inputType: 'text',
          },
        ],
      }  // eslint-disable-line comma-dangle
    );

    const printSlugName = this.radio.reqres.request('getSetting', 'printSlugName');
    if (printSlugName !== null) {
      formRows.push(
        {
          extraClasses: '',
          fields: [
            {
              type: 'input',
              widthClasses: 'small-12 medium-12 large-12',
              labelText: printSlugName,
              inputID: 'print_system_slug',
              inputName: 'print_system_slug',
              inputType: 'text',
            },
          ],
        }  // eslint-disable-line comma-dangle
      );
    }

    formRows.push(
      {
        extraClasses: '',
        fields: [
          {
            type: 'input',
            extraClasses: 'publication-group',
            widthClasses: 'small-12 medium-12 large-12',
            labelText: 'Publication',
            inputID: 'print_publication',
            inputName: 'print_publication',
            inputType: 'text',
          },
        ],
      }  // eslint-disable-line comma-dangle
    );

    formRows.push(
      {
        extraClasses: '',
        fields: [
          {
            type: 'div',
            widthClasses: 'small-12 medium-12 large-12',
            extraClasses: 'checkbox',
            inputID: 'print_section',
          },
        ],
      }  // eslint-disable-line comma-dangle
    );

    formRows.push(
      {
        extraClasses: '',
        fields: [
          {
            type: 'checkbox',
            extraClasses: 'additional-checkbox-group',
            widthClasses: 'small-12 medium-12 large-12',
            labelText: 'Print placement finalized?',
            inputID: 'is_placement_finalized',
            inputName: 'is_placement_finalized',
            inputValue: 'finalized',
          },
        ],
      }  // eslint-disable-line comma-dangle
    );

    printInfoModal.extendConfig({ formConfig: { rows: formRows } });

    this.modalView = new ModalView({
      modalConfig: printInfoModal.getConfig(),
      model: this.model,
      renderCallback: () => {
        this.modalView.stickit(null, printInfoModal.getBindings());
      },
    });

    this.radio.commands.execute('showModal', this.modalView);
  },

  onRenderCallback() {
    this.ui.rippleButton.addClass('click-init');
  },
});
