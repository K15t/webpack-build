'use strict';

var webpack = require('webpack');
var ProvidePlugin = require('webpack/lib/ProvidePlugin');
var OccurenceOrderPlugin = require('webpack/lib/optimize/OccurenceOrderPlugin');
var DedupePlugin = require('webpack/lib/optimize/DedupePlugin');
var UglifyJsPlugin = require('webpack/lib/optimize/UglifyJsPlugin');
var CommonsChunkPlugin = require('webpack/lib/optimize/CommonsChunkPlugin');
var FailPlugin = require('webpack-fail-plugin');
var LicenseFinderPlugin = require('./plugins/license-finder-plugin');
var merge = require('webpack-merge');
var utils = require('./utils');
var fs = require('fs');

const ENV_DEVELOPMENT = 'development';
const ENV_PROD = 'production';

/**
 * Module defining the common build configuration for webpack-based projects.
 *
 * @param opts Customized options which allows to override the defaults configuration.
 */
function mergeDefaultConfig(opts) {

    let devModeEnabled = isDevelopMode();
    let debugModeEnabled = isDevelopMode();

    console.log('------------------------------------------------------------------------------------');
    console.log(`Executing build for ` + (devModeEnabled ? ENV_DEVELOPMENT : ENV_PROD));
    console.log('------------------------------------------------------------------------------------');

    let config = {

        metadata: {
            ENV: devModeEnabled ? ENV_DEVELOPMENT : ENV_PROD
        },
        devtool: 'source-map',
        debug: debugModeEnabled,

        entry: {},

        output: {
            filename: devModeEnabled ? '[name].bundle.js' : '[name].[chunkhash].bundle.js',
            sourceMapFilename: devModeEnabled ? '[name].bundle.map' : '[name].[chunkhash].bundle.map',
            chunkFilename: devModeEnabled ? '[id].chunk.js' : '[id].[chunkhash].chunk.js'
        },

        resolve: {
            cache: false,
            extensions: ['', '.ts', '.tsx', '.js', '.json', '.css', '.html']
        },

        module: {
            preLoaders: [],
            loaders: []
        },

        plugins: [],

        // we need this due to problems with es6-shim
        node: {
            global: 'window',
            progress: false,
            crypto: 'empty',
            module: false,
            clearImmediate: false,
            setImmediate: false
        }
    };

    if (debugModeEnabled) {
        console.log(merge(config, opts));
        console.log('------------------------------------------------------------------------------------');
    }

    return merge(config, opts);
}

/**
 * @returns {string} the mode e.g. development or production
 */
function getMode() {
    return isDevelopMode() ? ENV_DEVELOPMENT : ENV_PROD;
}

/**
 * @returns {boolean} true if the build runs with debug
 */
function isDebugMode() {
    return (process.env.debug === 'true' || process.env.debug === true) || false;
}

/**
 * @returns {boolean} true if the build runs for development
 */
function isDevelopMode() {
    return (process.env.devMode === 'true' || process.env.devMode === true) || false;
}

/**
 * @returns {boolean} true if the build runs for test
 */
function isTestMode() {
    return (process.env.testMode === 'true' || process.env.testMode === true) || false;
}

/**
 * Merge defined plugins for production e.g. to check the licenses, uglify code or optimize chunks
 *
 * @param config confid to merge the plugins into
 * @param notAllowedLicenses array of string of forbidden licenses
 * @param outputlicenseSummaryFile full qualified path of the summary file which will be created at the end
 */
function mergeProductionPlugins(config, notAllowedLicenses, outputlicenseSummaryFile) {

    return merge(config, {
        plugins: [

            new OccurenceOrderPlugin(true),

            new CommonsChunkPlugin({
                name: 'vendor',
                filename: isDevelopMode() ? 'vendor.bundle.js' : 'vendor.[hash].bundle.js',
                minChunks: Infinity
            }),

            new LicenseFinderPlugin({
                base: '.',
                notAllowedLicenses: notAllowedLicenses || [],
                outputFile: outputlicenseSummaryFile || 'THIRD-PARTY-LICENSE.txt',
                // license config is a simple json file mapping the package id to it's license
                // e.g.
                // {
                //    'k15t-aui-ng2@0.0.23' : 'MIT'
                // }
                licenseConfig: 'THIRD-PARTY-LICENSE.json'
            }),

            // ... the plugin is required to enforce to return a correct exit code which
            //     will be required e.g. building with maven and in case of errors the build should not
            //     ne successful.
            FailPlugin,

            new DedupePlugin(),

            new UglifyJsPlugin({
                compress: {
                    unused: true,
                    dead_code: true,
                    screw_ie8: true,
                    warnings: false
                }
            })
        ]
    });
}

module.exports = {
    ENV_DEVELOPMENT,
    ENV_PROD,
    isDevelopMode,
    isDebugMode,
    isTestMode,
    getMode,
    mergeDefaultConfig,
    mergeProductionPlugins
};
