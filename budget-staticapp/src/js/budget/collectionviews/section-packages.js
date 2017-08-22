import Mn from 'backbone.marionette';
import _ from 'underscore';

import PackageItemPrintView from '../itemviews/packages/package-print-info';

export default Mn.CollectionView.extend({
    template: 'budget/print-section-packages-list',

    childView: PackageItemPrintView,

    childViewOptions() {
        return {
            allSections: this.options.allSections,
            hubConfigs: this.options.hubConfigs,
            printPublications: this.options.printPublications,
        };
    },

    initialize() {
        this.poller = this.options.poller;
        this.collection.on('setPrimary', this.onCollectionChange.bind(this));
    },

    filter(child) {
        let modelShownPrior = null;
        if (_.contains(child.get('printSection'), this.options.sectionConfig.id)) {
            modelShownPrior = _.chain(this.options.ignoredIDs)
                    .map(
                        ignoredID => _.contains(
                            child.get('printSection'),
                            ignoredID
                        )
                    )
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
        if (_.contains(
            // eslint-disable-next-line no-underscore-dangle
            _.pluck(this._filteredSortedModels(), 'cid'),
            model.cid
        )) {
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
