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
    this.placementType = this.options.facetConfig.typeConfig;
    this.collection = this.options.facetConfig.placedItems;
    this.poller = this.options.poller;

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
