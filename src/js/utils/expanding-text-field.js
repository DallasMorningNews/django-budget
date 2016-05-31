define([
    'jquery'
], function(
    $
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