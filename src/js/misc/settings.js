define(function() {
    'use strict';

    return {
        contentTypes: {
            'text': {
                icon: 'fa fa-file-text-o',
                order: 1,
                usesLengthAttribute: true,
                verboseName: 'Article'
            },
            'photo': {
                icon: 'fa fa-picture-o',
                order: 2,
                usesLengthAttribute: false,
                verboseName: 'Photo(s)'
            },
            'video': {
                icon: 'fa fa-film',
                order: 3,
                usesLengthAttribute: false,
                verboseName: 'Video'
            },
            'audio': {
                icon: 'fa fa-volume-up',
                order: 4,
                usesLengthAttribute: false,
                verboseName: 'Audio'
            },
            'graphic': {
                icon: 'fa fa-line-chart',
                order: 5,
                usesLengthAttribute: false,
                verboseName: 'Graphic'
            },
            'interactive': {
                icon: 'fa fa-info-circle',
                order: 6,
                usesLengthAttribute: false,
                verboseName: 'Interactive page'
            },
            'other': {
                icon: 'fa fa-asterisk',
                order: 7,
                usesLengthAttribute: false,
                verboseName: 'Other content'
            }
        },

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
                slug: '1a'
            },
            {
                verboseName: 'Centerpiece',
                slug: 'centerpiece'
            },
            {
                verboseName: 'Section cover',
                slug: 'section-cover'
            },
            {
                verboseName: 'Inside pages',
                slug: 'inside-pages'
            },
            {
                verboseName: 'Other',
                slug: 'other'
            }
        ],

        typeRankingIndex: {
            person: 1,
            hub: 5,
            vertical: 9
        },

        urlConfig: {
            hubEndpoint: 'http://datalab.dallasnews.com/staff/api/hub/',
            // packageEndpoint: 'test-data/packages.json',
            packageEndpoint: 'http://datalab.dallasnews.com/budget/packages/',
            stafferEndpoint: 'http://datalab.dallasnews.com/staff/api/staff/',
            postEndpoints: {
                deletePackage: 'http://datalab.dallasnews.com/budget/package/delete/',
                savePackage: 'http://datalab.dallasnews.com/budget/package/',
                headlines: {
                    submitVote: 'http://datalab.dallasnews.com/budget/headline/vote/'
                },
                package: {
                    delete: 'http://datalab.dallasnews.com/budget/package/delete/',  // To be migrated to in the app.
                    save: 'http://datalab.dallasnews.com/budget/package/',  // To be migrated to in the app.
                    updatePrintInfo: 'http://datalab.dallasnews.com/budget/package/print/',  // Already implemented.
                    updateWebInfo: 'http://datalab.dallasnews.com/budget/package/web/',  // Already implemented.
                },
            },
            getEndpoints: {
                packageDetailBase: 'http://datalab.dallasnews.com/budget/packages',
                package: {
                    detailBase: 'http://datalab.dallasnews.com/budget/packages',  // To be migrated to in the app.
                }
            },
        }
    };
});