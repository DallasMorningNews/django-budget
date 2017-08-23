'use strict';

const babelify = require('babelify');
const browserify = require('browserify');
const buffer = require('vinyl-buffer');
const es = require('event-stream');
const gulp = require('gulp');
const gutil = require('gulp-util');
const rename = require('gulp-rename');
const source = require('vinyl-source-stream');
const sourcemaps = require('gulp-sourcemaps');
const uglify = require('gulp-uglify');
const watchify = require('watchify');


module.exports = (watch) => {
  const wrapper = watch ? watchify : b => b;

  return () => {
    const files = [
      'main-budget.js',
      'main-headlines.js',
    ];

    const tasks = files.map((entry) => {
      const props = {
        entries: `./src/js/${entry}`,
        extensions: ['.js'],
        cache: {},
        packageCache: {},
        debug: true,
      };

      const bundler = wrapper(browserify(props).transform(babelify, {
        presets: ['es2015'],
      }));

      function bundle() {
        return bundler.bundle()
          .on('error', gutil.log.bind(gutil, 'Browserify Error'))
          .pipe(source(entry))
          .pipe(buffer())
          .pipe(sourcemaps.init({ loadMaps: true }))
          .pipe(
              rename(
                  filePath => Object.assign(
                      filePath,
                      { dirname: `static/budget/js/` }
                  )
              )
          )
          .pipe(uglify({ mangle: false, compress: true }).on('error', gutil.log))
          .pipe(sourcemaps.write('./'))
          .pipe(gulp.dest('../'));
      }

      bundler.on('log', gutil.log);
      bundler.on('update', bundle);

      return bundle();
    });
    return es.merge.apply(null, tasks);
  };
};
