export default ($) => {
  $('.navbar .show-nav').bind('click', (e) => {
    $(e.currentTarget).find('.header-burger').toggleClass('active');
    $('.collapsible-nav').toggleClass('shown');
  });
};
