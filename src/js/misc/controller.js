define(
    [
        'backbone',
        'marionette',
        'collections/packages',
        'itemviews/snackbars/snackbar.js',
        'layoutviews/packages/edit',
        'layoutviews/packages/list',
        'models/package'
    ],
    function(
        Backbone,
        Mn,
        PackageCollection,
        SnackbarView,
        PackageEditView,
        PackageListView,
        Package
    ) {
        'use strict';

        var _radio = Backbone.Wreqr.radio.channel('global');

        return {
            home: function(){
                // var packageListView = new PackageListView({
                //     hubs: this.options.data.hubs,
                //     searchOptions: this.options.data.searchOptions,
                //     packages: this.options.data.packages,
                //     state: this.options.state,
                // });

                var packageCollection = new PackageCollection();

                packageCollection.fetch().done(function() {
                    console.log("Fetched package collection with '" + packageCollection.length + "' item(s).");

                    _radio.commands.execute(
                        'switchMainView',
                        PackageListView,
                        {
                            'packageCollection': packageCollection
                        }
                    );
                });
            },
            search: function(){
                console.log("Search.");
            },
            edit: function(packageID){
                if (packageID === null) {
                    _radio.commands.execute('switchMainView', PackageEditView);
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
                                packageToEdit
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