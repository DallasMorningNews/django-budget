import Backbone from 'backbone';
import _ from 'underscore';
import jQuery from 'jquery';
import _string_ from 'underscore.string';

import CSRFAwareModel from '../../common/csrf-aware-model';

import BudgetItem from '../models/item';
import BudgetItemCollection from '../collections/items';
import HeadlineCandidateCollection from '../collections/headline-candidates';

export default CSRFAwareModel.extend({
  // urlRoot: settings.apiEndpoints.package,
  urlRoot() {
    return this.radio.reqres.request('getSetting', 'apiEndpoints').package;
  },

  url() {
    if (this.has('id')) {
      const apiPostfix = this.radio.reqres.request('getSetting', 'apiPostfix');
      return this.urlRoot() + this.id + (apiPostfix || '/');
    }

    return this.urlRoot();
  },

  defaults: {
    additionalContent: [],

    headlineCandidates: [],
    headlineStatus: 'drafting',

    // printPlacements: null,
    // isPrintPlacementFinalized: false,
    // printRunDate: null,
    // publication: null,

    publishDate: [],
    publishDateResolution: null,
  },

  initialize() {
    this.radio = Backbone.Wreqr.radio.channel('global');

    this.moment = this.radio.reqres.request('getSetting', 'moment');

    this.moment.locale('en-us-apstyle');

    if (!_.has(this, 'primaryContentItem')) {
      this.primaryContentItem = new BudgetItem();
    }

    if (!_.has(this, 'additionalContentCollection')) {
      this.additionalContentCollection = new BudgetItemCollection();
    }

    if (!_.has(this, 'headlineCandidateCollection')) {
      this.headlineCandidateCollection = new HeadlineCandidateCollection();
    }
  },

  loadInitial() {
    const initialLoadPromise = new jQuery.Deferred();

    // Create four empty headline objects in this package's
    // headlineCandidatesCollection property.
    this.headlineCandidateCollection.add([{}, {}, {}, {}]);

    initialLoadPromise.resolve();

    return initialLoadPromise;
  },

  load() {
    const packageRequest = this.fetch({
      xhrFields: {
        withCredentials: true,
      },
    });
    return packageRequest;
  },

  parse(data, config) {
    const deepLoad = (
        _.isBoolean(config.deepLoad)
    ) ? config.deepLoad : true;

    const muteConsole = (
        _.isBoolean(config.muteConsole)
    ) ? config.muteConsole : false;

    let relatedItemCallback;

    this.initialHeadlineStatus = data.headlineStatus;

    if (_.has(config, 'collection')) {
      // If this model is being instantiated as part of a
      // 'PackageCollection.fetch()' call, create the additional
      // content and headline collections here.

      if (_.isUndefined(this.primaryContentItem)) {
        this.primaryContentItem = new BudgetItem();
      }

      if (_.isUndefined(this.additionalContentCollection)) {
        this.additionalContentCollection = new BudgetItemCollection();
      }

      if (_.isUndefined(this.headlineCandidateCollection)) {
        this.headlineCandidateCollection = new HeadlineCandidateCollection();
      }
    }

    if (!muteConsole) {
      // Log that the package fetch was successful.
      console.log(  // eslint-disable-line no-console
        // eslint-disable-next-line comma-dangle
        `Fetched package with ID '${data.id}'.`
      );
    }

    if (deepLoad) {
      relatedItemCallback = this.loadRelatedItems(data, { muteConsole });

      relatedItemCallback.done(() => { this.trigger('packageLoaded'); });
    } else {
      this.trigger('packageLoaded');
    }

    return data;
  },

  bindPrimaryItem() {
    this.primaryContentItem.on('change', () => {
      _.each(
          _.keys(this.primaryContentItem.changedAttributes()),
          (changedKey) => {
            this.trigger(`change:primaryContent.${changedKey}`);
          }  // eslint-disable-line comma-dangle
      );
    });
  },

  loadRelatedItems(data, options) {
    const itemRequestPromise = new jQuery.Deferred();
    const allAdditionalRequests = [itemRequestPromise];
    const relatedItemPromise = new jQuery.Deferred();
    const muteConsole = (
        _.isBoolean(options.muteConsole)
    ) ? options.muteConsole : false;

    let headlinesRequest;

    // Retrieve the additional item collection's starting values from
    // the API.
    const itemsRequest = this.additionalContentCollection.fetch({
      xhrFields: {
        withCredentials: true,
      },
      data: {
        id__in: `${data.primaryContent},${data.additionalContent.join(',')}`,
      },
      silent: true,
    });

    // Once primary and additional items are loaded, incorporate
    // their attributes into the package model.
    itemsRequest.done(() => {
      const primaryItem = this.additionalContentCollection.get(data.primaryContent);
      const additionalText = (
        !_.isEmpty(data.additionalContent)
      ) ? `, ${data.additionalContent.join("', '")}` : '';

      if (!muteConsole) {
        console.log(  // eslint-disable-line no-console
          // eslint-disable-next-line comma-dangle
          `Fetched items with IDs '${primaryItem.id}' ${additionalText}.`
        );
      }

      this.primaryContentItem = primaryItem;
      this.additionalContentCollection.remove(primaryItem);
      this.additionalContentCollection.trigger('reset');

      this.bindPrimaryItem();

      // Evaluate whether there's a suffix on the primary content
      // item's slug.
      // const entireSlug = this.get('slug');
      // const generatedSlug = this.generatePackageTitle();

      // if (
      //   (entireSlug !== generatedSlug) &&
      //   (_string_.startsWith(entireSlug, generatedSlug))
      // ) {
      //   this.primaryContentItem.set(
      //     'slugSuffix',
      //     // eslint-disable-next-line comma-dangle
      //     _string_.strRight(entireSlug, generatedSlug)
      //   );
      // }

      return '';
    }).done(() => { itemRequestPromise.resolve(); });

    // If the item request fails, pass back the error.
    itemsRequest.fail(() => {
      this.trigger('packageLoadFailed', 'items');
    });

    // Load headlines' information.
    this.headlineCandidateCollection.on('change', () => {
      this.trigger('change:headlineCandidates');
    });

    if (!_.isEmpty(data.headlineCandidates)) {
      // Instantiate and retrieve data for a collection
      // containing each headline in this package.
      headlinesRequest = this.headlineCandidateCollection.fetch({
        xhrFields: { withCredentials: true },
        data: { id__in: data.headlineCandidates.join(',') },
      });
    } else {
      headlinesRequest = new jQuery.Deferred();
      headlinesRequest.resolve([], {}, {});
    }

    // Add this request to the list of simultaneous
    // additional-information queries.
    allAdditionalRequests.push(headlinesRequest);

    // Once the headlines have been loaded, update the value of
    // the package model's headline candidates.
    headlinesRequest.done(() => {
      if (!_.isEmpty(data.headlineCandidates)) {
        if (!muteConsole) {
          // eslint-disable-next-line no-console
          console.log(`Fetched headlines with IDs '${
            this.headlineCandidateCollection.pluck('id').join("', '")
          }'.`);
        }
      }

      _.each(_.range(4 - this.headlineCandidateCollection.length), () => {
        this.headlineCandidateCollection.add([{}]);
      });
    });

    // If the headline request fails, pass back the error.
    headlinesRequest.fail(() => {
      this.trigger('packageLoadFailed', 'headlines');
    });

    // When all additional queries have returned successfully, pass
    // a successful resolution the underlying Deferred promise.
    jQuery.when(...allAdditionalRequests).done(() => {
      relatedItemPromise.resolve();
    });

    return relatedItemPromise;
  },

  facetFilters: {
    person: (pkg, stringToMatch) => {
      // TODO: Update this to reflect 'additionalContent' being a collection.
      const allPeople = _.union(
          _.pluck(pkg.primaryContentItem.get('editors'), 'email'),
          _.pluck(pkg.primaryContentItem.get('authors'), 'email'),
          _.pluck(
            _.flatten(pkg.additionalContentCollection.pluck('editors')),
            'email'  // eslint-disable-line comma-dangle
          ),
          _.pluck(
            _.flatten(pkg.additionalContentCollection.pluck('authors')),
            'email'  // eslint-disable-line comma-dangle
          )  // eslint-disable-line comma-dangle
        );

      return _.contains(allPeople, stringToMatch);
    },
    hub: (pkg, stringToMatch) => pkg.get('hub') === stringToMatch,
    vertical: (pkg, stringToMatch, extraContext) => {
      const thisVerticalSlug = extraContext.hubs.findWhere({
        slug: pkg.get('hub'),
      }).get('vertical').slug;

      return thisVerticalSlug === stringToMatch;
    },
    fullText: (pkg, stringToMatch, extraContext) => _.contains(
      _.pluck(extraContext.fullTextSearches[stringToMatch], 'ref'),
      pkg.get('id')  // eslint-disable-line comma-dangle
    ),
  },

  filterUsingAnd(queryTerms, extraContext) {
    let allFacetsMatch = true;

    queryTerms.each((term) => {
      const termType = term.get('type');
      const facetMatches = _.chain(this.facetFilters)
                            .keys()
                            .contains(termType)
                            .value();
      const extraMatches = _.chain(extraContext.extraQueryFunctions)
                            .keys()
                            .contains(termType)
                            .value();
      let queryFunction;

      if (facetMatches) {
        queryFunction = this.facetFilters[termType];
      } else if (extraMatches) {
        queryFunction = extraContext.extraQueryFunctions[termType];
      } else {
        queryFunction = () => {
          console.log(  // eslint-disable-line no-console
            // eslint-disable-next-line comma-dangle
            `Couldn't find filter for query term: ${termType}`
          );
          return false;
        };
      }

      if (
        !queryFunction(
          this,
          term.get('value'),
          // eslint-disable-next-line comma-dangle
          _.omit(extraContext, 'extraQueryFunctions')
        )
      ) {
        allFacetsMatch = false;
      }
    });

    return allFacetsMatch;
  },

  filterUsingOr(searchTerms, extraContext) {
    let anyFacetsMatch = false;

    if (searchTerms.length === 0) {
      // Show everything if there are no search terms.
      return true;
    }

    searchTerms.each((term) => {
      if (
        this.facetFilters[term.get('type')](
          this,
          term.get('value'),
          extraContext  // eslint-disable-line comma-dangle
        )
      ) {
        anyFacetsMatch = true;
      }
    });

    return anyFacetsMatch;
  },

  generateSlugHub() {
    return (this.get('hub')) ? this.get('hub') : 'hub';
  },

  generateSlugDate() {
    const resolution = this.get('publishDateResolution');

    if (!_.isUndefined(resolution)) {
      if (this.has('publishDate') && !_.isEmpty(this.get('publishDate'))) {
        const defaultTimezone = this.radio.reqres.request(
          'getSetting',
          'defaultTimezone'  // eslint-disable-line comma-dangle
        );

        const latestDate = this.moment(this.get('publishDate')[1])
                  .tz(defaultTimezone).subtract({ seconds: 1 });

        // If this is a month or a week-resolution date, use the
        // earliest moment of the time period to generate a dayless
        // slug value.

        // This way, weeks that span two months will resolve to the
        // earlier month for consistency.
        if (_.contains(['m', 'w'], resolution)) {
          const intervalMap = {
            m: 'month',
            w: 'week',
          };

          return latestDate.startOf(intervalMap[resolution]).format('MM--YY');
        }

        return latestDate.format('MMDDYY');
      }
    }

    return 'date';
  },

  generatePackageTitle() {
    let rawKey;

    if (!_.isUndefined(this.primaryContentItem)) {
      rawKey = this.get('slugKey');
    }

    return [
      this.generateSlugHub(),
      ((rawKey !== '') && (!_.isUndefined(rawKey))) ? rawKey : 'keyword',
      this.generateSlugDate(),
    ].join('.');
  },

  updatePublishDate(newResolution, newPublishDate) {
    const resolution = this.get('publishDateResolution');
    const resolutionConfig = this.radio.reqres.request(
      'getSetting',
      'dateGranularities'  // eslint-disable-line comma-dangle
    )[resolution];
    // let roughDate;
    let start = null;
    let end = null;

    if (newResolution === resolution) {
      if (!_.isNull(newPublishDate)) {
        const defaultTZ = this.radio.reqres.request('getSetting', 'defaultTimezone');
        const resolutionFormat = resolutionConfig.format.join(' ');

        // if (resolution === 't') {
        //   roughDate = this.moment(newPublishDate, resolutionFormat);
        // } else {
        //   roughDate = this.moment.tz(newPublishDate, resolutionFormat, defaultTZ);
        // }

        const roughDate = this.moment.tz(newPublishDate, resolutionFormat, defaultTZ);

        end = roughDate.clone().endOf(resolutionConfig.rounding);
        start = end.clone().startOf(resolutionConfig.rounding);

        end.add({ milliseconds: 1 });
      }

      this.set(
        {
          publishDate: (
            !_.isNull(end)
          ) ? [start.toISOString(), end.toISOString()] : [],
        },
        { silent: true }  // eslint-disable-line comma-dangle
      );
    }
  },

  generateFormattedPublishDate(resolutionRaw, endTimestampRaw) {
    const resolution = resolutionRaw || this.get('publishDateResolution');
    const endTimestamp = endTimestampRaw || this.get('publishDate')[1];
    const resolutionConfig = this.radio.reqres.request(
      'getSetting',
      'dateGranularities'  // eslint-disable-line comma-dangle
    )[resolution];
    let endDate;

    if (resolution === 't') {
      endDate = this.moment(endTimestamp);
    } else {
      endDate = this.moment.tz(
        endTimestamp,
        // eslint-disable-next-line comma-dangle
        this.radio.reqres.request('getSetting', 'defaultTimezone')
      );
    }

    endDate.subtract({ seconds: 1 });

    if (_.contains(['m', 'w', 'd', 't'], resolution)) {
      if (resolution === 'w') { endDate = endDate.startOf('week'); }

      return _.map(
        resolutionConfig.format,
        // eslint-disable-next-line comma-dangle
        formatString => endDate.format(formatString)
      );
    }

    return ['Invalid date'];
  },

  // generateFormattedRunDate(formatString, runDateValue) {
  //   const value = (
  //       !_.isUndefined(runDateValue)
  //   ) ? runDateValue : this.get('printRunDate');
  //
  //   const defaultTimezone = this.radio.reqres.request(
  //     'getSetting',
  //     'defaultTimezone'  // eslint-disable-line comma-dangle
  //   );
  //
  //   return this.moment(value, formatString)
  //                       .tz(defaultTimezone)
  //                       .toDate();
  // },

  parseRunDate(formatString, runDate) {
    const defaultTimezone = this.radio.reqres.request(
      'getSetting',
      'defaultTimezone'  // eslint-disable-line comma-dangle
    );

    const runMoment = this.moment(runDate).tz(defaultTimezone);

    return runMoment.format(formatString);
  },
});
