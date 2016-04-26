define(
    [
        'moment',
        'underscore',
    ],
    function(
        moment,
        _
    ) {
        'use strict';

        return {
            parse: function(querystring) {
                var parsedQueryTerms = [],
                    parsedDateRange = {},
                    invalidTerms = [],
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

                    // Log invalid query terms.
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

                return {
                    queryTerms: parsedQueryTerms,
                    dateRange: parsedDateRange,
                    invalidTerms: invalidTerms,
                };
            }
        };
    }
);