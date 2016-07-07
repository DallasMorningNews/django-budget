define([
    'marionette',
    'underscore',
    'budget/itemviews/packages/package-print-info',
    'common/tpl',
], function(
    Mn,
    _,
    PackageItemPrintView,
    tpl
) {
    return Mn.CollectionView.extend({
        template: tpl('print-section-packages-list'),

        childView: PackageItemPrintView,

        childViewOptions: function(model, index) {  // eslint-disable-line no-unused-vars
            return {
                allSections: this.options.allSections,
                hubConfigs: this.options.hubConfigs,
            };
        },

        initialize: function() {
            this.collection.on('setPrimary', this.onCollectionChange.bind(this));
        },

        filter: function(child, index, collection) {  // eslint-disable-line no-unused-vars
            var modelShownPrior;
            if (_.contains(child.get('printSection'), this.options.sectionConfig.id)) {
                modelShownPrior = _.chain(this.options.ignoredIDs)
                        .map(function(ignoredID) {
                            return _.contains(child.get('printSection'), ignoredID);
                        })
                        .value();

                if (!_.some(modelShownPrior)) { return true; }
            }

            return false;
        },

        onRender: function() {
            var parentEl = this.$el.parent();

            if (this._filteredSortedModels().length === 0) {
                if (parentEl.hasClass('enabled-facet')) {
                    parentEl.removeClass('enabled-facet');
                }
            } else {
                if (!parentEl.hasClass('enabled-facet')) {
                    parentEl.addClass('enabled-facet');
                }
            }
        },

        onCollectionChange: function(model, options) {  // eslint-disable-line no-unused-vars
            if (_.contains(
                    _.pluck(this._filteredSortedModels(), 'cid'),
                    model.cid
            )) {
                if (!_.isUndefined(this.children.findByModelCid(model.cid))) {
                    this.renderPackagePrimary(this.children.findByModelCid(model.cid));
                }
            }
        },

        renderPackagePrimary: function(childView) {
            if ((!childView.model.isNew()) && (!childView.model.primaryContentItem.isNew())) {
                if (!childView.hasPrimary) {
                    if (!childView.$el.find('.package-sheet').hasClass('has-primary')) {
                        setTimeout(function() {
                            childView.hasPrimary = true;  // eslint-disable-line no-param-reassign
                            childView.$el.find('.package-sheet').addClass('has-primary');
                        }, 600);
                    }
                }
            }
        },
    });
});
