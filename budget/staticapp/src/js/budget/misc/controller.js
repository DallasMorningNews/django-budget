import _ from 'underscore';
import Backbone from 'backbone';

import Package from '../models/package';
import PackageEditView from '../compositeviews/packages/edit';
import PrintSearchList from '../compositeviews/search-list/print';
import SnackbarView from '../itemviews/snackbars/snackbar';
import WebSearchList from '../compositeviews/search-list/web';

const radio = Backbone.Wreqr.radio.channel('global');

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
  fourohfour() {
    console.log('404.');  // eslint-disable-line no-console
  },
};
