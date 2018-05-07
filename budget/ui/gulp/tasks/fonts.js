/* eslint-disable strict */

'use strict';

/* eslint-enable strict */

const changed = require('gulp-changed');
const gulp = require('gulp');


module.exports = () => {
  // Copies over all font files
  return gulp.src(['../staticapp/src/fonts/**/*'], { nodir: true })
    .pipe(changed('../static/budget/fonts'))
    .pipe(gulp.dest('../static/budget/fonts'));
};
