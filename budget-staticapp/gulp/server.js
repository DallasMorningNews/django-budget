/* eslint import/no-extraneous-dependencies: "off" */
const browserSync = require('browser-sync').create();
const gulp = require('gulp');


module.exports = function server() {
    browserSync.init({
        files: ['./dist/**/*.*'],
        open: 'local',
        ghostMode: false,
        server: {
            baseDir: './dist/',
        },
        reloadDelay: 500,
    });

    gulp.watch(
        './src/templates/**/*.{html,njk}',
        { usePolling: true, interval: 1000 },
        gulp.task('nunjucks')
    );
    gulp.watch(
        './src/js/**',
        { usePolling: true, interval: 1000 },
        gulp.task('eslint')
    );
    gulp.watch(
        './src/scss/*.scss',
        { usePolling: true, interval: 1000 },
        gulp.task('build-styles')
    );
};
