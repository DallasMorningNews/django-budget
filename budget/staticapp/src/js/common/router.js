import Mn from 'backbone.marionette';
import _ from 'underscore';

export default Mn.AppRouter.extend({
  namedAppRoutes: {},

  initialize(opts) {  // eslint-disable-line no-unused-vars
    _.each(
      this.namedAppRoutes,
      (routeConfig, routeSlug) => {  // eslint-disable-line no-unused-vars
        this.appRoute(routeConfig.pattern, routeConfig.name);
      }  // eslint-disable-line comma-dangle
    );
  },

  onRoute(name, path, args) {
    console.info('= Routing =');  // eslint-disable-line no-console
    console.info(`Name: ${name}`);  // eslint-disable-line no-console
    console.info(`Path: ${path}`);  // eslint-disable-line no-console
    console.info(`Args: ${args}`);  // eslint-disable-line no-console
  },
});
