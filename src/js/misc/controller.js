define(
    [
        'backbone',
        'moment',
        'underscore',
        'collections/additional-content-items',
        'compositeviews/packages/edit',
        'itemviews/snackbars/snackbar.js',
        'layoutviews/packages/list-print-info',
        'layoutviews/packages/list-web-info',
        'models/package',
        'utils/list-querystring-parser'
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
        Package,
        ListQuerystringParser
    ) {
        'use strict';

        var _radio = Backbone.Wreqr.radio.channel('global');

        return {
            home: function(querystring){
                _radio.commands.execute(
                    'switchMainView',
                    PackageWebListView,
                    {
                        'queryParts': ListQuerystringParser.parse(querystring)
                    }
                );
            },
            printList: function(querystring){
                _radio.commands.execute(
                    'switchMainView',
                    PackagePrintListView,
                    {
                        'queryParts': ListQuerystringParser.parse(querystring)
                    }
                );
            },
            edit: function(packageID) {
                var additionalItemCollection = new AdditionalContentItems();

                if (_.isUndefined(packageID)) {
                    _radio.commands.execute(
                        'switchMainView',
                        PackageEditView,
                        {
                            collection: additionalItemCollection,
                        }
                    );
                } else {
                    var packageToEdit = new Package({
                        id: parseInt(packageID, 10)
                    });

                    packageToEdit.fetch({
                        success: function(model, response, options) {
                            console.log("Fetched package with ID '" + model.id + "'.");

                            _radio.commands.execute(
                                'switchMainView',
                                PackageEditView,
                                {
                                    model: packageToEdit,
                                    collection: additionalItemCollection,
                                }
                            );
                        },
                        error: function(model, response, options) {
                            if (response.status == 404) {
                                // Redirect to the home page.
                                _radio.commands.execute('navigate', '', {trigger: true});

                                // Display snackbar:
                                _radio.commands.execute(
                                    'showSnackbar',
                                    new SnackbarView({
                                        snackbarClass: 'failure',
                                        text: 'Could not find that item.',
                                    })
                                );
                            } else {
                                // Redirect to the home page.
                                _radio.commands.execute('navigate', '', {trigger: true});

                                // Display snackbar:
                                _radio.commands.execute(
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
            fourohfour: function(){
                console.log("404.");
            },
        };
    }
);