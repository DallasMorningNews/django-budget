import 'underscore.string';
import _ from 'underscore';

// import deline from '../../../vendored/deline';

import PackageItemView from './package-base';

export default PackageItemView.extend({
  template: 'budget/package-item-print',

  ui: {
    packageSheetOuter: '.package-sheet',
    minimalCard: '.package-sheet .minimal-card',
    rippleButton: '.package-sheet .material-button',
    readinessIndicator: '.package-sheet .minimal-card .indicator-inner',
    editPackageTrigger: '.package-sheet .edit-package',
    notesModalTrigger: '.package-sheet .view-notes',
    subscriptionModalTrigger: '.package-sheet .subscribe',
    printInfoModalTrigger: '.package-sheet .print-info',
    webInfoModalTrigger: '.package-sheet .web-info',
  },

  events: {
    'click @ui.minimalCard': 'expandPackageSheet',
    'mousedown @ui.rippleButton': 'addButtonClickedClass',
    'click @ui.readinessIndicator': 'onReadinessIndicatorClick',
    'click @ui.editPackageTrigger': 'showPackageEdit',
    'click @ui.notesModalTrigger': 'showNotesModal',
    'click @ui.subscriptionModalTrigger': 'showSubscriptionModal',
    'click @ui.printInfoModalTrigger': 'showPrintInfoModal',
    'click @ui.webInfoModalTrigger': 'showWebInfoModal',
  },

  hasPrimary: false,

  initEnd() {
    this.primaryIsExpanded = false;

    const moment = this.radio.reqres.request('getSetting', 'moment');
    moment.locale('en-us-apstyle');
  },

  serializeData() {
    const templateContext = {};
    const packageObj = this.model.toJSON();
    const packageHub = this.options.hubConfigs.findWhere({ slug: packageObj.hub });
    const additionals = this.model.additionalContentCollection;
    // const moment = this.radio.reqres.request('getSetting', 'moment');
    // const defaultTimezone = this.radio.reqres.request(
    //   'getSetting',
    //   'defaultTimezone'  // eslint-disable-line comma-dangle
    // );

    // const printDateStart = moment(this.model.get('printRunDate')[0], 'YYYY-MM-DD')
    //         .tz(defaultTimezone);
    // const printDateEnd = moment(this.model.get('printRunDate')[1], 'YYYY-MM-DD')
    //         .tz(defaultTimezone).subtract({ days: 1 });

    // Template context, in order of appearance:

    // Edit-view link base.
    const navLinks = this.radio.reqres.request('getSetting', 'navigationLinks');
    const homeView = _.findWhere(navLinks, { name: 'Home' });
    templateContext.homeViewLink = homeView.destination;

    // Has-primary item (used to show or hide packages).
    templateContext.hasPrimary = this.hasPrimary;

    // Expanded (or not) package state.
    templateContext.primaryIsExpanded = this.primaryIsExpanded;

    // Underlying model.
    templateContext.packageObj = _.clone(packageObj);

    templateContext.packageObj.primaryContent = _.clone(
      this.model.primaryContentItem.toJSON()  // eslint-disable-line comma-dangle
    );

    // Slug date.
    templateContext.packageObj.slugDate = packageObj.slugDate;

    // Is-published indicator.
    templateContext.packageHasURL = !_.isNull(packageObj.publishedUrl);

    // Hub color and vertical slug.
    if (!_.isUndefined(packageHub)) {
      templateContext.hubDotColor = packageHub.get('color');
      templateContext.verticalSlug = packageHub.get('vertical').slug;
      templateContext.hubName = packageHub.get('name');
      templateContext.verticalName = packageHub.get('vertical').name;
    }

    // // Print placement lists.
    // templateContext.formattedPrintPlacements = _.chain(this.model.get('printSection'))
    //     .map((sectionID) => {
    //       const matchingSection = _.findWhere(
    //         this.options.allSections,
    //         { id: sectionID }  // eslint-disable-line comma-dangle
    //       );
    //
    //       if (!_.isUndefined(matchingSection)) {
    //         return {
    //           name: matchingSection.name,
    //           priority: matchingSection.priority,
    //         };
    //       }
    //
    //       return null;
    //     })
    //     .compact()
    //     .sortBy('priority')
    //     .pluck('name')
    //     .value();
    //
    // // Formatted print run date.
    // if (printDateStart.year() === printDateEnd.year()) {
    //   if (printDateStart.month() === printDateEnd.month()) {
    //     if (printDateStart.date() === printDateEnd.date()) {
    //       templateContext.formattedPrintRunDate = printDateStart.format(
    //         'MMM D, YYYY'  // eslint-disable-line comma-dangle
    //       );
    //     } else {
    //       templateContext.formattedPrintRunDate = deline`${
    //         printDateStart.format('MMM D')
    //       } - ${
    //         printDateEnd.format('D, YYYY')
    //       }`;
    //     }
    //   } else {
    //     templateContext.formattedPrintRunDate = deline`${
    //       printDateStart.format('MMM D')
    //     } - ${
    //       printDateEnd.format('MMM D, YYYY')
    //     }`;
    //   }
    // } else {
    //   templateContext.formattedPrintRunDate = deline`${
    //     printDateStart.format('MMM D, YYYY')
    //   } - ${
    //     printDateEnd.format('MMM D, YYYY')
    //   }`;
    // }

    // Editor and author lists.
    templateContext.allPeople = _.union(
        _.pluck(this.model.primaryContentItem.get('editors'), 'email'),
        _.pluck(this.model.primaryContentItem.get('authors'), 'email'),
        _.pluck(_.flatten(additionals.pluck('editors')), 'email'),
        // eslint-disable-next-line comma-dangle
        _.pluck(_.flatten(additionals.pluck('authors')), 'email')
    ).join(' ');

    // Leading headline (if voting is open),
    // or winning headline if one was selected.
    if (packageObj.headlineCandidates.length > 0) {
      templateContext.leadingHeadline = _.chain(packageObj.headlineCandidates)
        .sortBy('votes')
        .last()
        .value()
        .text;
    }

    const contentTypes = this.radio.reqres.request('getSetting', 'contentTypes');

    // Verbose name and other information for primary content type icon.
    templateContext.primaryTypeMeta = contentTypes[
        this.model.primaryContentItem.get('type')
    ];

    // Fallback function for comma-formatted length (1 of 2).
    // if (_.has(packageObj.primaryContent, 'length')) {
    //     templateContext.primaryLengthFormatted = _string_.numberFormat(
    //         packageObj.primaryContent.length
    //     );
    // }

    // List of additional content item types and icons
    // (Needed for "Includes [other icons]" list).
    templateContext.additionalItemTypes = _.map(
      additionals.pluck('type'),
      (typeSlug) => {
        const typeObj = _.clone(contentTypes[typeSlug]);
        typeObj.slug = typeSlug;
        return typeObj;
      }  // eslint-disable-line comma-dangle
    );

    // List of additional content items, in an object with
    // on-model ('model') and 'typemeta' attributes.
    templateContext.additionalWithTypeMetas = additionals.map((item) => {
      const additionalConfig = {
        model: item.toJSON(),
        typeMeta: contentTypes[item.get('type')],
      };

      return additionalConfig;
    });

    return templateContext;
  },

  onRenderCallback() {
    this.ui.rippleButton.addClass('click-init');
  },
});
