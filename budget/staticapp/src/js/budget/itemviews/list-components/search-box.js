import 'selectize';
import _ from 'underscore';
import Backbone from 'backbone';
import Mn from 'backbone.marionette';

import deline from '../../../vendored/deline';

import SearchOption from '../../models/search-option';
import SearchOptionCollection from '../../collections/search-options';

const radio = Backbone.Wreqr.radio.channel('global');

export default Mn.ItemView.extend({
  template: 'budget/packages-list-searchbox',

  ui: {
    searchBox: '#package-search-box',
  },

  initialize(options) {
    this.options = options;
    this.searchOptions = new SearchOptionCollection();
  },

  onRender() {
    let selectizeObj;

    this.generateSearchOptions();

    this.selectizeBox = this.ui.searchBox.selectize({
      plugins: ['remove_button', 'restore_on_backspace'],
      persist: false,
      create: (input) => {
        this.ui.searchBox.parent().find('.selectize-dropdown').addClass('super-hidden');

        setTimeout(
          () => {
            this.ui.searchBox[0].selectize.close();
            this.ui.searchBox.parent().find('.selectize-dropdown')
                                        .removeClass('super-hidden');
          },
          75  // eslint-disable-line comma-dangle
        );

        return {
          name: input,
          value: input,
        };
      },
      hideSelected: true,
      valueField: 'value',
      labelField: 'name',
      searchField: ['name'],
      selectOnTab: true,
      closeAfterSelect: true,
      options: this.searchOptions.toJSON(),
      optgroupField: 'type',
      optgroupLabelField: 'name',
      optgroupValueField: 'value',
      optgroups: [
        { name: 'People', value: 'person', $order: 2 },
        { name: 'Hubs', value: 'hub', $order: 3 },
        { name: 'Verticals', value: 'vertical', $order: 4 },
        { name: 'Content types', value: 'contentType', $order: 5 },
      ],
      lockOptgroupOrder: true,
      addPrecedence: false,
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
        option_create: (data, escape) => deline`
            <div class="create">Search all content for
                <strong>"${escape(data.input)}"</strong>&hellip;</div>`,
      },
      onItemAdd: (value, $item) => {
        const additionalParam = {};
        additionalParam.type = $item.data('type');
        additionalParam.value = $item.data('value');

        radio.commands.execute(
          'pushQueryTerm',
          this.options.stateKey,
          additionalParam  // eslint-disable-line comma-dangle
        );
      },
      onItemRemove: (value) => {
        radio.commands.execute(
            'popQueryTerm',
            this.options.stateKey,
            value  // eslint-disable-line comma-dangle
        );
      },
      // preload: true
    });

    const commonQueryTerms = radio.reqres.request(
      'getState',
      this.options.stateKey,
      'queryTerms'  // eslint-disable-line comma-dangle
    );

    if (!commonQueryTerms.isEmpty()) {
      // Add all currently-selected fields to the selectize box.
      // Nota bene: I'm doing this manually, rather than by
      // specifying an 'items' array, because the latter way won't
      // let you add created (in our case, full-text search) options.
      selectizeObj = this.ui.searchBox[0].selectize;

      selectizeObj.off('item_add');

      commonQueryTerms.each((term, i) => {
        if (term.get('type') === 'fullText') {
          selectizeObj.createItem(term.get('value'), false);
        } else {
          selectizeObj.addItem(term.get('value'), true);
        }

        if (i + 1 === commonQueryTerms.length) {
          selectizeObj.on('item_add', selectizeObj.settings.onItemAdd);
        }
      });  // eslint-disable-line no-extra-bind
    }
  },

  generateSearchOptions() {
    const rawOptions = {
      hubs: [],
      verticals: [],
      contentTypes: [],
    };
    const addedVerticals = [];

    rawOptions.staffers = this.options.data.staffers.map(
      staffer => new SearchOption({
        name: staffer.get('fullName'),
        value: staffer.get('email'),
        type: 'person',
        sortKey: staffer.get('lastName'),
      })  // eslint-disable-line comma-dangle
    );

    this.options.data.hubs.each(
      (hub) => {
        const vertical = hub.get('vertical');

        rawOptions.hubs.push(
          new SearchOption({
            name: hub.get('name'),
            value: `${hub.get('slug')}.hub`,
            type: 'hub',
          })  // eslint-disable-line comma-dangle
        );

        if (!_.contains(addedVerticals, vertical.slug)) {
          addedVerticals.push(vertical.slug);

          rawOptions.verticals.push(
            new SearchOption({
              name: vertical.name,
              value: `${vertical.slug}.v`,
              type: 'vertical',
            })  // eslint-disable-line comma-dangle
          );
        }
      }  // eslint-disable-line comma-dangle
    );

    _.each(radio.reqres.request('getSetting', 'contentTypes'), (typeConfig, slug) => {
      rawOptions.contentTypes.push(
        new SearchOption({
          name: typeConfig.verboseName,
          value: `${slug}.ct`,
          type: 'contentType',
        })  // eslint-disable-line comma-dangle
      );
    });

    this.searchOptions.comparator = (item1, item2) => {
      const optionType1 = item1.get('type');
      const optionType2 = item2.get('type');

      if (optionType1 !== optionType2) {
        const typeRankingIndex = radio.reqres.request('getSetting', 'typeRankingIndex');

        const typeRanking1 = typeRankingIndex[optionType1];
        const typeRanking2 = typeRankingIndex[optionType2];

        return (typeRanking1 > typeRanking2) ? 1 : -1;
      }

      let optionValue1 = item1.get('value').toLowerCase();
      let optionValue2 = item2.get('value').toLowerCase();

      if (item1.has('sortKey')) {
        optionValue1 = item1.get('sortKey').toLowerCase();
      }

      if (item2.has('sortKey')) {
        optionValue2 = item2.get('sortKey').toLowerCase();
      }

      return (optionValue1 > optionValue2) ? 1 : -1;
    };

    this.searchOptions.reset();

    this.searchOptions.add(rawOptions.staffers);
    this.searchOptions.add(rawOptions.hubs);
    this.searchOptions.add(rawOptions.verticals);
    this.searchOptions.add(rawOptions.contentTypes);
  },
});
