define(
    [
        'backbone',
        'jquery',
        'marionette',
    ],
    function(
        Backbone,
        $,
        Mn
    ) {
        'use strict';

        return Mn.ItemView.extend({
            className: 'package-sheet-holder',

            modelEvents: {
                change: 'render',
            },

            initialize: function() {
                this._radio = Backbone.Wreqr.radio.channel('global');

                this.initEnd();
            },

            serializeData: function() {
                var templateContext = {};

                return templateContext;
            },

            onAttach: function() {
                this.$el.find('.might-overflow').bind('mouseenter', function() {
                    var $this = $(this);

                    if (this.offsetWidth < this.scrollWidth && !$this.attr('title')) {
                        $this.attr('title', $this.text());
                    }
                });
            },

            addButtonClickedClass: function(event) {
                var thisEl = $(event.currentTarget);
                thisEl.addClass('active-state');
                thisEl.removeClass('click-init');

                setTimeout(
                    function() {
                        thisEl.removeClass('hover').removeClass('active-state');
                    },
                    1000
                );

                setTimeout(
                    function() {
                        thisEl.addClass('click-init');
                    },
                    2000
                );
            },
        });
    }
);
