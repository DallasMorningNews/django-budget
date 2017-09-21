import $ from 'jquery';
import _ from 'lodash';


const defaultConfig = {
  recordsPerPage: 15,
  sourceList2: '.raw-list',
  containers: {
    pagedList: '.paginated-lists',
    pageLinks: '',
  },
  destListClass: 'tabular-list',
  initialPage: 1,
};


export default class {
  constructor(rawConfig) {
    const config = _.defaultsDeep(rawConfig, defaultConfig);

    _.forOwn(config, (val, key) => { this[key] = val; });

    this.pages = _.chunk($(`${this.sourceList} li`), this.recordsPerPage);

    this.events = {
      pageLinkClick: (e) => { this.showPage($(e.currentTarget).data('page')); },
      prevTriggerClick: (e) => {
        if (!$(e.currentTarget).hasClass('disabled')) {
          const newPage = Math.max((this.currentPage - 1), 1);
          this.showPage(newPage);
        }
      },
      nextTriggerClick: (e) => {
        if (!$(e.currentTarget).hasClass('disabled')) {
          const newPage = Math.min((this.currentPage + 1), this.pages.length);
          this.showPage(newPage);
        }
      },
    };
  }

  initialize() {
    this.drawPages();
    if (_.has(this.containers, 'topPageLinks')) { this.drawTopPagination(); }
    this.drawPaginationLinks();
  }

  drawPages() {
    this.pages.forEach((page, i) => {
      const counter = i + 1;
      const shownClass = (counter === this.initialPage) ? 'shown' : '';

      const pageList = $(`<ul id="paginated-${counter}" class="${
        this.destListClass
      } ${
        shownClass
      }"></ul>`);
      page.forEach((item) => { pageList.append(item); });

      pageList.appendTo(this.containers.pagedList);
    });

    this.currentPage = this.initialPage;
  }

  drawTopPagination() {
    const topPageLinks = this.generatePagination();

    topPageLinks.appendTo(this.containers.topPageLinks);
  }

  drawPaginationLinks() {
    const pageLinks = this.generatePagination();

    pageLinks.appendTo(this.containers.pageLinks);

    this.updateLinkActiveness(this.currentPage);
  }

  generatePagination() {
    const pageLinks = $('<ul class="pagination-page-links"></ul>');

    const prevPageTrigger = $('<li class="prev-page">' +
        '<i class="material-icons">keyboard_arrow_left</i>' +
    '</li>');
    prevPageTrigger.on('click', this.events.prevTriggerClick);
    pageLinks.append(prevPageTrigger);

    _.range(1, (this.pages.length + 1)).forEach((pageNum) => {
      const pageLink = $(`<li class="page-nav" data-page="${pageNum}">${pageNum}</li>`);
      pageLink.on('click', this.events.pageLinkClick);
      pageLinks.append(pageLink);
    });

    const nextPageTrigger = $('<li class="next-page">' +
        '<i class="material-icons">keyboard_arrow_right</i>' +
    '</li>');
    nextPageTrigger.on('click', this.events.nextTriggerClick);
    pageLinks.append(nextPageTrigger);

    return pageLinks;
  }

  updateLinkActiveness(newPage) {
    const prevLink = $('.prev-page');
    const nextLink = $('.next-page');

    $('.page-nav').removeClass('active');
    $(`.page-nav[data-page="${newPage}"]`).addClass('active');

    if (newPage === 1) {
      if (!prevLink.hasClass('disabled')) { prevLink.addClass('disabled'); }
    } else if (prevLink.hasClass('disabled')) {
      prevLink.removeClass('disabled');
    }

    if (newPage === this.pages.length) {
      if (!nextLink.hasClass('disabled')) { nextLink.addClass('disabled'); }
    } else if (nextLink.hasClass('disabled')) {
      nextLink.removeClass('disabled');
    }
  }

  showPage(pageNumber) {
    let trimmedPageNumber = Math.min(pageNumber, (this.pages.length));
    trimmedPageNumber = Math.max(trimmedPageNumber, 1);

    if (trimmedPageNumber !== this.currentPage) {
      const newPage = $(`#paginated-${trimmedPageNumber}`);

      if (!newPage.hasClass('shown')) {
        $(`.${this.destListClass}`).removeClass('shown');
        newPage.addClass('shown');
        this.currentPage = trimmedPageNumber;

        this.updateLinkActiveness(trimmedPageNumber);
      }
    }
  }
}
