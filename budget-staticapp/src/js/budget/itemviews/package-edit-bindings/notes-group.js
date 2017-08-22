import jQuery from 'jquery';
import Mn from 'backbone.marionette';
import Quill from 'quill';

export default Mn.ItemView.extend({
    initialize() {
        this.parentUI = this.options.parentUI || {};
        this.uiElements = this.options.uiElements || {};

        this.extraContext = this.options.extraContext || {};
    },

    getBindings() {
        const bindings = {};

        const uiElements = this.uiElements;

        bindings[uiElements.notesField] = {
            observe: 'notes',
            events: ['updateText'],
            initialize($el) {
                const richNotesField = new Quill(uiElements.notesField, {
                    modules: {
                        toolbar: uiElements.notesToolbar,
                        'link-tooltip': true,
                    },
                    theme: 'snow',
                });
                const rnRoot = richNotesField.root;
                const closestCollapse = jQuery(rnRoot.closest('.row.can-collapse'));
                const activeHeight = jQuery(
                    rnRoot.closest('.collapsable-inner')
                ).outerHeight(true);

                richNotesField.on(
                    'text-change',
                    () => {
                        const newHTML = richNotesField.editor.innerHTML;
                        $el.trigger('updateText', newHTML);
                    }
                );

                closestCollapse.data('expandedHeight', activeHeight);

                if (closestCollapse.height > 0) {
                    jQuery(rnRoot.closest('.row.can-collapse')).height(activeHeight);
                }

                this.richNotesField = richNotesField;
            },
            update($el, value) {
                if (!$el.hasClass('ql-container')) {
                    // Quill has not yet been initialized. Insert the note
                    // text as raw HTML.
                    $el.html(value);
                } else {
                    // Quill is active. Insert the note text using its API.
                    this.richNotesField.setHTML(value);
                }
            },
            updateModel() { return true; },
            getVal($el, event, options, newText) { return newText[0]; },
        };

        return bindings;
    },
});
