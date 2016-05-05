var gulp = require('gulp'),
    jshint = require('gulp-jshint'),
    sass = require('gulp-sass'),
    concat = require('gulp-concat'),
    awspublish = require('gulp-awspublish'),
    requirejsOptimize = require('gulp-requirejs-optimize'),
    sourcemaps = require('gulp-sourcemaps'),
    nunjucks = require('gulp-nunjucks'),
    browserSync = require('browser-sync').create(),
    path = require('path'),
    rename = require('gulp-rename');
var babel = require('gulp-babel');


/**
 * JavaScript tasks
 */

gulp.task('jshint', function() {
    return gulp.src('src/js/**/*.js')
        .pipe(jshint())
        .pipe(jshint.reporter('default'))
        .pipe(jshint.reporter('fail'));
});

gulp.task('nunjucks', function() {
    var nunjuckOpts = {
        name: function(file) {
            return file.relative.split('.')[0];
        }
    };

    return gulp.src('./src/templates/**.html')
        .pipe(nunjucks.precompile(nunjuckOpts))
        .pipe(concat('templates.js'))
        .pipe(gulp.dest('build/js/'));
});

gulp.task('foundation-js', function() {
    return gulp.src([
        // Foundation core - needed if you want to use any of the components below
        './bower_components/foundation-sites/js/foundation.core.js',
        './bower_components/foundation-sites/js/foundation.util.*.js',

        // Foundation components
        './bower_components/foundation-sites/js/foundation.reveal.js',
        './bower_components/foundation-sites/js/foundation.tooltip.js',
    ])
        .pipe(babel())
        .pipe(concat('foundation-transpiled.js'))
        .pipe(gulp.dest('build/js/'));
});

gulp.task('rjs-budget', ['nunjucks', 'foundation-js'], function() {
    /* See https://github.com/jrburke/r.js/blob/master/build/example.build.js */
    var rjsBudgetOpts = {
        baseUrl: 'src/js',
        mainConfigFile: 'src/js/config.js',
        optimize: 'uglify2',
        include: ['config', 'budget/main'],
        name: '../../bower_components/almond/almond',
        preserveLicenseComments: false
    };

    return gulp.src('src/js/budget/main.js')
        .pipe(sourcemaps.init())
        .pipe(requirejsOptimize(rjsBudgetOpts))
        .pipe(rename("budget.js"))
        .pipe(sourcemaps.write('.', {
            sourceMappingURLPrefix: ''
        }))
        .pipe(gulp.dest('dist/js'));
});


gulp.task('rjs-headline', ['nunjucks'], function() {
    var rjsHeadlineOpts = {
        baseUrl: 'src/js',
        mainConfigFile: 'src/js/config.js',
        optimize: 'uglify2',
        include: ['config', 'headline/main'],
        name: '../../bower_components/almond/almond',
        preserveLicenseComments: false
    };

    return gulp.src('src/js/headline/main.js')
        .pipe(sourcemaps.init())
        .pipe(requirejsOptimize(rjsHeadlineOpts))
        .pipe(rename("headline.js"))
        .pipe(sourcemaps.write('.', {
            sourceMappingURLPrefix: ''
        }))
        .pipe(gulp.dest('dist/js'));
});


/**
 * CSS tasks
 */

gulp.task('scss', function () {
    /* See https://github.com/sass/node-sass#options */
    var scssOpts = {
        outputStyle: 'compressed',
        includePaths: [
            './bower_components/foundation-sites/scss'
        ]
    };

    return gulp.src('./src/scss/**/*.scss')
        .pipe(sourcemaps.init())
        .pipe(sass(scssOpts).on('error', sass.logError))
        .pipe(sourcemaps.write('.', {
            sourceMappingURLPrefix: ''
        }))
        .pipe(gulp.dest('./dist/css'));
});


/**
 * Meta/grouped tasks
 */

gulp.task('build-scripts', ['jshint', 'foundation-js', 'rjs-budget', 'rjs-headline']);
gulp.task('build-styles', ['scss']);

gulp.task('build', ['build-scripts', 'build-styles']);

var modRewrite = require('connect-modrewrite');

gulp.task('default', ['build'], function () {
    browserSync.init({
        files: ['./dist/**/*.*'], // Watch all built files for changes and reload
        server: {
            baseDir: ["./templates/", "./dist/"],
            middleware: [
                modRewrite([
                    '^/user-info/?$ /test-data/empty-user.json [L,T=application/json]',
                    '^/headlines/*$ /headline.html [L]',
                    '!\\.html|\\.js|\\.svg|\\.css|\\.png|\\.jpg|\\.gif|\\.ico|\\.eot|\\.svg|\\.ttf|\\.woff|\\.woff2$ /budget.html [L]',
                ])
            ]
        }
    });

    gulp.watch('./src/{js,templates}/**/*.{js,html}', ['build-scripts']);
    gulp.watch('./src/scss/**/*.scss', ['build-styles']);
});