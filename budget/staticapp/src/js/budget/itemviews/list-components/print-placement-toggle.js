import 'selectize';
import _ from 'underscore';
import Backbone from 'backbone';
import Mn from 'backbone.marionette';

import deline from '../../../vendored/deline';

export default Mn.ItemView.extend({
  template: 'budget/list-components-print-placement-toggle',

  ui: {
    searchBox: '#publication-search-box',
  },

  events: {
    'click @ui.toggleTrigger': 'runToggle',
  },

  initialize() {
    this.radio = Backbone.Wreqr.radio.channel('global');

    this.printPlacementChoices = this.enumeratePrintPlacementChoices();

    this.initialRender = false;

    this.noInitialPublication = _.isUndefined(
      this.radio.reqres.request(
        'getState',
        'printSearchList',
        'queryTerms'  // eslint-disable-line comma-dangle
      // eslint-disable-next-line comma-dangle
      ).findWhere({ type: 'destination' })
    );
  },

  enumeratePrintPlacementChoices() {
    const sectionPublicationValues = [];
    const publicationSections = [];
    const placementChoices = _.compact(this.options.data.printPublications.map((publication) => {
      if (publication.get('isActive') === true) {
        // Generate a second map with this publications'
        // section IDs and the publication's slug.
        // This gets used on the selectize 'select' event.
        sectionPublicationValues.push(_.map(
          publication.get('sections'),
          // eslint-disable-next-line comma-dangle
          section => [section.id, publication.get('slug')]
        ));

        publicationSections.push([
          publication.get('slug'),
          publication.get('sections'),
        ]);

        return {
          name: publication.get('name'),
          value: `${publication.get('slug')}.dest`,
        };
      }

      return null;
    }));

    this.printPublicationSections = _.chain(publicationSections)
            .compact()
            .reject(mapping => _.isEmpty(mapping[1]))
            .object()
            .value();

    this.sectionPublicationMap = _.chain(sectionPublicationValues)
            .compact()
            .reject(_.isEmpty)
            .flatten(true)
            .object()
            .value();

    return placementChoices;
  },

  onRender() {
    let commonPublication = this.radio.reqres.request(
      'getState',
      'printSearchList',
      'queryTerms'  // eslint-disable-line comma-dangle
    ).findWhere({ type: 'destination' });

    if (!this.initialRender) {
      if (this.noInitialPublication) {
        this.radio.commands.execute(
          'pushQueryTerm',
          this.options.stateKey,
          {
            type: 'destination',
            value: this.printPlacementChoices[0].value,
          }  // eslint-disable-line comma-dangle
        );

        commonPublication = this.radio.reqres.request(
          'getState',
          'printSearchList',
          'queryTerms'  // eslint-disable-line comma-dangle
        ).findWhere({ type: 'destination' });
      }

      this.initialRender = true;
    }

    this.selectizeBox = this.ui.searchBox.selectize({
      addPrecedence: false,
      closeAfterSelect: true,
      create: false,
      labelField: 'name',
      maxItems: 1,
      options: this.printPlacementChoices,
      persist: false,
      plugins: ['restore_on_backspace'],
      searchField: ['name'],
      selectOnTab: true,
      valueField: 'value',
      render: {
        item: (data) => {
          const dataType = (
            typeof data.type !== 'undefined'
          ) ? data.type : 'fullText';

          return deline`
            <div data-value="${data.value}"
                 data-type="${dataType}"
                 class="item">${
                     data.name
                 }</div>`;
        },
      },
      onItemAdd: () => {},
      onChange: (value) => {
        const currentPublication = this.radio.reqres.request(
          'getState',
          'printSearchList',
          'queryTerms'  // eslint-disable-line comma-dangle
        ).findWhere({ type: 'destination' });

        if (!_.isUndefined(currentPublication)) {
          this.radio.commands.execute(
            'popQueryTerm',
            this.options.stateKey,
            currentPublication.get('value'),
            { silent: true }  // eslint-disable-line comma-dangle
          );
        }

        this.radio.commands.execute(
          'pushQueryTerm',
          this.options.stateKey,
          // eslint-disable-next-line comma-dangle
          { type: 'destination', value }
        );

        const selectizeObj = this.ui.searchBox[0].selectize;

        selectizeObj.$dropdown.find(`.selected:not([data-value="${
          selectizeObj.items[0]
        }"])`).removeClass('selected');
      },
      onItemRemove() {},
    });

    // If an initial publication has been specified, show it as active
    // in the (dropdown) UI.
    if (!_.isUndefined(commonPublication)) {
      const selectizeObj = this.ui.searchBox[0].selectize;
      selectizeObj.off('item_add');
      selectizeObj.addItem(commonPublication.get('value'), true);
      selectizeObj.on('item_add', selectizeObj.settings.onItemAdd);
    }
  },
});
