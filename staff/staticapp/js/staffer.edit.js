import $ from 'jquery';
import _ from 'lodash';


import bindShowNav from './bind-show-nav';
import loadButtons from './buttons';
import loadCheckboxes from './checkboxes';
import loadSnackbars from './snackbars';


window.$ = $;
window._ = _;


const updateEditForm = (newData) => {
  const editForm = $('.form-holder form');
  _.forOwn(newData.staffer, (value, key) => {
    editForm.find(`#id_${key}`).val(value);
  });
};


$(document).ready(() => {
  bindShowNav($);
  loadButtons($);
  loadCheckboxes($);

  const snackbars = loadSnackbars($);

  $('#snackbars').addClass('edit-bar-adjust');

  $('#rescrape-slack').on('click', (e) => {
    e.preventDefault();

    const formHolder = $('.form-holder');
    formHolder.addClass('loading');

    const dataURL = $(e.currentTarget).attr('data-url');

    setTimeout(() => {
      const rescrape = $.ajax({ dataType: 'json', url: dataURL });

      rescrape.done((data) => {
        if (
          (typeof data.status !== 'undefined') &&
          (data.status === 200)
        ) {
          updateEditForm(data);

          formHolder.removeClass('loading');

          setTimeout(() => {
            snackbars[0].show({
              message: 'Success! Press SAVE to store these details permanently.',
              actionText: 'DISMISS',
              actionHandler: () => {},
            });
          }, 750);
        } else {
          console.error('Slack user not found.');

          formHolder.removeClass('loading');

          snackbars[0].show({
            message: 'Couldn\'t find a Slack user with that email address.',
            actionText: 'DISMISS',
            actionHandler: () => {},
          });
        }
      });

      rescrape.fail((resp, textStatus, errorThrown) => {
        console.error(resp, textStatus, errorThrown);

        formHolder.removeClass('loading');

        snackbars[0].show({
          message: 'Couldn\'t connect to Slack.',
          actionText: 'DISMISS',
          actionHandler: () => {},
        });
      });
    }, 2000);
  });
});
