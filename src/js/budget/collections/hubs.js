import Backbone from 'backbone';

import settings from '../../common/settings';
import Hub from '../models/hub';

export default Backbone.Collection.extend({
    // A boolean to track whether we've populated our collection with
    // hubs for the first time
    model: Hub,

    events: {},

    /**
     * Sort the collection by pinned status first (pinned on top) then by
     * created timestamp in reverse chronological order
     */
    comparator(model) {
        return model.get('slug');
    },

    url() {
        return settings.apiEndpoints.hub;
    },

    parse(response) {
        return response;
    },
});
