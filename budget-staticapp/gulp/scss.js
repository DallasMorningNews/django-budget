/* eslint import/no-extraneous-dependencies: "off" */
const argv = require('yargs').argv;
const gulp = require('gulp');
const gulpif = require('gulp-if');
const header = require('gulp-header');
const sass = require('gulp-sass');
const sourcemaps = require('gulp-sourcemaps');


module.exports = () => {
  // See https://github.com/sass/node-sass#options
    const scssOpts = {
        outputStyle: argv.production ? 'compressed' : 'nested',
        includePaths: [],
    };

    return gulp.src('./src/scss/**/*.scss')
        .pipe(sourcemaps.init())
        .pipe(gulpif(argv.offline, header('$offline: true;\n'), header('$offline: false;\n')))
        .pipe(sass(scssOpts).on('error', sass.logError))
        .pipe(sourcemaps.write('.', { sourceMappingURLPrefix: '' }))
        .pipe(gulp.dest('./dist/css'));
};
