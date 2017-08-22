import Backbone from 'backbone';

import QueryTerm from '../models/query-term';

export default Backbone.Collection.extend({
    // A boolean to track whether we've populated our collection with
    // search options for the first time
    model: QueryTerm,

    events: {},

    /**
     * Sort the collection by pinned status first (pinned on top) then by
     * created timestamp in reverse chronological order
     */
    comparator(model) {
        const optionTypeWeights = { person: 2, hub: 1, vertical: 0 };
        return `${optionTypeWeights[model.get('type')]}_${model.get('value')}`;
    },

    parse(response) {
        return response;
    },
});
