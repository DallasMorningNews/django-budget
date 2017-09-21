import $ from 'jquery';


import bindShowNav from './bind-show-nav';
import loadButtons from './buttons';
import PaginatedDOM from './paginated-dom';


$(document).ready(() => {
  $('.navbar .show-feed').bind('click', () => {
    $('aside').toggleClass('shown');
  });

  bindShowNav($);
  loadButtons($);

  const paginatedResults = new PaginatedDOM({
    containers: {
      pagedList: '.paginated-lists',
      topPageLinks: '.top-pagination-links',
      pageLinks: '.pagination-links',
    },
    recordsPerPage: 15,
    sourceList: '.raw-list',
    destListClass: 'tabular-list',
    initialPage: 1,
  });
  paginatedResults.initialize();
});
