define(function() {
    'use strict';

    return {
        notFound: {
            pattern: /^.+$/,
            name: 'fourohfour'
        },
        listPage: {
            pattern: /^([\s\d\w\&\=\-\%\.]*)\/{0,1}$/,
            name: 'home'
        },
        printListPage: {
            pattern: /^print\/([\s\d\w\&\=\-\%\.]*)\/{0,1}$/,
            name: 'printList'
        },
        createPage: {
            pattern: /^edit\/{0,1}$/,
            name: 'edit'
        },
        editPage: {
            pattern: /^edit\/(\d+)\/{0,1}$/,
            name: 'edit'
        }
    };
});