
const {AWS} = require('./AWS.classes');

/**
 * Node version in 0.0.0 format retrieved from process.versions.node if present. '0.0.0' if not present.
 * @type {string}
 */
 const nodeVer = AWS.NODE_VER;

/**
 * Node Major version. This is the first number in the version string. '20.1.6' would return 20 as a number.
 * @type {number}
 */
const nodeVerMajor = AWS.NODE_VER_MAJOR;

/**
 * Node Minor version. This is the second number in the version string. '20.31.6' would return 31 as a number.
 * @type {number}
 */
const nodeVerMinor = AWS.NODE_VER_MINOR;

const nodeVerMajorMinor = AWS.NODE_VER_MAJOR_MINOR;

if (nodeVerMajor < 16) {
	console.error(`Node.js version 16 or higher is required for @chadkluck/cache-data. Version ${nodeVer} detected. Please install at least Node version 16 (>18 preferred) in your environment.`);
	process.exit(1);
}

module.exports = {
	nodeVer,
	nodeVerMajor,
	nodeVerMinor,
	nodeVerMajorMinor
}