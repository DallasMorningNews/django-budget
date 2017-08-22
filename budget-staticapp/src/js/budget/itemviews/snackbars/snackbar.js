import _ from 'underscore';
import Backbone from 'backbone';
import jQuery from 'jquery';
import Mn from 'backbone.marionette';

export default Mn.ItemView.extend({
    template: 'budget/snackbar-base',

    // id: '',
    // className: 'center-content',

    serializeData() {
        return this.config;
    },

    ui: {
        actionTrigger: '.action-trigger',
    },

    events: {
        'click @ui.actionTrigger': 'hideVisibleSnackbar',
    },

    attributes() {
        if (typeof this.config === 'undefined') {
            return {};
        }

        return {
            class: `snackbar ${
                this.config.snackbarClass
            } ${
                this.config.lineCount
            }-line`,
        };
    },

    initialize() {
        const defaultConfig = {
            containerClass: null,
            text: '',
            lineCount: 1,
            snackbarClass: 'generic-snackbar',
            action: null,
        };

        this.config = _.chain(this.options)
                            .defaults(defaultConfig)
                            .omit(
                                (value, key) =>
                                    !_.chain(defaultConfig)
                                          .keys()
                                          .contains(key)
                                          .value()
                            )
                            .value();
    },

    onRender() {
        this.$el.attr(_.result(this, 'attributes'));
    },

    onDomRefresh() {
        const radio = Backbone.Wreqr.radio.channel('global');

        if (!_.isNull(this.config.containerClass)) {
            this.$el.parent().removeClass().addClass(this.config.containerClass);
        } else {
            this.$el.parent().removeClass();
        }


        this.$el
            .delay(825).queue(
                () => {
                    jQuery(this.$el).addClass('active').dequeue();
                }
            );
        this.$el
            .delay(5000).queue(
                () => {
                    jQuery(this.$el).removeClass('active').dequeue();
                }
            );
        this.$el
            .delay(1000).queue(
                () => {
                    radio.commands.execute('clearRegion', 'snackbarHolder');
                    jQuery(this.$el).dequeue();
                }
            );
    },

    hideVisibleSnackbar() {
        if (this.$el.hasClass('active')) {
            this.$el.removeClass('active');
        }
    },
});
