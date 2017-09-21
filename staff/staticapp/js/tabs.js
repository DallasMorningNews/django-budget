import { TabBar } from './tab-bar/index';

export default ($) => {
  const $tabBarEl = $('.tab-bar');
  const tabBars = $tabBarEl.map(i => new TabBar($tabBarEl[i]));

  $('.tab-bar').on('Tab:selected', (event) => {
    const $rootEl = $(event.detail.tab.rootEl);

    if ($rootEl.hasClass('has-js')) {
      const newActiveArea = $(`#${$rootEl.attr('data-tab')}`);

      if (!newActiveArea.hasClass('shown')) {
        $('.tabbed-area.shown').removeClass('shown');
        newActiveArea.addClass('shown');
      }
    }
  });

  return tabBars;
};
