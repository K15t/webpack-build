'use strict';

var path = require('path');
var webpack = require('webpack');
var ProvidePlugin = require('webpack/lib/ProvidePlugin');
var DefinePlugin = require('webpack/lib/DefinePlugin');
var OccurenceOrderPlugin = require('webpack/lib/optimize/OccurenceOrderPlugin');
var DedupePlugin = require('webpack/lib/optimize/DedupePlugin');
var UglifyJsPlugin = require('webpack/lib/optimize/UglifyJsPlugin');
var CommonsChunkPlugin = require('webpack/lib/optimize/CommonsChunkPlugin');
var CopyWebpackPlugin = require('copy-webpack-plugin');
var HtmlWebpackPlugin = require('html-webpack-plugin');
var FailPlugin = require('webpack-fail-plugin');
var extend = require('node.extend');
var utils = require('./utils');
var fs = require('fs');

const ENV_DEVELOPMENT = 'development';
const ENV_PROD = 'production';

const DEV_SERVER_PORT = '3000';
const DEV_SERVER_HOST = 'localhost';

/**
 * Module defining the common build configuration for webpack-based projects.
 *
 * @param opts Customized options which allows to override the defaults configuration.
 */
module.exports = function(opts) {

    let testingEnabled = !!process.env.testMode;
    let devModeEnabled = !!process.env.devMode;
    let debugModeEnabled = !!process.env.debug;

    console.log('------------------------------------------------------------------------------------');
    if (devModeEnabled) {
        console.log('  Executing development build');
    } else {
        console.log('  Executing production build');
    }
    console.log('------------------------------------------------------------------------------------');

    let config = {

        metadata: {
            ENV: devModeEnabled ? ENV_DEVELOPMENT : ENV_PROD,
            devServer: {
                port: DEV_SERVER_PORT,
                host: DEV_SERVER_HOST
            }
        },
        devtool: 'source-map',
        debug: debugModeEnabled,

        entry: {},

        output: {
            filename: '[name].[chunkhash].bundle.js',
            sourceMapFilename: '[name].[chunkhash].bundle.map',
            chunkFilename: '[id].[chunkhash].chunk.js'
        },

        resolve: {
            cache: false,
            extensions: ['', '.ts', '.js', '.json', '.css', '.html']
        },

        module: {
            preLoaders: [{
                test: /\.ts$/,
                loader: 'tslint-loader',
                exclude: [
                    /node_modules/
                ]
            }],
            loaders: [
                {
                    test: /\.ts$/,
                    loader: 'ts-loader',
                    query: {
                        // remove TypeScript helpers to be injected below by DefinePlugin
                        'compilerOptions': {
                            'removeComments': !devModeEnabled,
                            'noEmitHelpers': !devModeEnabled
                        },
                        'ignoreDiagnostics': [
                            2403, // 2403 -> Subsequent variable declarations
                            2300, // 2300 -> Duplicate identifier
                            2374, // 2374 -> Duplicate number index signature
                            2375  // 2375 -> Duplicate string index signature
                        ]
                    },
                    compilerOptions: './tsconfig.json',
                    exclude: testingEnabled ? [] : [/\.(spec)\.ts$/]
                },

                {test: /\.json$/, loader: 'json-loader'},
                {test: /\.css$/, loader: 'raw-loader'},
                {test: /\.html$/, loader: 'raw-loader'}
            ]
        },

        plugins: getPlugins(devModeEnabled, testingEnabled, debugModeEnabled, opts),

        // Other module loader config
        tslint: {
            configuration: require('./tslint.config.json'),
            emitErrors: true,
            failOnHint: true
        },

        // don't use devServer for production
        devServer: {
            port: (opts.metadata && opts.metadata.devServer && opts.metadata.devServer.port) ? opts.metadata.devServer.port : DEV_SERVER_PORT,
            host: (opts.metadata && opts.metadata.devServer && opts.metadata.devServer.host) ? opts.metadata.devServer.host : DEV_SERVER_HOST,
            historyApiFallback: false,
            contentBase: opts.output.path,
            watchOptions: {
                aggregateTimeout: 300,
                poll: 1000
            }
        },

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
        console.log(extend(true, config, opts));
        console.log('------------------------------------------------------------------------------------');
    }

    return extend(true, config, opts);
};

/**
 * Gets the list of plugins for the specific build run e.g. production.
 *
 * @param devModeEnabled Boolean if the development mode is enabled for the build
 * @param testingEnabled Boolean if tests are going to be executed
 * @param opts General configuration options
 */
function getPlugins(devModeEnabled, testingEnabled, debugModeEnabled, opts) {

    if (typeof opts.getPlugins === 'function') {
        return opts.getPlugins(devModeEnabled, testingEnabled, debugModeEnabled);
    }

    let plugins = [];
    let envMode = devModeEnabled ? ENV_DEVELOPMENT : ENV_PROD;

    // ---------------------------------------------------------- COMMON

    // ... the plugin is required to enforce to return a correct exit code which
    //     will be required e.g. building with maven and in case of errors the build should not
    //     ne successful.
    plugins.push(FailPlugin);

    let envProperties = {
        'ENV': JSON.stringify(envMode),
        'NODE_ENV': JSON.stringify(envMode),
        'ADD_ON_KEY': (opts.metadata && opts.metadata.addOnKey) ? JSON.stringify(opts.metadata.addOnKey) : ''
    };

    if (opts.envProperties !== null && opts.envProperties !== undefined) {
        envProperties = extend(true, envProperties, opts.envProperties);
    }

    if (debugModeEnabled) {
        console.log('ENV properties:');
        console.log(envProperties);
        console.log('------------------------------------------------------------------------------------');
    }

    plugins.push(new webpack.DefinePlugin({
        'process.env': envProperties
    }));

    plugins.push(new OccurenceOrderPlugin(true));

    if (!testingEnabled) {
        plugins.push(new CommonsChunkPlugin({
            name: 'vendor',
            filename: 'vendor.[chunkhash].bundle.js',
            minChunks: Infinity
        }));
    }

    if (fs.existsSync('src/index.html')) {
        plugins.push(new HtmlWebpackPlugin({
            filename: 'index.html',     // output file (relative to output path)
            template: 'src/index.html', // input (template) file
            inject: false               // no automatic injection of assets
        }));
    }

    if (fs.existsSync('src/assets')) {
        plugins.push(new CopyWebpackPlugin([{
            from: 'src/assets',
            to: 'assets'
        }]));
    }

    // ---------------------------------------------------------- PROD

    if (!devModeEnabled) {

        plugins.push(new DedupePlugin());
        plugins.push(new ProvidePlugin({
            '__metadata': 'ts-helper/metadata',
            '__decorate': 'ts-helper/decorate',
            '__awaiter': 'ts-helper/awaiter',
            '__extends': 'ts-helper/extends',
            '__param': 'ts-helper/param'
        }));
        plugins.push(new UglifyJsPlugin({
            mangle: false,
            comments: false,
            compress: {
                screw_ie8: true,
                warnings: false
            }
        }));
    }

    return plugins;
}
