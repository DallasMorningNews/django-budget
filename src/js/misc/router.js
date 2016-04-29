define(
    [
        'marionette'
    ],
    function(
        Mn
    ) {
        'use strict';

        return Mn.AppRouter.extend({
            namedAppRoutes: {},

            initialize: function(opts) {
                _.each(
                    this.namedAppRoutes,
                    function(routeConfig, routeSlug) {
                        this.appRoute(
                            routeConfig.pattern,
                            routeConfig.name
                        );
                    }.bind(this)
                );
            },

            onRoute: function(name, path, args) {
                console.info('= Routing =');
                console.info('Name: ' + name);
                console.info('Path: ' + path);
                console.info('Args: ' + args);
            }
        });
    }
);