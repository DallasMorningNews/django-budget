import 'underscore.string';
import _ from 'underscore';
import jQuery from 'jquery';

import ContentPlacementCollection from '../../collections/content-placements';
import ContentPlacementChoicesModal from '../modals/content-placement-choices';
import ModalView from '../../itemviews/modals/modal-window';
import PackageItemView from './package-base';

export default PackageItemView.extend({
  template: 'budget/package-item-web',

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

    this.moment = this.radio.reqres.request('getSetting', 'moment');
    this.moment.locale('en-us-apstyle');
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
    // templateContext.packageObj.primaryContent.slugDate = this.model.generateSlugDate();
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

    // Formatted run date.
    templateContext.publishDate = this.model.generateFormattedPublishDate().join(' ');

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
    // if (_.has(packageObj.primaryContentItem, 'length')) {
    //     templateContext.primaryLengthFormatted = _string_.numberFormat(
    //         packageObj.primaryContentItem.get('length')
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

    return templateContext;
  },

  showPrintInfoModal(event) {
    // Override to grab all placements and show them in a list.
    event.stopPropagation();

    // Halt polling (so subsequent fetches from the server don't
    // overwrite what a user is setting).
      // eslint-disable-next-line no-underscore-dangle
    this._parent.poller.pause();

    this.placementsCollection = new ContentPlacementCollection();

    const placementQueryParams = {
      data: { package: this.model.id },
      xhrFields: { withCredentials: true },
    };

    this.placementsCollection.fetch(Object.assign({}, placementQueryParams, {
      success: (collection) => {  // Args: collection, response, options
        this.renderMultiplePlacementsModule(collection);
      },
      error: (collection, response) => {  // Args: collection, response, options
        /* eslint-disable no-console */
        console.warn('ERROR: Could not fetch content placements using these params:');
        console.warn(placementQueryParams);
        window.httpError = response;
        console.warn('HTTP request details have been saved in "window.httpError".');
        /* eslint-enable no-console */
      },
    }));
  },

  renderMultiplePlacementsModule(collection) {
    if (collection.length > 0) {
      const placementChoiceModal = new ContentPlacementChoicesModal({
        model: this.model,
        extraContext: this,
        placements: collection,
        moment: this.moment,
        destinations: this.options.printPublications,
        callbacks: {
          cancel: () => {
            this.radio.commands.execute('destroyModal');
          },
        },
      });

      this.modalView = new ModalView({
        model: this.model,
        view: placementChoiceModal,
        renderCallback: (modalView) => {
          const $modalInner = modalView.view.$el;
          const $modalSelects = $modalInner.find('.select-trigger .checkbox input');
          const $allRows = $modalInner.find('.table-card tbody tr');

          $allRows.on('click', (event) => {
            const $rowTarget = jQuery(event.currentTarget);
            const $exactTarget = jQuery(event.target);
            const $selectTrigger = $rowTarget.find('.select-trigger');

            if (!jQuery.contains($selectTrigger[0], $exactTarget[0])) {
              // Only capture clicks that don't already trigger the checkbox.
              $selectTrigger.find('input').click();
            }
          });

          $modalSelects.on('change', (event) => {
            const $target = jQuery(event.currentTarget);
            const isChecked = $target.is(':checked');
            const $parentRow = $target.closest('tr');
            const thisID = $target.attr('id').replace('is_selected_', '');

            if (isChecked) {
              // Set class "selected" on parent TR.
              const $otherRows = $allRows.filter(`:not(#content-placement_${thisID})`);

              $otherRows.removeClass('selected');
              $parentRow.addClass('selected');

              $otherRows.find('.select-trigger .checkbox input').prop('checked', false);
            } else {
              // Unset class "selected" on parent TR.
              $parentRow.removeClass('selected');
            }
          });
        },
      });

      this.radio.commands.execute('showModal', this.modalView);
    } else {
      // No placements exist. Go right into create view.
    }
  },

  onRenderCallback() {
    this.ui.rippleButton.addClass('click-init');
  },
});
