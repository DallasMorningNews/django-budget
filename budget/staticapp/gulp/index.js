'use strict';

const gulp = require('gulp');


module.exports = (tasks) => {
  tasks.forEach((name) => {
    gulp.task(name, require(`./tasks/${name}`)); // eslint-disable-line import/no-dynamic-require,global-require
  });

  return gulp;
};
