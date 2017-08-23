/* eslint-disable strict */

'use strict';

/* eslint-enable strict */

const changed = require('gulp-changed');
const gulp = require('gulp');


module.exports = () => {
  // Copies over all font files
  return gulp.src(['./src/test-data/**/*'], { nodir: true })
    .pipe(changed('../static/budget/test-data'))
    .pipe(gulp.dest('../static/budget/test-data'));
};
