const utils = require('loader-utils');
const merge = require('lodash/merge');
const Stylus = require('stylus');

/**
 * The main loader entry point
 * @param  {buffer|string} content - Raw Stylus content (hopefully)
 * @return {string}        Rendered CSS string
 */
module.exports = function OhPackStylusLoader(content) {
  this.cacheable && this.cacheable(true);
  const resource = this.resourcePath;
  const defaults = {
    setup: s => s,
    configure: c => c,
    sourcemap: this.minimize ? false : { inline: true },
    compress: this.minimize ? true : false,
    paths: [],
  };
  let config = merge(defaults, utils.getLoaderConfig(this, 'stylus'));
  config = config.configure(config);

  let stylus = Stylus(content.toString(), config).set('filename', resource);
  stylus = config.setup(stylus);

  const deps = stylus.deps();
  const done = this.async();

  deps.forEach(dep => this.addDependency(dep));
  stylus.render((err, css) => {
    if (err) return done(err);
    return done(null, css);
  });
};

/**
 * Register that we don't mind having a buffer passed
 * @exports {boolean} raw
 */
module.exports.raw = true;
