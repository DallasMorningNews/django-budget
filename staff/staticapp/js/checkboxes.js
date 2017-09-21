import _ from 'lodash';


export default ($) => {
  const mousedowns = {};

  $('.checkbox').addClass('has-js');

  $('.checkbox.has-js').on('mousedown', (e) => {
    const $el = $(e.currentTarget).find('input');
    mousedowns[$el.attr('id')] = true;
  });

  $('.checkbox.has-js input').on('focus', (e) => {
    const $el = $(e.currentTarget);

    $el.siblings('.ripple').fadeIn(0);

    if (!_.has(mousedowns, $el.attr('id'))) {
      mousedowns[$el.attr('id')] = false;
    }

    const mouseIsDown = mousedowns[$el.attr('id')];

    if (mouseIsDown) {
      if (!$el.hasClass('clicked')) {
        $el.addClass('clicked');

        window.setTimeout(() => { $el.removeClass('clicked'); }, 600);
      }
    } else {
      $el.addClass('focused');
    }

    mousedowns[$el.attr('id')] = false;
  });

  $('.checkbox.has-js input').on('blur', (e) => {
    const $el = $(e.currentTarget);

    if ($el.hasClass('focused')) {
      $el.siblings('.ripple').fadeOut(450, () => {
        $el.removeClass('focused');
      });
    }
  });
};
