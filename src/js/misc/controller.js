define(
    [
        'backbone',
        'marionette',
        'layoutviews/packages/edit',
        'layoutviews/packages/list',
    ],
    function(
        Backbone,
        Mn,
        PackageEditView,
        PackageListView
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

                _radio.commands.execute('switchMainView', PackageListView, {});
            },
            search: function(){
                console.log("Search.");
            },
            edit: function(packageID){
                if (packageID === null) {
                    _radio.commands.execute('specifyEditedPackage', null);
                } else {
                    _radio.commands.execute('specifyEditedPackage', packageID);
                }

                _radio.commands.execute('switchMainView', PackageEditView);
            },
            fourohfour: function(){
                console.log("404.");
            },
        };
    }
);