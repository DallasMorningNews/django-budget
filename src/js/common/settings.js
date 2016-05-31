define(function() {
    'use strict';

    return {
        apiEndpoints: {
            POST: {
                additionalItem: {
                    delete: 'http://datalab.dallasnews.com/budget/delete-additional-item/'
                },
                headline: {
                    submitVote: 'http://datalab.dallasnews.com/budget/headline/vote/'
                },
                package: {
                    delete: 'http://datalab.dallasnews.com/budget/package/delete/',
                    save: 'http://datalab.dallasnews.com/budget/package/',  // To be migrated to in the app.
                    updatePrintInfo: 'http://datalab.dallasnews.com/budget/package/print/',
                    updateWebInfo: 'http://datalab.dallasnews.com/budget/package/web/',
                },
            },
            GET: {
                hub: {
                    list: 'http://datalab.dallasnews.com/staff/api/hub/'
                },
                staffer: {
                    list: 'http://datalab.dallasnews.com/staff/api/staff/',
                },
                package: {
                    detail: 'http://datalab.dallasnews.com/budget/packages/',
                    list: {
                        print: 'http://datalab.dallasnews.com/budget/packages/for-print/',
                        web: 'http://datalab.dallasnews.com/budget/packages/',
                    }
                }
            },
        },

        buttonHideWidth: 600,

        contentTypes: {
            'text': {
                icon: 'fa fa-file-text-o',
                order: 1,
                usesLengthAttribute: true,
                usesPitchSystem: false,
                verboseName: 'Article'
            },
            'photo': {
                icon: 'fa fa-picture-o',
                order: 2,
                usesLengthAttribute: false,
                usesPitchSystem: true,
                verboseName: 'Photo(s)'
            },
            'video': {
                icon: 'fa fa-film',
                order: 3,
                usesLengthAttribute: false,
                usesPitchSystem: true,
                verboseName: 'Video'
            },
            'audio': {
                icon: 'fa fa-volume-up',
                order: 4,
                usesLengthAttribute: false,
                usesPitchSystem: false,
                verboseName: 'Audio'
            },
            'graphic': {
                icon: 'fa fa-line-chart',
                order: 5,
                usesLengthAttribute: false,
                usesPitchSystem: true,
                verboseName: 'Graphic'
            },
            'interactive': {
                icon: 'fa fa-info-circle',
                order: 6,
                usesLengthAttribute: false,
                usesPitchSystem: false,
                verboseName: 'Interactive page'
            },
            'other': {
                icon: 'fa fa-asterisk',
                order: 7,
                usesLengthAttribute: false,
                usesPitchSystem: false,
                verboseName: 'Other content'
            }
        },

        externalURLs: {
            addVisualsRequest: 'https://sites.google.com/a/dallasnews.com/dmnutilities/add-request'
        },

        pollInterval: 20 * 1000,

        messages: {
            slugField: {
                ajaxError: 'Could not check if that slug is unique. Try again later.',
                defaultMessage: 'Enter a unique value.',
                nonUniqueError: 'That slug is already taken. Please choose something else.',
                successfullyUniqueValue: 'Your slug is unique.',
                tooShortError: 'Slugs must be four or more characters long.',
            }
        },

        printPlacementTypes: [
            {
                verboseName: '1A',
                slug: '1a',
                order: 1
            },
            {
                verboseName: 'Centerpiece',
                slug: 'centerpiece',
                order: 2
            },
            {
                verboseName: 'Section cover',
                slug: 'section-cover',
                order: 3
            },
            {
                verboseName: 'Inside pages',
                slug: 'inside-pages',
                order: 4
            },
            {
                verboseName: 'Other',
                slug: 'other',
                order: 5
            }
        ],

        typeRankingIndex: {
            person: 1,
            hub: 5,
            vertical: 9
        },
    };
});