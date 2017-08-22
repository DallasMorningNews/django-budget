/* eslint import/no-extraneous-dependencies: "off" */
const argv = require('yargs').argv;
const eslint = require('gulp-eslint');
const gulp = require('gulp');
const gulpif = require('gulp-if');


module.exports = () =>
    gulp.src('./src/js/**/*.js')
        .pipe(eslint({
            configFile: './.eslintrc.json',
        }))
        .pipe(gulpif(argv.lint, eslint.format()))
        .pipe(gulpif(argv.production && argv.lint, eslint.failAfterError()));
