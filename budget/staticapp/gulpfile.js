const gulp = require('./gulp');

gulp.task('build-scripts', gulp.series('nunjucks', gulp.parallel('eslint', 'browserify')));
gulp.task('build-styles', gulp.task('scss'));

gulp.task('build', gulp.parallel('build-scripts', 'build-styles'));

gulp.task(
  'default',
  gulp.series(
    'nunjucks',
    // Use watchify instead of browserify, since we want to watch for src/js chagnes
    gulp.parallel('eslint', 'watchify', 'build-styles'),
    'server'
  )
);
