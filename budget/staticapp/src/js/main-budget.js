import jQuery from 'jquery';
import Marionette from 'backbone.marionette';

import App from './budget/misc/app';
import nunjucksRenderer from './common/njx-renderer';
import './templates/budget';


Marionette.Renderer.render = nunjucksRenderer;

const budget = {};

budget.initialize = (config) => {
  jQuery(document).ready(() => {
    // Initialize the app.
    const budgetApp = new App(config);

    // Load underlying data (including the user config), then start
    // the app.
    budgetApp.bootstrapData().done(
      // eslint-disable-next-line comma-dangle
      budgetApp.start.bind(budgetApp)
    );

    budget.app = budgetApp;
  });
};

window.budget = budget;
