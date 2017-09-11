const merge = require('lodash/merge');
const argv = require('minimist')(process.argv.slice(2));
const isO = require('lodash/isObject');
const wp = require('webpack');

/**
 * OhPack plugins
 * @const {object} plugins
 */
const plugins = {
  logger: require('./plugins/logger'), // eslint-disable-line global-require
};

/**
 * OhPack loaders
 * @const {object} loaders
 */
const loaders = {
  stylus: require.resolve('./loaders/stylus'),
  asset: require.resolve('./loaders/asset'),
  pug: require.resolve('./loaders/pug')
};

/**
 * Default OhPack config
 * @var {object} defaults
 */
const defaults = {
  logger: true,
  asset: true,
  stylus: false,
  pug: false
};

/**
 * Internal cache (for eliminating unchanged files from the emit)
 * @var {object} cache
 */
let cache = {};

/**
 * OhPack plugin
 *
 * Does some of the boilerplate things
 * so our webpack.config.js file looks nicer
 *
 * Main features:
 * - Injects plugins for production packaging
 * - Prepends loaders (assetloader + appropriate type loader)
 *   to registered entry points, but only to asset files (non-js)
 */
class OhPack {
  constructor(conf) {
    this.conf = isO(conf)
      ? merge({}, defaults, conf)
      : merge({}, defaults);
  }

  /**
   * The main plugin entry method
   * @param {Compiler} compiler - Webpack compiler instance
   */
  apply(compiler) {
    const options = compiler.options;
    const entry = compiler.options.entry;
    Object.keys(entry).forEach((key) => { // eslint-disable-line consistent-return
      if (/\.js$/.test(key)) {
        return entry[key];
      } else if (/\.(styl|stylus)$/.test(entry[key]) && this.conf.stylus) {
        entry[key] = `${loaders.stylus}!${entry[key]}`;
      } else if (/\.(jade|pug)$/.test(entry[key]) && this.conf.pug) {
        entry[key] = `${loaders.pug}!${entry[key]}`;
      }
      entry[key] = (this.conf.asset
        ? (`${loaders.asset}?entry=${key}!`)
        : '') + entry[key];
    });

    // EXPREIMENTAL - MIGHT REMOVE NEEDED EMITS
    // See to remove unnececery emits
    // from the asset object during the emit phase so they wont be
    // displayed and wont confuse what was actually compiled

    compiler.plugin('emit', (compilation, cb) => {
      const newcache = Object
        .keys(compilation.records.chunks.byName)
        .reduce((object, name) => {
          const id = `c${compilation.records.chunks.byName[name]}`;
          object[name] = {
            id,
            hash: compilation.cache[id].hash,
          };
          return object;
        }, {});
      Object.keys(newcache).forEach((name) => {
        if (!cache[name]) return;
        if (cache[name].id !== newcache[name].id) return;
        if (cache[name].hash !== newcache[name].hash) return;
        delete compilation.assets[name];
      });
      cache = newcache;
      cb();
    });

    // Use the OhPack Logger plugin if required so by the user

    if (this.conf.logger) {
      this.logger = new plugins.logger().apply(compiler); // eslint-disable-line new-cap
    }

    // Inject other plugins depending on the environment

    if (argv.p) {
      options.devtool = false;
      new wp.DefinePlugin({
        'process.env': {
          NODE_ENV: '"production"'
        },
      }).apply(compiler);
    } else {
      options.devtool = 'inline-source-map';
      new wp.DefinePlugin({
        'process.env': {
          NODE_ENV: '"development"'
        },
      }).apply(compiler);
    }
  }
}

/**
 * Give public access to ohpack
 * customized loaders
 * @exports {object} OhPack.loaders
 */
OhPack.loaders = loaders;

/**
 * Give public access to ohpack
 * customized plugins
 * @exports {object} OhPack.plugins
 */
OhPack.plugins = plugins;

/**
 * @exports OhPack
 */
module.exports = OhPack;
