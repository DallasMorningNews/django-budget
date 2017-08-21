(function($) {
    var stafferList = [];

    function initializeStaffSelector() {
        var fieldContainer = $(this);

        var isSingleSelect = fieldContainer.hasClass('single-value');
        var maxItems = isSingleSelect ? 1 : 50;
        var plugins = isSingleSelect ? [] : ['remove_button', 'restore_on_backspace'];

        var originalField = fieldContainer.find('.original-html textarea');
        var originalValue = originalField.val() === '' ? null : originalField.val();

        var parsedOriginalValue = $.parseJSON(originalValue);
        var payload = (
            _.isArray(parsedOriginalValue)
        ) ? (
            _.clone(parsedOriginalValue)
        ) : (
            []
        );

        var stafferSelect = fieldContainer.find('select');

        stafferSelect.selectize({
            allowEmptyOption: true,
            items: _.intersection(
                _.pluck(stafferList, 'email'),
                _.pluck(payload, 'email')
            ),
            hideSelected: true,
            highlight: false,
            labelField: 'fullName',
            maxItems: maxItems,
            searchField: ['fullName',],
            onItemAdd: function(value, $item) {
                payload.push(_(stafferList).findWhere({ email: value }));

                updateInput();
            },
            onItemRemove: function(value) {
                payload = _.reject(payload, { email: value });

                updateInput();
            },
            options: stafferList,
            plugins: plugins,
            render: {
                option: function(item, escape) {
                    return '<div>' +
                        '<span class="image-holder">' +
                            '<img src="' + item.imageURL + '" '+
                                  'alt="' + item.fullName + '" />' +
                        '</span>' +
                        '<span class="title">' +
                            '<span class="name">' +
                                escape(item.fullName) +
                            '</span>' +
                        '</span>' +
                        '<span class="email">' +
                            escape(item.email) +
                        '</span>' +
                    '</div>';
                }
            },
            valueField: 'email'
        });

        function updateInput() {
            originalField.val(
                (_.isEmpty(payload)) ? 'null' : JSON.stringify(payload)
            );
        }
    }

    $(document).ready(function() {
        var staffLoaded = $.ajax({ dataType: 'json', url: '/staff/api/staff/' });

        window.renderStaffSelector = initializeStaffSelector;

        staffLoaded.done(function(data) {
            stafferList = data;

            $('.staffer-select-outer').each(function() {
              initializeStaffSelector.apply(this);
            });
        });
    });
})((typeof django === 'undefined') ? jQuery : django.jQuery);
