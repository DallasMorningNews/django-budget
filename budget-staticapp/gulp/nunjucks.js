/* eslint import/no-extraneous-dependencies: "off" */
// const gulp = require('gulp');
const fs = require('fs');
const glob = require('glob');
const path = require('path');
const nunjucks = require('nunjucks');

const TEMPLATE_DIR = './src/templates';

module.exports = (cb) => {
    glob(`${TEMPLATE_DIR}/**/*.{html,njk}`, (err, files) => {
        // Get the names of all subfolders of our TEMPLATE_DIR, because we'll create
        // app bundles for each
        const bundleDirs = new Set(files.map(file => path.dirname(file)));
        bundleDirs.delete(TEMPLATE_DIR);

        // Build a bundle with the contents of each subfolder and save it to
        // 'src/js/templates/'.
        bundleDirs.forEach((bundleDir) => {
            const toPrecompile = files.filter(
                file => path.dirname(file) === bundleDir
            );

            const bundleName = path.relative(TEMPLATE_DIR, bundleDir);

            const precompiled = toPrecompile.map((file) => {
                const templateName = path.basename(file, path.extname(file));
                return nunjucks.precompile(file, {
                    name: `${bundleName}/${templateName}`,
                });
            });

            fs.writeFileSync(
              `./src/js/templates/${bundleName}.js`,
              precompiled.join('\n')
            );
        });
    });

    cb();
};
