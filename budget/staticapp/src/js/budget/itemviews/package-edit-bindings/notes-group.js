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
        const allowedSizes = ['12px', false, '16px', '18px', '24px', '30px'];

        if (typeof this.richNotesField === 'undefined') {
          // This — along with custom styles for '.ql-picker-label' and
          // '.ql-picker-item' classes in `_package_editing.scss` — are how Quill
          // accepts custom font-size values.
          const Size = Quill.import('attributors/style/size');
          Size.whitelist = allowedSizes;
          Quill.register(Size, true);

          this.richNotesField = new Quill(uiElements.notesField, {
            modules: {
              toolbar: [
                ['bold', 'italic', 'underline', 'strike'],
                [{ size: allowedSizes }],
                // ULs and OLs temporarily disabled, as they aren't
                // currently supported in the list-view modal styles.
                // [{ list: 'ordered' }, { list: 'bullet' },],
                ['link'],
              ],
            },
            theme: 'snow',
          });

          this.richNotesField.on('text-change', () => {
            $el.trigger('updateText', this.richNotesField.root.innerHTML);
          });
        }

        const rnRoot = this.richNotesField.root;
        const closestCollapse = jQuery(rnRoot.closest('.row.can-collapse'));
        const activeHeight = jQuery(rnRoot.closest('.collapsable-inner')).outerHeight(true);

        closestCollapse.data('expandedHeight', activeHeight);

        if (closestCollapse.height > 0) {
          jQuery(rnRoot.closest('.row.can-collapse')).height(activeHeight);
        }
      },
      update($el, value) {
        if (!$el.hasClass('ql-container')) {
          // Quill has not yet been initialized. Insert the note
          // text as raw HTML.
          $el.html(value);
        } else {
          this.richNotesField.innerHTML = value;
        }
      },
      updateModel() { return true; },
      getVal($el, event, options, newText) {
        return newText[0];
      },
    };

    return bindings;
  },
});
