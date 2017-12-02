import _ from 'underscore';
import Backbone from 'backbone';
import jQuery from 'jquery';
import Mn from 'backbone.marionette';
import _string_ from 'underscore.string';

import deline from '../../../vendored/deline';
import urlConfig from '../../misc/urls';

import ContentPlacementCollection from '../../collections/content-placements';
import ContentPlacementChoicesModal from '../modals/content-placement-choices';
import ModalView from '../modals/modal-window';
import SnackbarView from '../snackbars/snackbar';
import WebPublishingModalView from '../list-modals/web-publishing';

export default Mn.ItemView.extend({
  className: 'package-sheet-holder',

  modelEvents: {
    change: 'render',
  },

  initialize() {
    this.radio = Backbone.Wreqr.radio.channel('global');

    this.printPlacementChoices = this.enumeratePrintPlacementChoices();

    this.imageAssets = this.radio.reqres.request('getSetting', 'imageAssets');

    this.initEnd();
  },

  serializeData() {
    const templateContext = {};

    return templateContext;
  },

  onAttach() {
    this.$el.find('.might-overflow').bind('mouseenter', (event) => {
      const $thisEl = jQuery(event.currentTarget);

      if (this.offsetWidth < this.scrollWidth && !$thisEl.attr('title')) {
        $thisEl.attr('title', $thisEl.text());
      }
    });
  },

  addButtonClickedClass(event) {
    const $thisEl = jQuery(event.currentTarget);
    $thisEl.addClass('active-state');
    $thisEl.removeClass('click-init');

    setTimeout(
      () => { $thisEl.removeClass('hover').removeClass('active-state'); },
      1000  // eslint-disable-line comma-dangle
    );

    setTimeout(
      () => { $thisEl.addClass('click-init'); },
      2000  // eslint-disable-line comma-dangle
    );
  },

  enumeratePrintPlacementChoices() {
    const sectionPublicationValues = [];
    const publicationSections = [];
    const placementChoices = _.compact(
      this.options.printPublications.map((publication) => {
        if (publication.get('isActive') === true) {
          // Generate a second map with this publications'
          // section IDs and the publication's slug.
          // This gets used on the selectize 'select' event.
          sectionPublicationValues.push(
            _.map(
              publication.get('sections'),
              // eslint-disable-next-line comma-dangle
              section => [section.id, publication.get('slug')]
            )  // eslint-disable-line comma-dangle
          );

          publicationSections.push(
            [
              publication.get('slug'),
              publication.get('sections'),
            ]  // eslint-disable-line comma-dangle
          );

          return {
            name: publication.get('name'),
            value: publication.get('slug'),
          };
        }

        return null;
      })  // eslint-disable-line comma-dangle
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

  showWebInfoModal(event) {
    event.stopPropagation();

    // Halt polling (so subsequent fetches from the server don't
    // overwrite what a user is setting).
    // eslint-disable-next-line no-underscore-dangle
    this._parent.poller.pause();

    const webInfoModal = new WebPublishingModalView({
      model: this.model,
      callbacks: {
        // eslint-disable-next-line no-underscore-dangle
        resumePolling: () => { this._parent.poller.resume(); },
        success: () => { this.infoModalSuccessCallback('web'); },
        error: () => { this.infoModalErrorCallback(); },
        close: () => { this.radio.commands.execute('destroyModal'); },
      },
    });

    const formRows = [];
    formRows.push(
      {
        extraClasses: '',
        fields: [
          {
            type: 'input',
            widthClasses: 'small-12 medium-12 large-12',
            labelText: 'URL',
            inputID: 'published-url',
            inputName: 'url',
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
            type: 'input',
            widthClasses: 'small-6 medium-8 large-8',
            labelText: 'Date published (online)',
            inputID: 'publish-date',
            inputName: 'publish_date',
            inputType: 'text',
          },
          {
            type: 'input',
            widthClasses: 'small-6 medium-4 large-4',
            labelText: 'Time published',
            inputID: 'publish-time',
            inputName: 'publish_time',
            inputType: 'text',
          },
        ],
      }  // eslint-disable-line comma-dangle
    );

    webInfoModal.extendConfig({ formConfig: { rows: formRows } });

    this.modalView = new ModalView({
      modalConfig: webInfoModal.getConfig(),
      model: this.model,
      renderCallback: () => {
        this.modalView.stickit(null, webInfoModal.getBindings());
      },
    });

    this.radio.commands.execute('showModal', this.modalView);
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

  showNotesModal() {
    const noteText = this.model.get('notes');
    const noteLines = _string_.lines(noteText);

    let displayedHTML = '';
    const strippedLength = _.chain(noteLines)
                                  .map(d => _string_.stripTags(d))
                                  .reduce((m, n) => `${m} ${n}`, '')
                                .value()
                                .length;

    if (strippedLength > 0) {
      const formattedLines = _.map(noteLines, d => _string_.stripTags(d));

      displayedHTML = deline`
        <div class="mode-toggle">

            <div trigger-mode="read-only">Read</div>

            <div trigger-mode="edit">Edit</div>

        </div>

        <div class="modes">

            <div class="read-only ruled">${formattedLines.join('<br />')}</div>

            <div class="edit"><textarea>${formattedLines.join('<br />')}</textarea></div>

        </div>`;
    } else {
      displayedHTML = deline`
        <div class="inline-image-holder">
          <img class="notes-placeholder" src="${this.imageAssets.notepad}" alt="" />
        </div>

        <p class="note-placeholder-message">There aren't any production notes attached to this item yet.</p>
      `;
    }

    const notesModal = {
      modalTitle: 'Production notes',
      innerID: 'production-notes-modal',
      contentClassName: 'package-modal',
      extraHTML: displayedHTML,
      buttons: [
        {
          buttonID: 'package-notes-save-button',
          buttonClass: [
            'flat-button',
            'primary-action',
            'save-trigger',
            'expand-past-button',
          ].join(' '),
          innerLabel: 'Save',
          clickCallback: () => {},
        },
        {
          buttonID: 'package-notes-close-button',
          buttonClass: 'flat-button primary-action close-trigger',
          innerLabel: 'Close',
          clickCallback: () => {
            this.radio.commands.execute('destroyModal');
          },
        },
      ],
    };

    this.modalView = new ModalView({
      modalConfig: notesModal,
    });

    this.radio.commands.execute('showModal', this.modalView);
  },

  showSubscriptionModal() {
    const subscriptionModal = {
      modalTitle: 'Coming soon',
      innerID: 'subscription-modal',
      contentClassName: 'package-modal',
      extraHTML: '' +
        '<div class="image-holder">' +
        `    <img src="${this.imageAssets.slackProgress}" alt="Slack subscriptions coming soon" />` +
        '</div>' +
        '<p>' +
            'Soon you will be able to follow budgeted content on Slack.' +
        '</p>' +
        '<p>' +
            'We&rsquo;ll keep track of everything you follow, and let you ' +
            'know whenever there&rsquo;s been an&nbsp;update.' +
        '</p>' +
        '<p>' +
            'Check back shortly as we finish implementing this feature.' +
        '</p>',
      buttons: [
        {
          buttonID: 'package-notes-close-button',
          buttonClass: 'flat-button primary-action close-trigger',
          innerLabel: 'Close',
          clickCallback: () => {
            this.radio.commands.execute('destroyModal');
          },
        },
      ],
    };

    this.modalView = new ModalView({
      modalConfig: subscriptionModal,
    });

    this.radio.commands.execute('showModal', this.modalView);
  },


  /*
  *   Event handlers.
  */
  onReadinessIndicatorClick(event) {
    event.stopPropagation();
  },

  expandOnMobile() {
    if (jQuery(window).width() < this.radio.reqres.request('getSetting', 'buttonHideWidth')) {
      this.expandPackageSheet();
    }
  },

  showPackageEdit(event) {
    if (event.button === 0 && !(event.ctrlKey || event.metaKey)) {
      event.preventDefault();

      this.radio.commands.execute(
        'navigate',
        `${urlConfig.editPage.reversePattern}${this.model.id}/`,
        { trigger: true }  // eslint-disable-line comma-dangle
      );
    }
  },

  expandPackageSheet() {
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
        () => {
          this.ui.packageSheetOuter
                      .find('.primary-description')
                      .addClass('overflow-visible');
        },
        1500  // eslint-disable-line comma-dangle
      );

      this.primaryIsExpanded = true;
    }
  },


  /*
   *   Form-submission callbacks.
   */

  infoModalSuccessCallback(infoType) {
    let snackbarText;

    // Close this popup and destroy it:
    setTimeout(() => { this.radio.commands.execute('destroyModal'); }, 500);

    // Set snackbar text:
    if (infoType === 'print') {
      snackbarText = 'Updated print publishing info.';
    } else if (infoType === 'web') {
      snackbarText = 'Updated web publishing info.';
    }

    // Display snackbar:
    this.radio.commands.execute(
      'showSnackbar',
      new SnackbarView({
        snackbarClass: 'success',
        text: snackbarText,
        action: { promptText: 'Dismiss' },
      })  // eslint-disable-line comma-dangle
    );
  },

  infoModalErrorCallback() {
    // Close this popup and destroy it:
    setTimeout(() => { this.radio.commands.execute('destroyModal'); }, 500);

    // Display snackbar:
    this.radio.commands.execute(
      'showSnackbar',
      new SnackbarView({
        snackbarClass: 'failure',
        text: 'Could not apply update. Try again later.',
      })  // eslint-disable-line comma-dangle
    );
  },
});
