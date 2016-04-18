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

            namedAppRoutes: {
                notFound: {
                    pattern: /^.+$/,
                    name: 'fourohfour'
                },
                listPage: {
                    pattern: /^([\s\d\w\&\=\-\%\.]*)\/{0,1}$/,
                    name: 'home'
                },
                createPage: {
                    pattern: /^edit\/{0,1}$/,
                    name: 'edit'
                },
                editPage: {
                    pattern: /^edit\/(\d+)\/{0,1}$/,
                    name: 'edit'
                }
            },

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