import _ from 'underscore';
import Mn from 'backbone.marionette';

export default Mn.ItemView.extend({
  initialize() {
    this.parentUI = this.options.parentUI || {};
    this.uiElements = this.options.uiElements || {};

    this.extraContext = this.options.extraContext || {};
  },

  getBindings() {
    const bindings = {};

    const extraContext = this.extraContext;
    const model = this.model;
    const uiElements = this.uiElements;

    bindings[uiElements.colorDot] = {
      observe: 'hub',
      update: () => {},
      getVal: () => {},
      attributes: [
        {
          name: 'style',
          observe: 'hub',
          onGet: (value) => {
            const matchingHub = extraContext.hubList.findWhere({ slug: value });

            if (matchingHub && matchingHub.has('color')) {
              return `background-color: ${matchingHub.get('color')};`;
            }

            return '';
          },
        },
      ],
    };

    bindings[uiElements.packageTitle] = {
      observe: [
        'hub',
        'slugKey',
        'publishDate',
      ],
      onGet: values => [
        values[0],
        model.get('slugKey'),
        values[2],
        values[3],
      ],
      update($el, value, mdl) {
        const newPackageTitle = mdl.generatePackageTitle();

        // mdl.set('slug', newPackageTitle);
        // mdl.additionalContentCollection.each((item) => {
        //   item.set('slug', `${newPackageTitle}.${item.get('slugKey')}`);
        // });

        $el.text(newPackageTitle);

        // Propagate package-title changes to all additional
        // content models.
        extraContext.loopChildViews((childView) => {
          // eslint-disable-next-line no-param-reassign
          childView.options.primarySlug = newPackageTitle;
          childView.model.trigger('change:parentSlug');
        });
      },
    };

    bindings[uiElements.contentPlacements] = {
      observe: 'id',
      update() {},
      getVal() {},
      attributes: [
        {
          name: 'data-visible',
          observe: 'id',
          onGet(value) {
            return (_.isUndefined(value)) ? 'false' : 'true';
          },
        },
      ],
    };

    bindings[uiElements.packageDeleteTrigger] = {
      observe: 'id',
      update() {},
      getVal() {},
      attributes: [
        {
          name: 'data-visible',
          observe: 'id',
          onGet(value) {
            return (_.isUndefined(value)) ? 'false' : 'true';
          },
        },
      ],
    };

    return bindings;
  },
});
