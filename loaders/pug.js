const utils = require('loader-utils');
const merge = require('lodash/merge');
const pug = require('pug');

/**
 * The main loader entry point
 * @param  {buffer|string} content - Raw Pug content
 * @return {string}        Rendered HTML string
 */
module.exports = function OhPackPugLoader(content) {
  this.cacheable && this.cacheable(true);
  const resource = this.resourcePath;
  const defaults = {
    configure: c => c,
    pretty: this.minimize ? false : true,
  };
  let config = merge(defaults, utils.getLoaderConfig(this, 'pug'));
  config.filename = resource;
  config = config.configure(config);

  const temp = pug.compileClientWithDependenciesTracked(content, config);
  const deps = temp.dependencies;

  deps
    .filter((f, i) => deps.lastIndexOf(f) === i)
    .forEach(dep => this.addDependency(dep));

  return pug.render(content, config);
};

/**
 * Register that we don't mind having a buffer passed
 * @exports {boolean} raw
 */
module.exports.raw = true;
