require.config({
    paths: {
        templates: '../../build/js/templates',
        backbone: '../../bower_components/backbone/backbone',
        'ckeditor-core': '../../bower_components/ckeditor/ckeditor',
        'ckeditor-jquery': '../../bower_components/ckeditor/adapters/jquery',
        marionette: '../../bower_components/backbone.marionette/lib/backbone.marionette',
        underscore: '../../bower_components/underscore/underscore',
        jquery: '../../bower_components/jquery/dist/jquery',
        // 'jquery-timeago': '../../bower_components/jquery-timeago/jquery.timeago',
        nunjucks: '../../bower_components/nunjucks/browser/nunjucks-slim',
        moment: '../../bower_components/moment/moment',
        'moment-timezone': '../../bower_components/moment-timezone/builds/moment-timezone-with-data-2010-2020',
        // resize: '../../bower_components/javascript-detect-element-resize/detect-element-resize',
        // smartquotes: '../../bower_components/smartquotes/src/smartquotes',
        quill: '../../bower_components/quill/dist/quill',
        selectize: '../../bower_components/selectize/dist/js/selectize',
        sifter: '../../bower_components/sifter/sifter',
        microplugin: '../../bower_components/microplugin/src/microplugin',
        vex: '../../bower_components/vex/js/vex',
        // 'spin': '../../bower_components/spin.js/spin'
        'foundation': '../../build/js/foundation-transpiled',
        'dateRangePicker': '../../vendored/longbill-daterangepicker/daterangepicker'
    },
    shim: {
        'ckeditor-core': {
            exports: 'CKEDITOR'
        },
        'ckeditor-jquery': {
            deps: ['jquery', 'ckeditor-core'],
        },
        'dateRangePicker': {
            deps: ['jquery', 'moment']
        },
        'foundation': {
            deps: ['jquery']
        },
        'moment-timezone': {
            deps: ['moment']
        }
    }
});