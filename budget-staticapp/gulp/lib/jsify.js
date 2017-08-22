/* eslint import/no-extraneous-dependencies: "off" */
const argv = require('yargs').argv;
const babelify = require('babelify');
const browserify = require('browserify');
const buffer = require('vinyl-buffer');
const es = require('event-stream');
const gulp = require('gulp');
const gulpif = require('gulp-if');
const gutil = require('gulp-util');
// const rename = require('gulp-rename');
const source = require('vinyl-source-stream');
const sourcemaps = require('gulp-sourcemaps');
const uglify = require('gulp-uglify');
const watchify = require('watchify');


module.exports = (watch) => {
    const wrapper = watch ? watchify : b => b;

    return (cb) => {
        const files = ['main-budget.js', 'main-headlines.js'];

        const tasks = files.map((entry) => {
            const props = {
                entries: `./src/js/${entry}`,
                extensions: ['.js'],
                cache: {},
                packageCache: {},
                debug: argv.production !== true,
            };

            const bundler = wrapper(browserify(props).transform(babelify, {
                presets: ['es2015'],
            }));

            function bundle() {
                return bundler.bundle()
                    .on('error', gutil.log.bind(gutil, 'Browserify Error'))
                    .pipe(source(entry))
                    .pipe(buffer())
                    // .pipe(
                    //     gulpif(
                    //         argv.production,
                    //         // eslint-disable-next-line no-param-reassign
                    //         rename((defaultPath) => { defaultPath.basename += '.min'; })
                    //     )
                    // )
                    .pipe(sourcemaps.init({ loadMaps: true }))
                    .pipe(
                        gulpif(
                            argv.production,
                            uglify({ mangle: true, compress: true })
                                .on('error', gutil.log)
                        )
                    )
                    .pipe(sourcemaps.write('./'))
                    .pipe(gulp.dest('./dist/js/'));
            }

            bundler.on('log', gutil.log);
            bundler.on('update', bundle);

            return bundle();
        });

        return es.merge.apply(null, tasks).on('end', cb);
    };
};
