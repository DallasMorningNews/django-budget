require.config({
    paths: {
        templates: '../../build/js/templates',
        backbone: '../../bower_components/backbone/backbone',
        underscore: '../../bower_components/underscore/underscore',
        datePicker: '../../bower_components/air-datepicker/dist/js/datepicker.min',
        deepModel: '../../bower_components/backbone-deep-model/distribution/deep-model',
        marionette: '../../bower_components/backbone.marionette/lib/backbone.marionette',
        stickit: '../../bower_components/backbone.stickit/backbone.stickit',
        // underscore: '../../bower_components/underscore/underscore',

        jquery: '../../bower_components/jquery/dist/jquery',
        // 'jquery-timeago': '../../bower_components/jquery-timeago/jquery.timeago',
        lunr: '../../bower_components/lunr.js/lunr',
        nunjucks: '../../bower_components/nunjucks/browser/nunjucks-slim',
        moment: '../../bower_components/moment/moment',
        'moment-timezone': '../../bower_components/moment-timezone/builds/moment-timezone-with-data-2010-2020',  // eslint-disable-line max-len
        // resize: '../../bower_components/javascript-detect-element-resize/detect-element-resize',
        // smartquotes: '../../bower_components/smartquotes/src/smartquotes',
        quill: '../../bower_components/quill/dist/quill',
        selectize: '../../bower_components/selectize/dist/js/selectize',
        sifter: '../../bower_components/sifter/sifter',
        microplugin: '../../bower_components/microplugin/src/microplugin',
        'underscore.string': '../../bower_components/underscore.string/dist/underscore.string',
        vex: '../../bower_components/vex/js/vex',
        // 'spin': '../../bower_components/spin.js/spin'
        foundation: '../../build/js/foundation-transpiled',
        dateRangePicker: '../../vendored/longbill-daterangepicker/daterangepicker',
    },
    shim: {
        backbone: {
            deps: ['underscore'],
        },
        dateRangePicker: {
            deps: ['jquery', 'moment'],
        },
        deepModel: {
            deps: ['underscore', 'backbone'],
        },
        foundation: {
            deps: ['jquery'],
        },
        'moment-timezone': {
            deps: ['moment'],
        },
        underscore: {
            exports: '_',
        },
        'underscore.string': {
            deps: ['underscore'],
        },
    },
});
