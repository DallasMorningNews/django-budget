import Backbone from 'backbone';

import SearchOption from '../models/search-option';

export default Backbone.Collection.extend({
    // A boolean to track whether we've populated our collection with
    // search options for the first time
    model: SearchOption,

    events: {},

    /**
     * Sort the collection by pinned status first (pinned on top) then by
     * created timestamp in reverse chronological order
     */
    comparator(model) {
        const optionTypeWeights = { person: 2, hub: 3, vertical: 4 };
        return `${optionTypeWeights[model.get('type')]}_${model.get('value')}`;
    },

    parse(response) {
        return response;
    },
});
