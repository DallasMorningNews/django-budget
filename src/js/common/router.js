define(
    [
        'marionette',
        'underscore',
    ],
    function(
        Mn,
        _
    ) {
        'use strict';

        return Mn.AppRouter.extend({
            namedAppRoutes: {},

            initialize: function(opts) {  // eslint-disable-line no-unused-vars
                _.each(
                    this.namedAppRoutes,
                    function(routeConfig, routeSlug) {  // eslint-disable-line no-unused-vars
                        this.appRoute(
                            routeConfig.pattern,
                            routeConfig.name
                        );
                    }.bind(this)
                );
            },

            onRoute: function(name, path, args) {
                console.info('= Routing =');  // eslint-disable-line no-console
                console.info('Name: ' + name);  // eslint-disable-line no-console
                console.info('Path: ' + path);  // eslint-disable-line no-console
                console.info('Args: ' + args);  // eslint-disable-line no-console
            },
        });
    }
);
