'use strict';

const gulp = require('./gulp')([
    'browserify',
    'nunjucks',
    'scss',
    'server',
    'watchify'
]);


gulp.task('default', ['nunjucks', 'scss', 'watchify', 'server']);

gulp.task('build', ['nunjucks', 'scss', 'browserify']);
