'use strict';

const argv = require('yargs').argv;
const autoprefixer = require('autoprefixer');
const eyeglass = require('eyeglass');
const gulp = require('gulp');
const gulpif = require('gulp-if');
const header = require('gulp-header');
const path = require('path');
const postcss = require('gulp-postcss');
const rename = require('gulp-rename');
const sass = require('gulp-sass');
const sourcemaps = require('gulp-sourcemaps');

// const compass = require('gulp-compass');


// const sassConfig = {
//   outputStyle: 'compressed',
//   eyeglass: {
//     root: path.join(__dirname, '../../node_modules'),
//   },
//   precision: 8, // per https://github.com/twbs/bootstrap-sass#configuration
// };
const sassConfig = {
    outputStyle: 'compressed',
    includePaths: ['./src/scss',],
};


module.exports = () =>
  gulp.src(['./src/scss/**/*.scss'])
    // .pipe(compass({
    //   css: 'css',
    //   sass: 'sass',
    // }))
    // .pipe(sourcemaps.init())
    .pipe(
        gulpif(
            argv.offline,
            header('$offline: true;\n'), header('$offline: false;\n')
        )
    )
    .pipe(sass(eyeglass(sassConfig)).on('error', sass.logError))
    // .pipe(postcss([autoprefixer({
    //   browsers: [
    //     'Android 2.3',
    //     'Android >= 4',
    //     'Chrome >= 20',
    //     'Firefox >= 24',
    //     'Explorer >= 8',
    //     'iOS >= 6',
    //     'Opera >= 12',
    //     'Safari >= 6',
    //   ],  // per https://github.com/twbs/bootstrap-sass#configuration
    // })]))
    .pipe(
      rename(
        filePath => Object.assign(
          filePath,
          // eslint-disable-next-line comma-dangle
          { dirname: `static/budget/css/` }
        )  // eslint-disable-line comma-dangle
      )  // eslint-disable-line comma-dangle
    )
    // .pipe(sourcemaps.write('./'))
    .pipe(gulp.dest('../'));
