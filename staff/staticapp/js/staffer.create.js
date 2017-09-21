import $ from 'jquery';
import _ from 'lodash';
import isEmail from 'validator/lib/isEmail';


import bindShowNav from './bind-show-nav';
import loadButtons from './buttons';
import loadCheckboxes from './checkboxes';
import loadSnackbars from './snackbars';
import loadTabs from './tabs';


window.$ = $;
window._ = _;

let snackbars = null;


const tabSlugSnackbarMap = {
  'manual-entry': 'edit-bar-adjust',
  'slack-entry': '',
};


const getFormValues = ($formEl) => {
  const formPayload = $formEl.serializeArray();

  return _.chain(formPayload)
              .map(e => [_.camelCase(e.name), e.value])
              .fromPairs()
            .value();
};


const updateEditForm = (newData) => {
  const editForm = $('#manual-entry');
  _.forOwn(newData.staffer, (value, key) => {
    editForm.find(`#id_${key}`).val(value);
  });
};

const switchActiveTab = (barEl, newTabSlug) => {
  const newActiveTab = _.find(
    barEl.tabs,
    // eslint-disable-next-line comma-dangle
    t => t.rootEl.getAttribute('data-tab') === newTabSlug
  );
  newActiveTab.ripple.activate();

  setTimeout(() => {
    newActiveTab.emit('Tab:selected', { tab: newActiveTab }, true);
  }, 100);
  setTimeout(() => { newActiveTab.ripple.deactivate(); }, 450);
};


const showSuccessMessage = () => {
  snackbars[0].show({
    message: 'Success! Press SAVE to store these details permanently.',
    actionText: 'DISMISS',
    actionHandler: () => {},
  });
  setTimeout(() => { snackbars[0].destroy(); }, 3000);
};

const resetSlackInput = (event) => {
  const formGroup = $(event.currentTarget);
  if (formGroup.closest('.form-group').hasClass('has-error')) {
    formGroup.closest('.form-group').removeClass('has-error');
  }
  formGroup.closest('.form-group').find('.help-block').text('');

  formGroup.off('input', resetSlackInput);
};


const showScraperError = (errorText) => {
  const scraperForm = $('#slack-entry');
  const formGroup = scraperForm.find('.inline-form .form-group');

  formGroup.addClass('has-error');
  formGroup.find('.help-block').text(errorText);

  formGroup.find('input').on('input', resetSlackInput);

  scraperForm.removeClass('loading');
};


const getStafferProfile = (dataURL, tabBar) => {
  const rescrape = $.ajax({ dataType: 'json', url: dataURL });

  rescrape.done((data) => {
    if (
      (typeof data.status !== 'undefined') &&
      (data.status === 200)
    ) {
      updateEditForm(data);

      setTimeout(() => {
        switchActiveTab(tabBar, 'manual-entry');

        setTimeout(() => {
          showSuccessMessage();

          const slackEntryForm = $('#slack-entry');
          slackEntryForm.removeClass('loading');

          const slackEntryGroup = slackEntryForm.find('.inline-form .form-group');
          slackEntryGroup.find('input').on('input', resetSlackInput);
          slackEntryGroup.find('input').attr('disabled', 'disabled');
          slackEntryGroup.find('.btn').attr('disabled', 'disabled');
          slackEntryGroup.find('.help-block').html(
            // eslint-disable-next-line comma-dangle
            '<i class="material-icons">done</i> Successfully retrieved Slack profile.'
          );
        }, 750);
      }, 375);
    } else {
      console.error('Slack user not found.');
      showScraperError('No Slack user found with that email address.');

      setTimeout(() => {
        snackbars[0].show({
          message: 'Please verify the email address you entered.',
          actionText: 'DISMISS',
          actionHandler: () => {},
        });
        setTimeout(() => { snackbars[0].destroy(); }, 3000);
      }, 825);
    }
  });

  rescrape.fail((resp, textStatus, errorThrown) => {
    console.error(resp, textStatus, errorThrown);
    showScraperError('Could not connect to Slack.');
  });
};


$(document).ready(() => {
  bindShowNav($);

  loadButtons($);
  loadCheckboxes($);

  snackbars = loadSnackbars($);
  const tabBars = loadTabs($);

  $('#id_slack_email').focus();

  $('.tab-bar').on('Tab:selected', (event) => {
    const $snackbarEl = $('#snackbars');

    const tabSlug = event.detail.tab.rootEl.getAttribute('data-tab');

    const classesToRemove = _.chain(tabSlugSnackbarMap)
                                  .omit(tabSlug)
                                  .values()
                                .value();

    classesToRemove.forEach((klass) => {
      if ((klass !== '') && ($snackbarEl.hasClass(klass))) {
        $snackbarEl.removeClass(klass);
      }
    });

    const addedKlass = tabSlugSnackbarMap[tabSlug];

    if ((addedKlass !== '') && (!$snackbarEl.hasClass(addedKlass))) {
      $snackbarEl.addClass(addedKlass);
    }
  });

  $('#slack-entry').submit((event) => {
    event.preventDefault();

    const $formEl = $(event.currentTarget);

    const formValues = getFormValues($formEl);

    if (_.has(formValues, 'slackEmail') && (formValues.slackEmail !== '')) {
      if (isEmail(formValues.slackEmail)) {
        const $focusedEl = $(':focus:not(.btn)');

        if ($focusedEl.length > 0) {
          $focusedEl.blur();
        }

        $formEl.addClass('loading');

        const placeholderEmail = $formEl.attr('data-placeholder-email');
        const baseScraperURL = $formEl.attr('data-scraper-url');

        const swapPlaceholder = new RegExp(`${placeholderEmail}/$`);
        let actualURL = baseScraperURL.replace(swapPlaceholder, formValues.slackEmail);

        if (_.last(actualURL) !== '/') { actualURL = `${actualURL}/`; }

        setTimeout(() => { getStafferProfile(actualURL, tabBars[0]); }, 2000);
      } else {
        showScraperError('Please enter a valid email address.');
      }
    }
  });
});
