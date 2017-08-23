'use strict';

const gulp = require('./gulp')([
    'browserify',
    'fonts',
    'images',
    'nunjucks',
    'scss',
    'server',
    'test-data',
    'watchify'
]);


gulp.task(
  'default',
  [
    'fonts',
    'images',
    'test-data',
    'nunjucks',
    'scss',
    'watchify',
    'server'
  ]
);

gulp.task(
  'build',
  [
    'fonts',
    'images',
    'test-data',
    'nunjucks',
    'scss',
    'browserify'
  ]
);
