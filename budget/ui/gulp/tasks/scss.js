'use strict';

const autoprefixer = require('autoprefixer');
const eyeglass = require('eyeglass');
const gulp = require('gulp');
const path = require('path');
const postcss = require('gulp-postcss');
const rename = require('gulp-rename');
const sass = require('gulp-sass');
const sourcemaps = require('gulp-sourcemaps');


const sassConfig = {
  outputStyle: 'compressed',
  eyeglass: {
    // `process.env.INIT_CWD` returns the directory `gulp` was called from.
    root: path.join(process.env.INIT_CWD, 'node_modules'),
  },
};

module.exports = () =>
  gulp.src(['../staticapp/src/scss/**/*.scss', '../staticapp/src/scss/**/*.css'])
    .pipe(sourcemaps.init())
    .pipe(sass(eyeglass(sassConfig)).on('error', sass.logError))
    .pipe(postcss([autoprefixer({
      browsers: [
        'Android 2.3',
        'Android >= 4',
        'Chrome >= 20',
        'Firefox >= 24',
        'Explorer >= 8',
        'iOS >= 6',
        'Opera >= 12',
        'Safari >= 6',
      ],  // per https://github.com/twbs/bootstrap-sass#configuration
    })]))
    .pipe(rename(filePath => Object.assign(filePath, {
      dirname: `../static/budget/css/`,
    })))
    .pipe(sourcemaps.write('./'))
    .pipe(gulp.dest('./'));
