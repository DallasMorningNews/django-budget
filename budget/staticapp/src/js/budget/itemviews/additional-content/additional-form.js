import 'selectize';
import _ from 'underscore';
import Backbone from 'backbone';
import jQuery from 'jquery';
import Mn from 'backbone.marionette';

import deline from '../../../vendored/deline';

import ModalView from '../modals/modal-window';
import SnackbarView from '../snackbars/snackbar';

const uiElements = {
  packageTitle: '.content-header .package-title',
  typeDropdown: '.field-type',
  lengthGroup: '.length-group',
  lengthField: '.length-group .field-length',
  pitchLinkGroup: '.request-link-group',
  addRequestButton: '.request-link-group .material-button',
  slugGroup: '.slug-group-holder',
  slugField: '.keyword-group input',
  slugPlaceholder: '.keyword-group .keyword-value',
  /* eslint-disable indent */
      slugSuffixHolder: '.slug-group-holder .slug-suffix',
      deleteTrigger: '.delete-additional',
  /* eslint-enable indent */
  budgetLineField: '.expanding-holder .field-budgetline',
  budgetLinePlaceholder: '.expanding-holder .budget-spacer',
  authorsDropdown: '.field-authors',
  editorsDropdown: '.field-editors',
};

export default Mn.ItemView.extend({
  template: 'budget/additional-content-form',
  tagName: 'form',
  className: 'additional-item-form',

  attributes() {
    return { id: this.generateFormID() };
  },


  ui: uiElements,


  bindings() {
    const bindingsObj = {};
    const ui = this.ui;
    const model = this.model;

    bindingsObj[uiElements.packageTitle] = {
      observe: [
        'parentSlug',
        'slugKey',
      ],
      onGet(values) {
        return [
          this.options.primarySlug,
          values[1],
        ];
      },
      update($el, vals) {
        const newSlug = (vals[1] !== '') ? vals.join('.') : `${vals[0]}.keyword`;

        $el.text(newSlug);
        // model.set('slug', newSlug);
      },
    };

    bindingsObj[uiElements.typeDropdown] = {
      observe: 'type',
      observeErrors: 'additionalContent.type',
      errorTranslations: {
        'This field may not be null.': 'Select a content type.',
      },
      initialize($el) {
        const typeOpts = {
          maxItems: 1,
          options: this.options.typeChoices,
          render: {
            item: dta => deline`
                <div data-value="${dta.value}"
                     class="selected-item">${dta.name}</div>`,
          },
        };
        $el.selectize(_.defaults(
          typeOpts,
          // eslint-disable-next-line comma-dangle
          this.radio.reqres.request('getSetting', 'editDropdownOptions')
        ));
      },
      getVal($el) {
        const oldType = model.get('type');
        const oldKeyMatch = (oldType === 'text') ? 'article' : oldType;

        if ($el.val()) {
          if (
            (!model.has('slugKey')) ||
            (model.get('slugKey') === '') ||
            (model.get('slugKey') === oldKeyMatch)
          ) {
            model.set(
              'slugKey',
              // eslint-disable-next-line comma-dangle
              ($el.val() === 'text') ? 'article' : $el.val()
            );
          }

          return $el.val();
        }

        return null;
      },
      update($el, value) {
        if (_.isUndefined($el[0].selectize)) {
          $el.val(value);
        } else if (_.isObject($el[0].selectize)) {
          $el[0].selectize.setValue(value, true);
        }
      },
    };

    bindingsObj[uiElements.lengthGroup] = {
      observe: 'type',
      update($el, value) {
        const field = $el.find('input');

        const contentTypes = this.radio.reqres.request('getSetting', 'contentTypes');

        if (value && contentTypes[value].usesLengthAttribute) {
          if (field.prop('disabled')) { field.prop('disabled', false); }
        } else if (!field.prop('disabled')) {
          field.prop('disabled', true);
        }
      },
      attributes: [
        {
          name: 'field-active',
          observe: 'type',
          onGet(value) {
            const contentTypes = this.radio.reqres.request('getSetting', 'contentTypes');

            if (value && contentTypes[value].usesLengthAttribute) {
              return 'true';
            }
            return 'false';
          },
        },
      ],
    };

    bindingsObj[uiElements.lengthField] = {
      observe: 'length',
      getVal($el) { return $el.val() || null; },
    };

    bindingsObj[uiElements.pitchLinkGroup] = {
      observe: 'type',
      update() {},
      attributes: [
        {
          name: 'field-active',
          observe: 'type',
          onGet(value) {
            const contentTypes = this.radio.reqres.request('getSetting', 'contentTypes');

            if (value && contentTypes[value].usesPitchSystem) {
              return 'true';
            }

            return 'false';
          },
        },
      ],
    };

    bindingsObj[uiElements.slugGroup] = {
      observe: [
        'parentSlug',
        'slugKey',
      ],
      observeErrors: 'additionalContent.slugKey',
      errorTranslations: {
        'This field may not be blank.': 'Enter a slug keyword.',
        'Ensure this field has no more than 20 characters.': '' +
              'Use up to 20 characters for slug keywords.',
      },
      initialize($el) {
        $el.on(
            'recalculateSpacing',
            () => {
              const slugGroup = ui.slugField.closest('.slug-group-holder');
              const primaryWidth = slugGroup.find('.primary-content-slug').width();
              const inputPadding = {};

              inputPadding.left = primaryWidth + 5;
              inputPadding.right = slugGroup.find('.slug-suffix').width();

              ui.slugField.css({
                left: -1 * inputPadding.left,
              });
              ui.slugField.css({
                'padding-left': inputPadding.left,
              });
              ui.slugField.css({
                'padding-right': inputPadding.right,
              });
              ui.slugField.css({
                width: slugGroup.width(),
              });
            }  // eslint-disable-line comma-dangle
        );

        setTimeout(
          () => { $el.trigger('recalculateSpacing'); },
          0  // eslint-disable-line comma-dangle
        );
      },
      onGet(values) {
        return [this.options.primarySlug, values[1]];
      },
      update($el, values) {
        const slugGroup = ui.slugField.closest('.slug-group-holder');
        const primaryWidth = slugGroup.find('.primary-content-slug');

        primaryWidth.text(`${values[0]}.`);

        // TODO: Also bind 'recalculateSpacing' on browser resize.
        $el.trigger('recalculateSpacing');
      },
      getVal() {},
    };

    bindingsObj[uiElements.slugField] = {
      observe: 'slugKey',
      initialize($el, mdl, options) {
        $el.attr('data-original-value', mdl.get(options.observe));

        $el.bind(
          'focus',
          () => {
            $el.closest('.slug-group-holder').addClass('input-focused');
          }  // eslint-disable-line comma-dangle
        );

        $el.bind(
          'blur',
          () => {
            $el.closest('.slug-group-holder').removeClass('input-focused');
          }  // eslint-disable-line comma-dangle
        );
      },
    };

    bindingsObj[uiElements.slugPlaceholder] = {
      observe: 'slugKey',
      update($el, value) {
        $el.text((value !== '') ? value : ui.slugField.attr('placeholder'));
      },
      getVal() {},
    };

    bindingsObj[uiElements.budgetLineField] = {
      observe: 'budgetLine',
      observeErrors: 'additionalContent.budgetLine',
      errorTranslations: {
        'This field may not be blank.': 'Enter a budget line.',
      },
      initialize($el) {
        $el.closest('.expanding-holder').addClass('expanding-enabled');
        $el.bind('focus', () => {
          $el.parent().addClass('input-focused');
        });
        $el.bind('blur', () => {
          $el.parent().removeClass('input-focused');
        });
      },
      update($el, value) { $el.text(value); },
    };

    bindingsObj[uiElements.budgetLinePlaceholder] = {
      observe: 'budgetLine',
      update($el, value) {
        if (value === '') {
          if ($el.closest('.expanding-holder').hasClass('has-value')) {
            $el.closest('.expanding-holder').removeClass('has-value');
          }
        } else if (!$el.closest('.expanding-holder').hasClass('has-value')) {
          $el.closest('.expanding-holder').addClass('has-value');
        }

        $el.text(value);
      },
      getVal() {},
    };

    bindingsObj[uiElements.authorsDropdown] = {
      observe: 'authors',
      observeErrors: 'additionalContent.authors',
      errorTranslations: {
        'This field may not be empty.': '' +
                'Choose one or more authors.',
      },
      setOptions: { silent: true },
      initialize($el) {
        const authorOpts = {
          closeAfterSelect: false,
          plugins: ['remove_button', 'restore_on_backspace'],

          options: this.options.stafferChoices,

          render: {
            item: dta => deline`
                <div data-value="${dta.value}"
                     class="selected-item-multichoice">${dta.name}</div>`,
          },
        };

        $el.selectize(_.defaults(
          authorOpts,
          // eslint-disable-next-line comma-dangle
          this.radio.reqres.request('getSetting', 'editDropdownOptions')
        ));
      },
      update($el, value) {
        if (_.isUndefined($el[0].selectize)) {
          $el.val(_(value).pluck('email').join(','));
        } else if (_.isObject($el[0].selectize)) {
          $el[0].selectize.clear(true);

          _(value).each(
            (author) => {
              $el[0].selectize.addItem(author.email, true);
            }  // eslint-disable-line comma-dangle
          );
        }
      },
      getVal($el) {
        const newAuthors = [];

        _($el.val().split(',')).each(
            (authorKey) => {
              if (authorKey !== '') {
                newAuthors.push(
                  this.options.staffers.findWhere({
                    email: authorKey,
                  }).toJSON()  // eslint-disable-line comma-dangle
                );
              }
            }  // eslint-disable-line comma-dangle
        );

        return newAuthors;
      },
    };

    bindingsObj[uiElements.editorsDropdown] = {
      observe: 'editors',
      setOptions: { silent: true },
      initialize($el) {
        const editorOpts = {
          closeAfterSelect: false,
          plugins: ['remove_button', 'restore_on_backspace'],

          options: this.options.stafferChoices,

          render: {
            item: dta => deline`
                    <div data-value="${dta.value}"
                         class="selected-item-multichoice">${
                            dta.name
                        }</div>`,
          },
        };

        $el.selectize(_.defaults(
          editorOpts,
          // eslint-disable-next-line comma-dangle
          this.radio.reqres.request('getSetting', 'editDropdownOptions')
        ));
      },
      update($el, value) {
        if (_.isUndefined($el[0].selectize)) {
          $el.val(_(value).pluck('email').join(','));
        } else if (_.isObject($el[0].selectize)) {
          $el[0].selectize.clear(true);

          _(value).each(
            (editor) => {
              $el[0].selectize.addItem(editor.email, true);
            }  // eslint-disable-line comma-dangle
          );
        }
      },
      getVal($el) {
        const newEditors = [];

        _($el.val().split(',')).each(
          (editorKey) => {
            if (editorKey !== '') {
              newEditors.push(
                this.options.staffers.findWhere({
                  email: editorKey,
                }).toJSON()  // eslint-disable-line comma-dangle
              );
            }
          }  // eslint-disable-line comma-dangle
        );

        return newEditors;
      },
    };

    return bindingsObj;
  },

  events: {
    'mousedown @ui.addRequestButton': 'addButtonClickedClass',
    'click @ui.addRequestButton': 'openVisualsRequestForm',
    'click @ui.deleteTrigger': 'deleteItem',
  },

  // modelEvents: {
  //     'change': 'render'
  // },

  initialize() {
    this.radio = Backbone.Wreqr.radio.channel('global');

    if (this.model.has('id')) {
      this.slugSuffixRaw = _.last(
        _.last(this.model.get('slug').split('.')).split(
            this.model.get('slugKey')  // eslint-disable-line comma-dangle
        )  // eslint-disable-line comma-dangle
      );
    } else {
      this.slugSuffixRaw = '';
    }
  },

  serializeData() {
    const context = {
      formID: this.generateFormID(),
    };

    const externalURLs = this.radio.reqres.request('getSetting', 'externalURLs');

    if (_.has(externalURLs, 'addVisualsRequest')) {
      context.visualsRequestURL = externalURLs.addVisualsRequest;
    }

    return context;
  },

  onRender() {
    this.stickit();
  },

  onShow() {},

  onAttach() {},


  /*
  *   Instantiation methods.
  */

  generateFormID() {
    if (this.model.has('id')) {
      return `additionalBound${this.model.get('id')}`;
    }

    const thisIndex = this.model.collection.indexOf(this.model);
    const boundFormCount = this.model.collection.filter(i => i.has('id')).length;

    return `additionalUnbound${(thisIndex - (boundFormCount + 1))}`;
  },


  /*
  *   Event handlers.
  */

  addButtonClickedClass(event) {
    const thisEl = jQuery(event.currentTarget);
    thisEl.addClass('active-state');
    thisEl.removeClass('click-init');

    setTimeout(
      () => { thisEl.removeClass('hover').removeClass('active-state'); },
      1000  // eslint-disable-line comma-dangle
    );

    setTimeout(
        () => { thisEl.addClass('click-init'); },
        2000  // eslint-disable-line comma-dangle
    );
  },

  openVisualsRequestForm(event) {
    const triggerElement = jQuery(event.currentTarget);

    if (event.button === 0 && !(event.ctrlKey || event.metaKey)) {
      event.preventDefault();

      window.open(triggerElement.find('a').attr('href'), '_blank');
    }
  },

  deleteItem() {
    const deleteConfirmationModal = {
      modalTitle: 'Are you sure?',
      innerID: 'additional-delete-confirmation-modal',
      contentClassName: 'package-modal deletion-modal',
      extraHTML: deline`
          <p class="delete-confirmation-text">You are about to
          delete the following budgeted content:</p>

           <ul class="to-be-deleted-list">
               <li class="to-be-deleted-item">${this.model.get('slug')}</li>
           </ul>

           <p class="delete-confirmation-text">Items can&rsquo;t
           be recovered once they&rsquo;ve been deleted.</p>

           <p class="delete-confirmation-text">If you&rsquo;re
           sure you want to delete this item, click the
           <span class="button-text-inline">delete</span>
           button below.</p>`,
      escapeButtonCloses: false,
      overlayClosesOnClick: false,
      buttons: [
        {
          buttonID: 'delete-package-delete-button',
          buttonClass: 'flat-button delete-action ' +
                        'expand-past-button delete-trigger',
          innerLabel: 'Delete',
          clickCallback: (modalContext) => {
            modalContext.$el.parent()
                            .addClass('waiting-transition')
                            .addClass('delete-waiting-transition');

            modalContext.$el.append(
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
              '</div>'  // eslint-disable-line comma-dangle
            );

            setTimeout(() => {
              modalContext.$el.find('.loading-animation').addClass('active');
            }, 600);

            setTimeout(() => {
              modalContext.$el.find('.modal-inner').css({
                visibility: 'hidden',
              });
            }, 450);

            setTimeout(() => {
              modalContext.$el.parent()
                  .addClass('waiting')
                  .addClass('delete-waiting')
                  .removeClass('waiting-transition')
                  .removeClass('delete-waiting-transition');
            }, 500);

            const deleteRequest = this.model.destroy({
              xhrFields: {
                withCredentials: true,
              },
            });

            // eslint-disable-next-line no-unused-vars
            deleteRequest.done((mdl, resp, opts) => {
              setTimeout(() => {
                this.deleteSuccessCallback.call(this, resp);
              }, 1500);
            });

            // eslint-disable-next-line no-unused-vars
            deleteRequest.fail((response, errorText) => {
              this.deleteErrorCallback('hardError', [response, errorText]);
            });
          },
        },
        {
          buttonID: 'delete-additional-content-cancel-button',
          buttonClass: 'flat-button primary-action cancel-trigger',
          innerLabel: 'Cancel',
          clickCallback: () => {
            this.radio.commands.execute('destroyModal');
          },
        },
      ],
    };

    if (this.model.has('id')) {
      this.modalView = new ModalView({
        modalConfig: deleteConfirmationModal,
      });

      this.radio.commands.execute('showModal', this.modalView);
    } else {
      this.model.destroy();
    }
  },

  /*
  *   Save & delete callbacks.
  */

  deleteSuccessCallback() {
    // Close this popup and destroy it.
    setTimeout(() => {
      this.radio.commands.execute('destroyModal');
    }, 500);

    // Destroy view.
    this.destroy();

    // Display snackbar:
    this.radio.commands.execute(
      'showSnackbar',
      new SnackbarView({
        containerClass: 'edit-page',
        snackbarClass: 'success',
        text: 'Successfully deleted additional item.',
        action: {
          promptText: 'Dismiss',
        },
      })  // eslint-disable-line comma-dangle
    );
  },

  deleteErrorCallback() {
    // Close this popup and destroy it:
    setTimeout(() => { this.radio.commands.execute('destroyModal'); }, 500);

    // Display snackbar:
    this.radio.commands.execute(
      'showSnackbar',
      new SnackbarView({
        containerClass: 'edit-page',
        snackbarClass: 'failure',
        text: 'Could not delete additional item. Try again later.',
      })  // eslint-disable-line comma-dangle
    );
  },
});
