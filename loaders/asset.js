const utils = require('loader-utils');
const Source = require('webpack-sources');

/**
 * Cache object
 * @const {object} cache
 */
const cache = {};

/**
 * The main loader entry point
 * @param  {buffer|string} content - Raw asset content
 * @return {string}        Bogus javascript to fool the compiler
 */
module.exports = function OhPackAssetsLoader(content) {
  this.cacheable && this.cacheable(true);
  const file = utils.parseQuery(this.query).entry;
  const hash = utils.getHashDigest(content);
  this._compiler.plugin('emit', (compilation, callback) => {
    if (compilation.assets[file]) {
      compilation.assets[file] = new Source.RawSource(content);
    }
    cache[file] = hash;
    callback();
  });
  return `module.exports = ${JSON.stringify(hash)};`;
};

/**
 * Register that we don't mind having a buffer passed
 * @exports {boolean} raw
 */
module.exports.raw = true;
