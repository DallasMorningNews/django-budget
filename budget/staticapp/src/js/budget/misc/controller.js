import _ from 'underscore';
import Backbone from 'backbone';

import FindItemView from '../compositeviews/find-item';
import Package from '../models/package';
import PackageEditView from '../compositeviews/packages/edit';
import parseQuerystring from '../../common/parse-querystring';
import PrintSearchList from '../compositeviews/search-list/print';
import SnackbarView from '../itemviews/snackbars/snackbar';
import WebSearchList from '../compositeviews/search-list/web';


const radio = Backbone.Wreqr.radio.channel('global');

const hasProperty = (object, property) =>
  Object.prototype.hasOwnProperty.call(object, property);

const decodeTerm = rawTerm => decodeURIComponent(rawTerm).replace(/\+/g, ' ');


export default {
  home(querystring) {
    radio.commands.execute(
      'setState',
      'meta',
      'listViewType',
      'listPage'  // eslint-disable-line comma-dangle
    );

    radio.commands.execute(
      'switchMainView',
      WebSearchList,
      { querystring }  // eslint-disable-line comma-dangle
    );
  },
  printList(querystring) {
    radio.commands.execute('setState', 'meta', 'listViewType', 'printListPage');

    radio.commands.execute(
        'switchMainView',
        PrintSearchList,
        { querystring }  // eslint-disable-line comma-dangle
    );
  },
  edit(packageID) {
    const packageOpts = (_.isUndefined(packageID)) ? {} : {
      id: parseInt(packageID, 10),
    };
    const packageToEdit = new Package(packageOpts);

    if (_.isUndefined(packageID)) {
      // Instantiate an item collection associated with this package, and
      // retrieve its starting values from the API.
      packageToEdit.loadInitial().done(() => {
        radio.commands.execute(
          'switchMainView',
          PackageEditView,
          { model: packageToEdit, isEmpty: true }  // eslint-disable-line comma-dangle
        );
      });
    } else {
      packageToEdit.fetch({
        xhrFields: {
          withCredentials: true,
        },
      }).done(() => {
        radio.commands.execute(
          'switchMainView',
          PackageEditView,
          { model: packageToEdit }  // eslint-disable-line comma-dangle
        );
      }).fail((stage, response) => {
        if (stage === 'package') {
          if (response.status === 404) {
            // Redirect to the home page.
            radio.commands.execute('navigate', '', { trigger: true });

            // Display snackbar:
            radio.commands.execute(
              'showSnackbar',
              new SnackbarView({
                snackbarClass: 'failure',
                text: 'Could not find that item.',
              })  // eslint-disable-line comma-dangle
            );
          } else {
            // Redirect to the home page.
            radio.commands.execute('navigate', '', { trigger: true });

            // Display snackbar:
            radio.commands.execute(
              'showSnackbar',
              new SnackbarView({
                snackbarClass: 'failure',
                text: 'Could not load that item.',
              })  // eslint-disable-line comma-dangle
            );
          }
        }
      });
    }
  },
  findItem(qs) {
    const queryDefaults = {
      term: null,
      recency: null,
    };

    let queryMetadata = queryDefaults;

    if (!_.isUndefined(qs) && qs !== null) {
      const parsedQuery = parseQuerystring(qs);
      const parsedMetadata = {};

      if (hasProperty(parsedQuery, 'q')) parsedMetadata.term = decodeTerm(parsedQuery.q);

      if (hasProperty(parsedQuery, 'recency')) parsedMetadata.recency = parsedQuery.recency;

      queryMetadata = Object.assign({}, queryDefaults, parsedMetadata);
    }

    radio.commands.execute('switchMainView', FindItemView, queryMetadata);
  },
  fourohfour() {
    console.log('404.');  // eslint-disable-line no-console
  },
};
