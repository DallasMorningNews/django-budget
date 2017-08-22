import Backbone from 'backbone';

import settings from '../../common/settings';

export default Backbone.Model.extend({
    urlRoot: settings.apiEndpoints.item,

    url() {
        if (this.has('id')) {
            return this.urlRoot + this.id + (settings.apiPostfix || '/');
        }

        return this.urlRoot;
    },

    defaults: {
        type: null,
        slugKey: '',
        authors: [],
        budgetLine: '',
    },
});
