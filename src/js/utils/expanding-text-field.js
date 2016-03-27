define([
    'jquery',
    // 'underscore',
    // 'backbone',
    // 'marionette',
    // 'collections/additional-content-items',
    // 'collectionviews/additional-content/additional-form-holder',
    // 'misc/settings',
    // 'misc/tpl',
    // 'utils/expanding-text-field',
    // 'selectize',
    // 'moment',
    // 'moment-timezone',
    // 'dateRangePicker'
], function(
    $
    // _,
    // Backbone,
    // Mn,
    // AdditionalContentItems,
    // AdditionalFormHolderView,
    // settings,
    // tpl,
    // expandingTextField,
    // selectize,
    // moment,
    // mmtz,
    // dateRangePicker
) {
    return {
        make: function(expandingEl) {
            var preTag = $('<pre><span></span><br></pre>'),
                span = preTag.find('span');

            expandingEl.after(preTag);

            if (expandingEl[0].addEventListener) {
                expandingEl.bind('input',
                    function() {
                        span.html(expandingEl.val());

                        if ($.trim(expandingEl.val())) {
                            if (!expandingEl.parent().hasClass('has-value')) {
                                expandingEl.parent().addClass('has-value');
                            }
                        } else {
                            if (expandingEl.parent().hasClass('has-value')) {
                                expandingEl.parent().removeClass('has-value');
                            }
                        }
                    }
                );

                span.html(expandingEl.val());

                expandingEl.bind('focus', function() {
                    expandingEl.parent().addClass('input-focused');
                });

                expandingEl.bind('blur', function() {
                    expandingEl.parent().removeClass('input-focused');
                });
            }

            expandingEl.parent().addClass('expanding-enabled');
        }
    };
});