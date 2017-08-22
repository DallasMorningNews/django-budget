import jQuery from 'jquery';
import Marionette from 'backbone.marionette';

import App from './headline/misc/app';
import nunjucksRenderer from './common/njx-renderer';

Marionette.Renderer.renderer = nunjucksRenderer;

jQuery(document).ready(() => {
    // Initialize the app.
    const headlinesApp = new App();

    // Load underlying data (including the user config), then start
    // the app.
    headlinesApp.bootstrapData().done(
        headlinesApp.start.bind(headlinesApp)
    );

    window.app = headlinesApp;
});
