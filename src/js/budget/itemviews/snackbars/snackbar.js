define([
    'backbone',
    'jquery',
    'marionette',
    'underscore',
    'common/tpl',
], function(
    Backbone,
    $,
    Mn,
    _,
    tpl
) {
    return Mn.ItemView.extend({
        template: tpl('snackbar-base'),

        // id: '',
        // className: 'center-content',

        serializeData: function() {
            return this.config;
        },

        ui: {
            actionTrigger: '.action-trigger',
        },

        events: {
            'click @ui.actionTrigger': 'hideVisibleSnackbar',
        },

        attributes: function() {
            if (typeof(this.config) === 'undefined') {
                return {};
            }

            return {
                class: 'snackbar ' + this.config.snackbarClass + ' ' +
                            this.config.lineCount + '-line',
            };
        },

        initialize: function() {
            var defaultConfig = {
                containerClass: null,
                text: '',
                lineCount: 1,
                snackbarClass: 'generic-snackbar',
                action: null,
            };

            this.config = _.chain(this.options)
                                .defaults(defaultConfig)
                                .omit(function(value, key, object) {  // eslint-disable-line no-unused-vars,max-len
                                    return !_.chain(defaultConfig)
                                                .keys()
                                                .contains(key)
                                                .value();
                                })
                                .value();
        },

        onRender: function() {
            this.$el.attr(_.result(this, 'attributes'));
        },

        onDomRefresh: function() {
            var radio = Backbone.Wreqr.radio.channel('global');

            if (!_.isNull(this.config.containerClass)) {
                this.$el.parent().removeClass().addClass(this.config.containerClass);
            } else {
                this.$el.parent().removeClass();
            }


            this.$el
                .delay(825).queue(
                    function() {
                        $(this).addClass('active').dequeue();
                    }
                );
            this.$el
                .delay(5000).queue(
                    function() {
                        $(this).removeClass('active').dequeue();
                    }
                );
            this.$el
                .delay(1000).queue(
                    function() {
                        radio.commands.execute('clearRegion', 'snackbarHolder');
                        $(this).dequeue();
                    }
                );
        },

        hideVisibleSnackbar: function() {
            if (this.$el.hasClass('active')) {
                this.$el.removeClass('active');
            }
        },
    });
});
