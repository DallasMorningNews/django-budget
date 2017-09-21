/* eslint-disable strict */

'use strict';

/* eslint-enable strict */

const changed = require('gulp-changed');
const gulp = require('gulp');


module.exports = () => {
  // Copies over all font files
  return gulp.src(['./fonts/**/*'], { nodir: true })
    .pipe(changed('../static/staff/fonts'))
    .pipe(gulp.dest('../static/staff/fonts'));
};
