define(
    [
        'backbone',
        'moment',
        'underscore',
        'budget/collections/additional-content-items',
        'budget/compositeviews/packages/edit',
        'budget/itemviews/snackbars/snackbar.js',
        'budget/layoutviews/packages/list-print-info',
        'budget/layoutviews/packages/list-web-info',
        'budget/models/package',
    ],
    function(
        Backbone,
        moment,
        _,
        AdditionalContentItems,
        PackageEditView,
        SnackbarView,
        PackagePrintListView,
        PackageWebListView,
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
                    PackageWebListView,
                    {querystring: querystring}
                );
            },
            printList: function(querystring) {
                radio.commands.execute('setState', 'meta', 'listViewType', 'printListPage');

                radio.commands.execute(
                    'switchMainView',
                    PackagePrintListView,
                    {querystring: querystring}
                );
            },
            edit: function(packageID) {
                var additionalItemCollection = new AdditionalContentItems(),
                    packageToEdit;

                if (_.isUndefined(packageID)) {
                    packageToEdit = new Package();

                    radio.commands.execute(
                        'switchMainView',
                        PackageEditView,
                        {
                            model: packageToEdit,
                            collection: additionalItemCollection,
                        }
                    );
                } else {
                    packageToEdit = new Package({
                        id: parseInt(packageID, 10),
                    });

                    packageToEdit.fetch({
                        success: function(model, response, options) {  // eslint-disable-line no-unused-vars,max-len
                            console.log(  // eslint-disable-line no-console
                                "Fetched package with ID '" + model.id + "'."
                            );

                            radio.commands.execute(
                                'switchMainView',
                                PackageEditView,
                                {
                                    model: packageToEdit,
                                    collection: additionalItemCollection,
                                }
                            );
                        },
                        error: function(model, response, options) {  // eslint-disable-line no-unused-vars,max-len
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
                        },
                    });
                }
            },
            fourohfour: function() {
                console.log('404.');  // eslint-disable-line no-console
            },
        };
    }
);
