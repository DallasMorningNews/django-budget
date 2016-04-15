define(
    [
        'marionette',
        'misc/controller'
    ],
    function(
        Mn,
        controller
    ) {
        'use strict';

        var _radio = Backbone.Wreqr.radio.channel('global');

        return Mn.AppRouter.extend({
            controller: controller,

            appRoutes: {
                'edit(/)(:id)(/)': 'edit',
                '(:querystring)(/)': 'home',
                // 'search(/)(:querystring)(/)': 'search',
                '*notFound': 'fourohfour'
            },

            onRoute: function(name, path, args) {
                // $(window).scrollTop(0);
                // _radio.vent.trigger('route', name, path);

                console.info('= Routing =');
                console.info('Name: ' + name);
                console.info('Path: ' + path);
                console.info('Args: ' + args);
            }
        });
    }
);