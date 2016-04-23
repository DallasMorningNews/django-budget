define(
    [
        'backbone',
        'moment',
        'underscore',
        'collections/additional-content-items',
        'compositeviews/packages/edit',
        'itemviews/snackbars/snackbar.js',
        'layoutviews/packages/list',
        'models/package'
    ],
    function(
        Backbone,
        moment,
        _,
        AdditionalContentItems,
        PackageEditView,
        SnackbarView,
        PackageListView,
        Package
    ) {
        'use strict';

        var _radio = Backbone.Wreqr.radio.channel('global');

        return {
            home: function(querystring){
                var parsedQueryTerms = null,
                    parsedDateRange = {},
                    searchQueryTerms = [
                        'fullText',
                        'hub',
                        'person',
                        'vertical',
                    ],
                    dateQueryTerms = [
                        'startDate',
                        'endDate'
                    ];

                if (!_.isNull(querystring)) {
                    var invalidTerms = [];

                    parsedQueryTerms = _.chain(querystring.split('&'))
                        .map(
                            function(i){
                                var termParts = _.map(
                                        i.split('='),
                                        decodeURIComponent
                                    );

                                if (_.contains(searchQueryTerms, termParts[0])) {
                                    return {
                                        type: termParts[0],
                                        value: termParts[1]
                                    };
                                } else if (_.contains(dateQueryTerms, termParts[0])) {
                                    parsedDateRange[
                                        termParts[0].slice(0, -4)
                                    ] = moment(
                                        termParts[1]
                                    ).format('YYYY-MM-DD');

                                    return null;
                                } else {
                                    invalidTerms.push({
                                        type: termParts[0],
                                        value: termParts[1],
                                    });

                                    return null;
                                }

                            }
                        )
                        .compact()
                        .value();

                    if (!_.isEmpty(invalidTerms)) {
                        _.each(
                            invalidTerms,
                            function(term) {
                                var message = '' +
                                    'Invalid querystring term: "' +
                                    encodeURIComponent(term.type) + '=' +
                                    encodeURIComponent(term.value) + '" ' +
                                    '(ignored)';
                                console.log(message);
                            }
                        );
                    }
                }

                _radio.commands.execute(
                    'switchMainView',
                    PackageListView,
                    {
                        'dateRange': parsedDateRange,
                        'queryTerms': parsedQueryTerms
                    }
                );
            },
            edit: function(packageID) {
                var additionalItemCollection = new AdditionalContentItems();

                if (_.isUndefined(packageID)) {
                    _radio.commands.execute(
                        'switchMainView',
                        PackageEditView,
                        {
                            collection: additionalItemCollection,
                        }
                    );
                } else {
                    var packageToEdit = new Package({
                        id: parseInt(packageID, 10)
                    });

                    packageToEdit.fetch({
                        success: function(model, response, options) {
                            console.log("Fetched package with ID '" + model.id + "'.");

                            _radio.commands.execute(
                                'switchMainView',
                                PackageEditView,
                                {
                                    model: packageToEdit,
                                    collection: additionalItemCollection,
                                }
                            );
                        },
                        error: function(model, response, options) {
                            if (response.status == 404) {
                                // Redirect to the home page.
                                _radio.commands.execute('navigate', '', {trigger: true});

                                // Display snackbar:
                                _radio.commands.execute(
                                    'showSnackbar',
                                    new SnackbarView({
                                        snackbarClass: 'failure',
                                        text: 'Could not find that item.',
                                    })
                                );
                            } else {
                                // Redirect to the home page.
                                _radio.commands.execute('navigate', '', {trigger: true});

                                // Display snackbar:
                                _radio.commands.execute(
                                    'showSnackbar',
                                    new SnackbarView({
                                        snackbarClass: 'failure',
                                        text: 'Could not load that item.',
                                    })
                                );
                            }
                        },
                    });
                }
            },
            fourohfour: function(){
                console.log("404.");
            },
        };
    }
);