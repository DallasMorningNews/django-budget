import _ from 'underscore';
import Backbone from 'backbone';
import Mn from 'backbone.marionette';
// import 'daterange-picker-ex';


import deline from '../../../vendored/deline';
import formatDateRange from '../../../common/date-range-formatter';

const uiElements = {
  alertsHolder: '#content-placement-choice-modal .choice-outer .alerts',
  placementRows: '.table-card table tbody tr',
};


export default Mn.ItemView.extend({
  ui: uiElements,

  initialize() {
    this.radio = Backbone.Wreqr.radio.channel('global');

    this.callbacks = this.options.callbacks || {};

    this.extraContext = this.options.extraContext || {};

    this.config = {
      innerID: 'content-placement-choice-modal',
      contentClassName: 'package-modal placement-choice-modal',
      escapeButtonCloses: false,
      overlayClosesOnClick: false,
      buttons: [
        {
          buttonID: 'content-placement-open-for-editing-button',
          buttonClass: 'flat-button save-action ' +
                        'expand-past-button open-for-editing-trigger',
          innerLabel: 'Edit placement',
          clickCallback: () => {  // Args: modalContext
            const selectedID = this.getSelectedID();

            if (selectedID === null) {
              setTimeout(() => {
                this.ui.alertsHolder
                            .html('Please choose a placement to proceed with editing.')
                            .show();
              }, 750);
            } else {
              this.ui.alertsHolder.html('');
              this.callbacks.openPlacementForEditing(selectedID);
            }
          },
        },
        {
          buttonID: 'package-placement-cancel-button',
          buttonClass: 'flat-button delete-action cancel-trigger',
          innerLabel: 'Cancel',
          clickCallback: () => {
            this.callbacks.cancel();
          },
        },
      ],
    };

    this.config.modalTitle = 'Select a placement to edit';

    this.config.extraHTML = this.generateInnerHTML();
  },

  generatePlacementRow(model) {  // Args: model, index, collection
    const runDate = model.get('runDate');

    const startDate = this.options.moment(runDate[0]);
    const endDate = this.options.moment(runDate[1]).subtract(1, 'day');

    const dateRangeFormatted = formatDateRange(startDate, endDate);

    const rowPublicationDestination = this.options.destinations.findWhere({
      id: model.get('destination'),
    });

    const destinationSections = rowPublicationDestination
                                    .get('sections')
                                    .map(section => section.slug);

    const filteredSections = model
                                .get('placementTypes')
                                .filter(plc => destinationSections.includes(plc));

    const matches = rowPublicationDestination
                        .get('sections')
                        .filter(sectionObj => filteredSections.includes(sectionObj.slug));

    const richFilteredSections = _.sortBy(matches, 'priority');

    const formattedValues = {
      destination: rowPublicationDestination.get('name'),
      runDate: dateRangeFormatted,
      externalSlug: model.get('externalSlug'),
      placementTypeClass: (_.isEmpty(richFilteredSections)) ? 'empty-val' : '',
      placementTypes: (
        _.isEmpty(richFilteredSections)
      ) ? (
        '(None)'
      ) : (
        richFilteredSections
          .map(section => section.name)
          .reduce((memo, val) => `${memo}, ${val}`)
      ),
      // isFinalized: model.get('isFinalized'),
      // isFinalizedClass: model.get('isFinalized').toString(),
      // isFinalizedIcon: (
      //   model.get('isFinalized')
      // ) ? (
      //   'done'
      // ) : (
      //   'not_interested'
      // ),
    };

    const hasPageNumber = (
      (model.get('pageNumber') !== null) &&
      (model.get('pageNumber') !== undefined)
    );

    const hasPlacementDetails = (
      (model.get('placementDetails') !== null) &&
      (model.get('placementDetails') !== undefined) &&
      (model.get('placementDetails').length > 0)
    );

    formattedValues.pageAndDetails = `${
      (hasPageNumber === true) ? model.get('pageNumber') : 'TK'
    } / ${
      (hasPlacementDetails === true) ? model.get('placementDetails') : 'TK'
    }`;

    return deline`<tr id="content-placement_${model.id}" class="">
        <td class="select-trigger">
            <div class="checkbox">
                <label>
                    <input id="is_selected_${
                      model.id
                    }" name="" type="checkbox" value="" />
                    <i class="helper"></i>
                </label>
            </div>
        </td>
        <td class="destination">
            <span>${formattedValues.destination}</span>
        </td>
        <td class="run-date">
            <span>${formattedValues.runDate}</span>
        </td>
        <td class="external-slug">
            <span>${formattedValues.externalSlug}</span>
        </td>
        <td class="placement-types ${formattedValues.placementTypeClass}">
            <span>${formattedValues.placementTypes}</span>
        </td>
        <td class="page-and-details">
            <span>${formattedValues.pageAndDetails}</span>
        </td>
    </tr>`;
  },

  generateInnerHTML() {
    const chatterLines = [
      'Choose one of the already-created placements below to edit it.',
      // 'You can also make a new placement by clicking the "New placement" button.',
    ];

    const existingPlacementChoiceRows = this.options.placements.map((item) => {
      const html = this.generatePlacementRow(item);
      return html;
    });

    const tableMarkup = deline`<div class="table-card">
        <table>
            <thead>
                <tr>
                    <th class="select-action-holder"></th>
                    <th class="destination">Destination</th>
                    <th class="run-date">Run date(s)</th>
                    <th class="external-slug">Slug</th>
                    <th class="placement-types">Type(s)</th>
                    <th class="page-and-details">Page / Details</th>
                </tr>
            </thead>
            <tbody>
                ${existingPlacementChoiceRows.join('')}
            </tbody>
        </table>
    </div>`;

    return deline`<div class="choice-outer">
        <div class="alerts"></div>
        ${chatterLines.map(htmlContents => `<p>${htmlContents}</p>`).join('')}
        ${tableMarkup}
    </div>`;
  },

  extendConfig(configToAdd) {
    this.config = _.extend(this.config, configToAdd);
  },

  getConfig() {
    return this.config;
  },

  getFormRows() {
  },

  getSelectedID() {
    const allRows = this.ui.placementRows;
    const selectedRows = allRows.filter((i, el) => el.classList.contains('selected'));

    if (selectedRows.length === 0) {
      return null;
    } else if (selectedRows.length === 1) {
      return parseInt(selectedRows[0].id.replace('content-placement_', ''), 10);
    }

    console.warn(''.join([  // eslint-disable-line no-console
      'Multiple placement rows were selected on choice modal.',
      'Using the first one...',
    ]));
    return parseInt(selectedRows[0].id.replace('content-placement_', ''), 10);
  },

  getBindings() {
    const bindings = {};

    return bindings;
  },
});
