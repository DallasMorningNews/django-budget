import nunjucks from 'nunjucks/browser/nunjucks-slim';
import stringFn from 'underscore.string';

/**
 * A Marionette renderer that works with Nunjucks template objects by loading
 * them from the global precompiled namspace and calling the template object's
 * render method (Marionette otherwise expects pure functions at templates).
 * Use it by overriding Marionette.Renderer's render method with this function.
 *
 * @param {String} template - name of a precompiled Nunjucks template; should
 *   already exist in window.nunjucksPrecompiled
 * @param {Object} data - serialized data passed from a Marionette.View's
 *   serializeData method
 * @see http://marionettejs.com/docs/v2.4.7/marionette.renderer.html
 */


export default (template, data) => {
  const tpl = window.nunjucksPrecompiled[template];

  const env = new nunjucks.Environment();

  env.addFilter('numberWithCommas', rawNumber => stringFn.numberFormat(rawNumber));

  if (typeof tpl === 'undefined') {
    // eslint-disable-next-line no-console
    console.error(`[renderer] "${template}" not found in window.nujucksPrecompiled.`);
    return '';
  }
  return env.render(template, data);
};
