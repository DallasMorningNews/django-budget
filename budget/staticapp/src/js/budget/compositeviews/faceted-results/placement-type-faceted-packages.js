import Backbone from 'backbone';
import Mn from 'backbone.marionette';
import _ from 'underscore';

import PackageItemPrintView from '../../itemviews/packages/package-print-info';

export default Mn.CompositeView.extend({
  template: 'budget/placement-type-faceted-packages-list',

  childView: PackageItemPrintView,

  childViewOptions() {  // Args: model, index
    return {
      // currentTypes: this.options.extraContext.currentTypes,
      hubConfigs: this.options.extraContext.hubConfigs,
      placementDestinations: this.options.extraContext.placementDestinations,
      typeSlugsToNames: this.options.extraContext.currentTypes
                              .reduce((acc, typeObj) => Object.assign({}, acc, {
                                [typeObj.slug]: typeObj.name,
                              }), {}),
      // placementType: this.placementType,
    };
  },

  childViewContainer: '.packages',

  initialize() {
    this.radio = Backbone.Wreqr.radio.channel('global');

    this.moment = this.radio.reqres.request('getSetting', 'moment');

    this.placementType = this.options.facetConfig.typeConfig;
    this.collection = this.options.facetConfig.placedItems;
    this.poller = this.options.poller;

    this.collection.comparator = (a, b) => {
      // Sort by the following fields:
      //   *   Page number, low to high (if different)
      //   *   Start of possible run dates, earliest to latest (if different)
      //   *   End of possible run dates, earliest to latest (if different)
      //   *   Case-insensitive slug key, forward alphabetically (if different)
      //   *   Package ID (as final tiebreaker; stand-in for date created)
      const pageA = (a.placements[0].pageNumber === null) ? 1000 : a.placements[0].pageNumber;
      const pageB = (b.placements[0].pageNumber === null) ? 1000 : b.placements[0].pageNumber;

      if (pageA < pageB) return -1;
      if (pageA > pageB) return 1;

      const startTimeA = this.moment(a.placements[0].runDate[0], 'YYYY-MM-DD').unix();
      const startTimeB = this.moment(b.placements[0].runDate[0], 'YYYY-MM-DD').unix();

      if (startTimeA < startTimeB) return -1;
      if (startTimeA > startTimeB) return 1;

      const endTimeA = this.moment(a.placements[0].runDate[1], 'YYYY-MM-DD').unix();
      const endTimeB = this.moment(b.placements[0].runDate[1], 'YYYY-MM-DD').unix();

      if (endTimeA < endTimeB) return -1;
      if (endTimeA > endTimeB) return 1;

      const slugA = a.get('slugKey').toLowerCase();
      const slugB = b.get('slugKey').toLowerCase();

      if (slugA < slugB) return -1;
      if (slugA > slugB) return 1;

      return a.id - b.id;
    };

    this.collection.sort();

    this.collection.on('setPrimary', this.onCollectionChange.bind(this));

    this.collection.on('reset', this.onCollectionChange.bind(this));
  },

  serializeData() {
    return { placementType: this.placementType };
  },

  onRender() {
    const parentEl = this.$el;

    if (this.collection.length === 0) {
      if (parentEl.hasClass('enabled-facet')) {
        parentEl.removeClass('enabled-facet');
      }
    } else if (!parentEl.hasClass('enabled-facet')) {
      parentEl.addClass('enabled-facet');
    }
  },

  onCollectionChange(model) {
    if (!_.isUndefined(this.children.findByModelCid(model.cid))) {
      this.renderPackagePrimary(this.children.findByModelCid(model.cid));
    }
  },

  renderPackagePrimary(childView) {
    if ((!childView.model.isNew()) && (!childView.model.primaryContentItem.isNew())) {
      if (!childView.hasPrimary) {
        if (!childView.$el.find('.package-sheet').hasClass('has-primary')) {
          setTimeout(() => {
            childView.hasPrimary = true;  // eslint-disable-line no-param-reassign
            childView.$el.find('.package-sheet').addClass('has-primary');
          }, 600);
        }
      }
    }
  },
});
