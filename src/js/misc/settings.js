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

        urlConfig: {
            hubEndpoint: 'http://192.168.12.17:8000/staff/api/hub/',
            // packageEndpoint: 'test-data/packages.json',
            packageEndpoint: 'http://192.168.12.17:8000/budget/packages/',
            searchOptionEndpoint: 'test-data/search-box-options.json',
            stafferEndpoint: 'http://192.168.12.17:8000/staff/api/staff/',
            postEndpoints: {
                itemMarkReady: 'http://192.168.12.17:8000/budget/content/ready/',
                deletePackage: 'http://192.168.12.17:8000/budget/package/delete/',
                savePackage: 'http://192.168.12.17:8000/budget/package/',
                headlines: {
                    submitVote: 'http://192.168.12.17:8000/budget/headline/vote/'
                },
                package: {
                    delete: 'http://192.168.12.17:8000/budget/package/delete/',  // To be migrated to in the app.
                    save: 'http://192.168.12.17:8000/budget/package/',  // To be migrated to in the app.
                    updatePrintInfo: 'http://192.168.12.17:8000/budget/package/print/',  // Already implemented.
                    updateWebInfo: 'http://192.168.12.17:8000/budget/package/web/',  // Already implemented.
                },
            },
            getEndpoints: {
                packageDetailBase: 'http://192.168.12.17:8000/budget/packages'
            },
        }
    };
});