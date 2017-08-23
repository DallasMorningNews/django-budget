'use strict';

const browserSync = require('browser-sync').create();
const runSequence = require('run-sequence');
const watch = require('gulp-watch');


module.exports = () => {
  browserSync.init({
    files: [
      '../**/static/**/*.{js,css}',
      '../**/templates/**/*.html',
    ],
    open: false,
    proxy: 'localhost:8000',
    startPath: '/editor',
    ghostMode: false,
  });

  watch('./src/scss/**/*.scss', () => { runSequence('scss'); });
};
