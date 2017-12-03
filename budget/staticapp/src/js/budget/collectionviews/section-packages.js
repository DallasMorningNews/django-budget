import Mn from 'backbone.marionette';
import _ from 'underscore';

import PackageItemPrintView from '../itemviews/packages/package-print-info';

export default Mn.CollectionView.extend({
  template: 'budget/print-section-packages-list',

  childView: PackageItemPrintView,

  childViewOptions(model) {  // Args: model, index
    const matchingPlacements = this.options.placements
                                      .where({ package: model.id })
                                      .map(i => i.toJSON());

    return {
      allSections: this.options.allSections,
      currentSection: this.options.sectionConfig,
      hubConfigs: this.options.hubConfigs,
      placementDestinations: this.options.placementDestinations,
      placementList: matchingPlacements,
    };
  },

  initialize() {
    this.poller = this.options.poller;
    this.collection.on('setPrimary', this.onCollectionChange.bind(this));

    this.placements = this.options.placements;
  },

  filter(child) {
    let modelShownPrior = null;

    const placementsForChild = this.placements
                                      .where({ package: child.id })
                                      .map(i => i.toJSON());

    const childPlacements = _.flatten(placementsForChild.map(i => i.placementTypes));

    if (_.contains(childPlacements, this.options.sectionConfig.slug)) {
      modelShownPrior = _.chain(this.options.ignoredSlugs)
              .map(ignoredSlugs => _.contains(childPlacements, ignoredSlugs))
              .value();

      if (!_.some(modelShownPrior)) { return true; }
    }

    return false;
  },

  onRender() {
    const parentEl = this.$el.parent();

    // eslint-disable-next-line no-underscore-dangle
    if (this._filteredSortedModels().length === 0) {
      if (parentEl.hasClass('enabled-facet')) {
        parentEl.removeClass('enabled-facet');
      }
    } else if (!parentEl.hasClass('enabled-facet')) {
      parentEl.addClass('enabled-facet');
    }
  },

  onCollectionChange(model) {
    // eslint-disable-next-line no-underscore-dangle
    if (_.contains(_.pluck(this._filteredSortedModels(), 'cid'), model.cid)) {
      if (!_.isUndefined(this.children.findByModelCid(model.cid))) {
        this.renderPackagePrimary(this.children.findByModelCid(model.cid));
      }
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
