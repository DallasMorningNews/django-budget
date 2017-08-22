import Backbone from 'backbone';

import settings from '../../common/settings';

export default Backbone.Model.extend({
    urlRoot: settings.apiEndpoints.headlineCandidate,

    url() {
        return this.urlRoot + this.id + (settings.apiPostfix || '/');
    },

    defaults: {
        text: '',
        winner: false,
    },
});
