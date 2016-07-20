define(
    [
        'backbone',
        'moment',
        'underscore',
        'budget/compositeviews/packages/edit',
        'budget/compositeviews/search-list/print',
        'budget/compositeviews/search-list/web',
        'budget/itemviews/snackbars/snackbar.js',
        'budget/models/package',
    ],
    function(
        Backbone,
        moment,
        _,
        PackageEditView,
        WebPrintList,
        WebSearchList,
        SnackbarView,
        Package
    ) {
        'use strict';

        var radio = Backbone.Wreqr.radio.channel('global');

        return {
            home: function(querystring) {
                radio.commands.execute(
                    'setState',
                    'meta',
                    'listViewType',
                    'listPage'
                );

                radio.commands.execute(
                    'switchMainView',
                    WebSearchList,
                    {querystring: querystring}
                );
            },
            printList: function(querystring) {
                radio.commands.execute('setState', 'meta', 'listViewType', 'printListPage');

                radio.commands.execute(
                    'switchMainView',
                    WebPrintList,
                    {querystring: querystring}
                );
            },
            edit: function(packageID) {
                var packageOpts = (_.isUndefined(packageID)) ? {} : {
                        id: parseInt(packageID, 10),
                    },
                    packageToEdit = new Package(packageOpts);

                if (_.isUndefined(packageID)) {
                    // Instantiate an item collection associated with this package, and
                    // retrieve its starting values from the API.
                    packageToEdit.loadInitial().done(function() {
                        radio.commands.execute(
                            'switchMainView',
                            PackageEditView,
                            {model: packageToEdit, isEmpty: true}
                        );
                    });
                } else {
                    packageToEdit.fetch({
                        xhrFields: {
                            withCredentials: true,
                        },
                    }).done(function() {
                        radio.commands.execute(
                            'switchMainView',
                            PackageEditView,
                            {model: packageToEdit}
                        );
                    }).fail(function(stage, response) {
                        if (stage === 'package') {
                            if (response.status === 404) {
                                // Redirect to the home page.
                                radio.commands.execute('navigate', '', {trigger: true});

                                // Display snackbar:
                                radio.commands.execute(
                                    'showSnackbar',
                                    new SnackbarView({
                                        snackbarClass: 'failure',
                                        text: 'Could not find that item.',
                                    })
                                );
                            } else {
                                // Redirect to the home page.
                                radio.commands.execute('navigate', '', {trigger: true});

                                // Display snackbar:
                                radio.commands.execute(
                                    'showSnackbar',
                                    new SnackbarView({
                                        snackbarClass: 'failure',
                                        text: 'Could not load that item.',
                                    })
                                );
                            }
                        }
                    });
                }
            },
            fourohfour: function() {
                console.log('404.');  // eslint-disable-line no-console
            },
        };
    }
);
