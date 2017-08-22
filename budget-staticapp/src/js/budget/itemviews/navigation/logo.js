import Mn from 'backbone.marionette';

export default Mn.ItemView.extend({
    template: 'budget/navigation-logo',

    onRender() {
        this.setElement(this.el.innerHTML);
    },
});
