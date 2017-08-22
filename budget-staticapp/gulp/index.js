/* eslint import/no-extraneous-dependencies: "off" */
const fs = require('fs');
const gulp = require('gulp');
const path = require('path');

fs.readdirSync(__dirname).forEach((file) => {
    const name = path.basename(file, '.js');
    if (name !== 'index' && fs.statSync(`${__dirname}/${file}`).isFile()) {
        gulp.task(name, require(`./${name}`));  // eslint-disable-line global-require,import/no-dynamic-require
    }
});

module.exports = gulp;
