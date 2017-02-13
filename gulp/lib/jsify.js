/* eslint import/no-extraneous-dependencies: "off" */
const argv = require('yargs').argv;
const babelify = require('babelify');
const browserify = require('browserify');
const buffer = require('vinyl-buffer');
const es = require('event-stream');
const glob = require('glob');
const gulp = require('gulp');
const gulpif = require('gulp-if');
const gutil = require('gulp-util');
const path = require('path');
const source = require('vinyl-source-stream');
// const sourcemaps = require('gulp-sourcemaps');
const uglify = require('gulp-uglify');
const watchify = require('watchify');

module.exports = (watch) => {
    const bundlerWrapper = watch ? watchify : s => s;

    return (cb) => {
        glob('./src/js/main-*.js', (err, files) => {
            if (err) return cb(err);
            const tasks = files.map((file) => {
                const props = {
                    cache: {},
                    packageCache: {},
                    entries: file,
                    debug: argv.production !== true,
                    global: true,
                    presets: ['es2015'],
                };

                const bundler = bundlerWrapper(browserify(props));

                bundler
                    .transform(babelify);

                function bundle() {
                    return bundler.bundle()
                        .on('error', gutil.log.bind(gutil, 'Browserify Error'))
                        .pipe(source(path.basename(file)))
                        .pipe(buffer())
                        // .pipe(sourcemaps.init({ loadMaps: true }))
                        .pipe(gulpif(argv.production, uglify().on('error', () => {
                        })))
                        // .pipe(sourcemaps.write('./'))
                        .pipe(gulp.dest('dist/js/'));
                }

                bundler.on('log', gutil.log);
                bundler.on('update', bundle);

                return bundle();
            });

            return es.merge(tasks).on('end', cb);
        });
    };
};
