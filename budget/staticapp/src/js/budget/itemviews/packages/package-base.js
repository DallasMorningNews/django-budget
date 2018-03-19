import _ from 'underscore';
import Backbone from 'backbone';
import cheerio from 'cheerio';
import jQuery from 'jquery';
import Mn from 'backbone.marionette';

import deline from '../../../vendored/deline';
import urlConfig from '../../misc/urls';

import ContentPlacementCollection from '../../collections/content-placements';
import ContentPlacementChoicesModal from '../modals/content-placement-choices';
import ContentPlacementForm from '../modals/content-placement-form';
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

    this.destinationModels = this.options.placementDestinations;
    this.sectionPublicationMap = this.createPlacementTypeDestinationMap();
    this.destinationPlacements = this.enumerateDestinationPlacements();
    this.destinations = this.enumerateDestinations();

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

  enumerateDestinations() {
    return this.destinationModels
            .filter(destination => destination.get('isActive') === true)
            .map(destination => ({
              name: destination.get('name'),
              value: destination.get('slug'),
            }));
  },

  enumerateDestinationPlacements() {
    return this.destinationModels
              .filter(i => i.get('isActive') === true)
              .map(destination => [
                destination.get('slug'),
                destination.get('sections'),
              ])
              .filter(nonFalsyVal => nonFalsyVal)  // Only non-falsy rows.
              .filter(mapping => !_.isEmpty(mapping[1]))  // Only non-empty section lists.
              .reduce((result, [key, val]) => {  // Convert 2-member arrays to object.
                const arrayToObject = Object.assign(result, { [key]: val });
                return arrayToObject;
              }, {});
  },

  createPlacementTypeDestinationMap() {
    return this.destinationModels
              .filter(i => i.get('isActive') === true)  // Only active destinations.
              .map(destination => destination  // Only type ID and destination slug.
                                    .get('sections')
                                    .map(i => [i.id, destination.get('slug')]))
              .filter(nonFalsyVal => nonFalsyVal)  // Only non-falsy rows.
              .filter(typeObj => !_.isEmpty(typeObj))  // Only non-empty rows.
              .reduce((result, arr) => result.concat(arr), [])  // Flatten arrays.
              .reduce((result, [key, val]) => {  // Convert 2-member arrays to object.
                const arrayToObject = Object.assign(result, { [key]: val });
                return arrayToObject;
              }, {});
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
    if (collection.length > 1) {
      const placementChoiceModal = new ContentPlacementChoicesModal({
        model: this.model,
        extraContext: this,
        placements: collection,
        moment: this.moment,
        destinations: this.destinationModels,
        callbacks: {
          cancel: () => {
            this.radio.commands.execute('destroyModal');
          },
          openPlacementForEditing: (chosenID) => {
            if (chosenID === null) {
              // TODO: Show "please select a placement to edit it" error.
            } else {
              const chosenPlacement = collection.findWhere({ id: chosenID });
              this.radio.commands.execute('destroyModal');

              setTimeout(() => {
                this.showContentPlacementModal(chosenPlacement);
              }, 125);
            }
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
    } else if (collection.length > 0) {
      this.showContentPlacementModal(collection.at(0));
    } else {
      // No placements exist. Go right into create view.
    }
  },

  showContentPlacementModal(model) {
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
      extraContext: this,
      callbacks: {
        save: () => {
          setTimeout(() => {
            model.save({}, {
              xhrFields: {
                withCredentials: true,
              },
              success: () => {
                this.radio.commands.execute('destroyModal');

                this.radio.commands.execute('showSnackbar', new SnackbarView({
                  snackbarClass: 'success',
                  text: 'Successfully updated content placement.',
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

  showNotesModal() {
    const noteText = this.model.get('notes');

    const noteBody = cheerio.load(`<body>${noteText}</body>`);

    const formattedBody = Array.from(noteBody('body > *')
              .map((i, el) => {
                if (
                  (el.children.length === 1) &&
                  (el.children[0].name === 'br') &&
                  (el.children[0].type === 'tag')
                ) { return null; }

                const $el = cheerio(el);

                $el.find('[style="font-size: 10px;"]').addClass('text-10');
                $el.find('[style="font-size: 14px;"]').addClass('text-14');
                $el.find('[style="font-size: 16px;"]').addClass('text-16');
                $el.find('[style="font-size: 18px;"]').addClass('text-18');
                $el.find('[style="font-size: 24px;"]').addClass('text-24');
                $el.find('[style="font-size: 30px;"]').addClass('text-30');

                return `<p>${$el.html()}</p>`;
              })
              .filter(line => line !== null));

    let displayedHTML = '';

    if (formattedBody.length > 0) {
      displayedHTML = deline`
        <div class="mode-toggle">

            <div trigger-mode="read-only">Read</div>

            <div trigger-mode="edit">Edit</div>

        </div>

        <div class="modes">

            <div class="read-only ruled">${
              formattedBody.reduce((m, n) => `${m} ${n}`, '')
            }</div>

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
