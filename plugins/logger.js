require('colors');

const columnify = require('columnify');
const padstart = require('lodash/padStart');

/**
 * Units map for the bytes formatter
 * @const {array} UNITS
 */
const UNITS = [
  ['GB', 1073741824],
  ['MB', 1048576],
  ['KB', 1024],
  [' B', 1],
  [' B', 0],
];

/**
 * Format passed bytes
 * to GB - MB - KB -  B
 * @param  {number} bytes - Number of bytes to format
 * @return {string} String of formated size
 */
function formatBytes(bytes) {
  let i = -1;
  let size;
  do {
    i++;
    size = bytes / UNITS[i][1];
  } while (size < 1 && i < UNITS.length);
  return `${isNaN(size) ? 0 : size.toFixed(2)} ${UNITS[i][0].dim}`;
}

/**
 * Format milliseconds
 * to time passed
 * @param  {number} ms - Number of milliseconds to format
 * @return {string} Formated time (MM:SS)
 */
function formatTime(ms) {
  const m = (ms / 1000 / 60) << 0;
  const s = ((ms / 1000) << 0) % 60;
  return `${padstart(m.toString(), 2, '0')}:${padstart(s.toString(), 2, '0')}`;
}

/**
 * The logger plugin, awesome in every way
 * Main features:
 * - Displays time since yor last build
 * - Gives a clear view of the emitted assets
 * - Looks amasing
 */
class OhPackLogger {

  /**
   * The main plugin entry
   * method
   * @param {Compiler} compiler - Webpack compiler instance
   */
  apply(compiler) {
    compiler.plugin('done', (s) => {
      s.toString = this.log.bind(this, s);
    });
    if (compiler.options.watch) {
      this.startTimer();
      compiler.plugin('compile', () => {
        this.stopTimer();
        process.stderr.write('\r ...  ');
      });
      compiler.plugin('done', () => {
        process.stderr.write(`\r${this.stamp()} `);
        this.startTimer();
      });
    }
    return this;
  }

  /**
   * Start the console timer
   */
  startTimer() {
    if (!this.check) {
      this.check = new Date().getTime();
    }
    this.timer = setInterval(() => {
      process.stderr.write(`\r${this.stamp()} `);
    }, 1000);
  }

  /**
   * Stop the console timer
   */
  stopTimer() {
    clearInterval(this.timer);
  }

  /**
   * Get the formatted timestamp
   * @param {boolean} reset - Should the timer be reset
   */
  stamp(reset) {
    const now = new Date().getTime();
    const elapsed = now - this.check;
    if (reset) {
      this.check = now;
    }
    if (elapsed > 1 * 60 * 60 * 1000) {
      return 'HOURS';
    }
    return formatTime(elapsed);
  }

  /**
   * Log out the stats object
   * @param {object} statc   - The stat object produced by the compiler
   * @param {object} options - Options passed from the Webpack environment
   */
  log(stats, options) {
    const data = stats.toJson(options, true);
    const assets = data.assets;
    const columns = columnify(assets, {
      columns: [
        'name',
        'size',
      ],
      showHeaders: false,
      columnSplitter: ' | '.dim,
      config: {
        name: {
          dataTransform: d => d.green,
          align: 'left',
        },
        size: {
          dataTransform: d => formatBytes(d),
          align: 'right',
        },
      },
    }).split('\n').map(l => '--:-- '.dim + l).join('\n');
    return [
      `\r${this.stamp(true).dim}`, (`${data.hash} in ${data.time} ms`).dim,
      `\n${columns}`,
      (data.errors.length ? `\n${data.errors.join('\n')}` : ''),
    ].join(' ');
  }
}

/**
 * @exports OhPackLogger
 */
module.exports = OhPackLogger;
