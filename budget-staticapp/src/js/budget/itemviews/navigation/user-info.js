import 'selectize';
import Mn from 'backbone.marionette';

import settings from '../../../common/settings';

export default Mn.ItemView.extend({
    template: 'budget/navigation-user-info',

    onRender() {
        this.setElement(this.el.innerHTML);
    },

    serializeData() {
        return {
            currentUser: this.options.currentUser,
            links: settings.navigationLinks,
        };
    },
});
