# Imports from Django.  # NOQA
from django.forms import (  # NOQA
    TextInput,
    DateInput,
    FileInput,
    CheckboxInput,
    # MultiWidget,
    ClearableFileInput,
    # Select,
    # RadioSelect,
    # CheckboxSelectMultiple,
    NumberInput,
    EmailInput,
    URLInput
)


# Imports from other dependencies.
from bootstrap3.forms import render_label
from bootstrap3.renderers import FieldRenderer
from bootstrap3.text import text_value


WIDGETS_WITH_UNDERLINE = (
    TextInput,
    DateInput,
    FileInput,
    ClearableFileInput,
    NumberInput,
    EmailInput,
    URLInput
)


class ImmaterialFieldRenderer(FieldRenderer):
    # def add_placeholder_attrs(self, widget=None):
        # if not isinstance(self.widget, WIDGETS_WITH_UNDERLINE):
        #     super(ImmaterialFieldRenderer, self).add_placeholder_attrs(
        #         widget
        #     )
    def post_widget_render(self, html):
        """Override adds helper class to checkboxes."""
        if isinstance(self.widget, CheckboxInput):
            return self.put_inside_label(
                '{}{}'.format(
                    html,
                    '<span class="ripple"></span><i class="helper"></i>'
                )
            )
        else:
            return super(ImmaterialFieldRenderer, self).post_widget_render(
                html
            )

    def add_label(self, html):
        """Override adds label _after_ input."""
        label = self.get_label()
        if label:
            if isinstance(self.widget, WIDGETS_WITH_UNDERLINE):
                html = '{}{}{}'.format(
                    html,
                    render_label(
                        label,
                        label_for=self.field.id_for_label,
                        label_class=self.get_label_class()
                    ),
                    '<i class="bar"></i>'
                )
            else:
                html = '{}{}{}'.format(
                    render_label(
                        label,
                        label_for=self.field.id_for_label,
                        label_class=self.get_label_class()
                    ),
                    html
                )
        return html

    def _render(self):
        """Override adds helptext (append_to_field) later than usual."""
        # See if we're not excluded
        if self.field.name in self.exclude.replace(' ', '').split(','):
            return ''
        # Hidden input requires no special treatment
        if self.field.is_hidden:
            return text_value(self.field)

        # Render the widget
        self.add_widget_attrs()
        html = self.field.as_widget(attrs=self.widget.attrs)

        # l = self.get_label()
        # if not l:
        #     print('u')
        #     print(html)

        self.restore_widget_attrs()

        # l = self.get_label()
        # if not l:
        #     print('v')
        #     print(html)

        # Start post render
        html = self.post_widget_render(html)

        # l = self.get_label()
        # if not l:
        #     print('w')
        #     print(html)

        html = self.wrap_widget(html)

        # l = self.get_label()
        # if not l:
        #     print('x')
        #     print(html)

        html = self.make_input_group(html)

        # l = self.get_label()
        # if not l:
        #     print('y')
        #     print(html)

        html = self.wrap_field(html)
        html = self.add_label(html)
        html = self.append_to_field(html)
        html = self.wrap_label_and_field(html)
        return html
