import jQuery from 'jquery';
import Marionette from 'backbone.marionette';

import App from './budget/misc/app';
import nunjucksRenderer from './common/njx-renderer';
import './templates/budget';


Marionette.Renderer.render = nunjucksRenderer;

jQuery(document).ready(() => {
    // Initialize the app.
    const budgetApp = new App();

    // Load underlying data (including the user config), then start
    // the app.
    budgetApp.bootstrapData().done(
        budgetApp.start.bind(budgetApp)
    );

    window.app = budgetApp;
});
