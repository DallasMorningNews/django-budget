/* eslint-disable strict */

'use strict';

/* eslint-enable strict */

const changed = require('gulp-changed');
const gulp = require('gulp');


module.exports = () => {
  // Copies over all image files
  return gulp.src(['./images/**/*'], { nodir: true })
    .pipe(changed('../static/staff/images'))
    .pipe(gulp.dest('../static/staff/images'));
};
