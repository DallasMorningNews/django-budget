import Backbone from 'backbone';
import lunr from 'lunr';
import _ from 'underscore';

import Package from '../models/package';

export default Backbone.Collection.extend({
  // A boolean to track whether we've populated our collection with
  // packages for the first time
  model: Package,

  events: {
    // 'change:pinned': 'sort'
  },

  initialize() {
    this.once('sync', () => { this.queryFiltered = this.filter(); });
    this.radio = Backbone.Wreqr.radio.channel('global');
  },

  cleanSlug(rawSlug) {
    return rawSlug
                .replace(/\./g, ' ')
                .replace(/-/g, ' ')
                .replace(/_/g, ' ');
  },

  combineAdditionalItemValues(model, field, fieldFormat) {
    return _.chain(
          // eslint-disable-next-line comma-dangle
          model.additionalContentCollection.pluck(field)
        ).reduce((memo, value) => {
          const finalValue = (
            !_.isUndefined(fieldFormat)
          ) ? fieldFormat(value) : value;

          return `${memo} ${finalValue}`;
        })
        .value();
  },

  rebuildIndex() {
    this.fullTextIndex = lunr(() => {
      this.field('relatedSlugs', { boost: 5 });
      this.field('relatedSlugsCleaned', { boost: 10 });
      this.field('relatedBudgetLines', { boost: 15 });
      this.field('primarySlug', { boost: 20 });
      this.field('primarySlugCleaned', { boost: 25 });
      this.field('primaryBudgetLine', { boost: 30 });
      this.ref('id');
    });

    this.each((pkg) => {
      this.fullTextIndex.add({
        id: pkg.get('id'),
        relatedSlugs: this.combineAdditionalItemValues(
          pkg,
          'slug'  // eslint-disable-line comma-dangle
        ),
        relatedSlugsCleaned: this.combineAdditionalItemValues(
          pkg,
          'slug',
          this.cleanSlug  // eslint-disable-line comma-dangle
        ),
        relatedBudgetLines: this.combineAdditionalItemValues(
          pkg,
          'budgetLine'  // eslint-disable-line comma-dangle
        ),
        primarySlug: pkg.get('slug'),
        primarySlugCleaned: this.cleanSlug(pkg.get('slug')),
        primaryBudgetLine: pkg.primaryContentItem.get('budgetLine'),
      });
    });
  },

  filterAnd(queryTerms, extraContext) {
    this.queryFiltered = this.filter(
      // eslint-disable-next-line comma-dangle
      pkg => pkg.filterUsingAnd(queryTerms, extraContext)
    );

    this.trigger('updateQuery', this.queryFiltered);
  },

  filterOr(searchTerms, extraContext) {
    this.queryFiltered = this.filter(
      // eslint-disable-next-line comma-dangle
      pkg => pkg.filterUsingOr(searchTerms, extraContext)
    );

    this.trigger('updateQuery', this.queryFiltered);
  },

  linkPlacements(placementsCollection) {
    this.forEach((packageObj) => {
      // eslint-disable-next-line no-param-reassign
      packageObj.placements = placementsCollection.where({
        package: packageObj.id,
      }).map(placementObj => placementObj.toJSON());
    });

    return this;
  },

  /**
   * Sort the collection by pinned status first (pinned on top) then by
   * created timestamp in reverse chronological order
   */
  // BBTODO: Change this to reflect the loss of timestamps.
  comparator(model) {
    const moment = this.radio.reqres.request('getSetting', 'moment');
    return moment(model.get('publishDate')[1]).unix();
  },

  parse(response) {
    return response.results;
  },
});
