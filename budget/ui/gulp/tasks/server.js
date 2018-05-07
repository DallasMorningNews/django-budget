'use strict';

const browserSync = require('browser-sync').create();
const fs = require('fs');
const os = require('os');
const runSequence = require('run-sequence');
const watch = require('gulp-watch');


const ssl = process.argv.indexOf('--ssl') !== -1;

const browserSyncConfig = {
  files: [
    '../static/**/*.{js,css}',
    '../templates/**/*.html',
  ],
  open: false,
  host: 'local-dev.dallasnews.com',
  proxy: {
    target: 'localhost:8000',
    middleware(req, res, next) {
      req.headers['X-Forwarded-Host'] = req.headers.host;
      req.headers['X-Forwarded-Proto'] = ssl ? 'https' : 'http';
      next();
    },
  },
  startPath: '/',
  ghostMode: false,
};


/**
 * If the below cert files are found, use them to configure our
 * local SSL server
 */
const key = `${os.homedir()}/.django-budget/django-budget.key`;
const cert = `${os.homedir()}/.django-budget/django-budget.crt`;

let useCerts = false;
try {
  fs.accessSync(key);
  fs.accessSync(cert);
  useCerts = true;
} catch (e) {
  // do nothing
}

if (useCerts && ssl) {
  browserSyncConfig.https = {
    key,
    cert,
  };
} else if (ssl) {
  /**
   * If no SSL certiricate is specified, but --ssl was passed, still enable
   * it but don't specify a local cert
   */
  browserSyncConfig.https = true;
}


module.exports = () => {
  browserSync.init(browserSyncConfig);
  watch('../staticapp/src/scss/**/*.scss', () => { runSequence('scss'); });
  watch('../staticapp/src/templates/**/*.html', () => { runSequence('nunjucks'); });
  watch('../staticapp/src/templates/**/*.njk', () => { runSequence('nunjucks'); });
};
