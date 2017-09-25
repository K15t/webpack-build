# About Webpack Build

The project provides a general base configuration for using webpack to build and serve an app UI for Atlassian Connect, e.g. register the atlassian-connect.json in combination with ngrok and additional helper functions.


## Installing

```
$ npm install k15t-webpack-build
```


## Usage

To use the master configuration in your project create a new webpack configuration file e.g. wepack-config.js and add the
following lines:


```javascript
// import build configuration
var build = require('k15t-webpack-build/webpack-build.js');

{
    // setup weback as usual for your project 
    module.exports = master({
        metadata: {
            title: 'Project title'
        },
        entry: {
            'main': './src/main.ts'
        },
        output: {
            path: './target'
        }
    });
}

```


### Add predefined production related plugins 

This in includes e.g. a plugin to gather all used licenses and write it to a summary file or to uglify the code. For more details please see the corresponding function in the webpack-build.js 

```javascript
    build.mergeProductionPlugins(commonBuildConfig);
```

## Check third-party licenses building the project
The prod build includes also a license check which gather all used third-party licenses and writes a summery to the root of the
output directory. To setup a different output directory you can override metadata.outputlicenseSummaryFile or to define
the licenses which must not be used e.g. GPL you can override metadata.notAllowedLicenses = ['GPL'] 

## Atlassian Connect app 
In case you're developing an Atlassian Connect app the file addon-descriptor.js helps you to open a HTTPS tunnel and register the
app descriptor (atlassian-connect.json) on your dev instance when starting the webpack dev server. The following code will establish an 
ngrok tunnel that exposes the local port 3000 on your localhost. That ngrok URL is then used to set the descriptor URL in the 
atlassian-connect.json and then the descriptor is installed to the configured Atlassian Cloud instance :
 
```javascript
var webpack = require("webpack");
var WebpackDevServer = require('webpack-dev-server');
var webpackConfig = require('./webpack-common.js');
var HotModuleReplacementPlugin = require('webpack/lib/HotModuleReplacementPlugin');
var addonDescriptor = require('k15t-webpack-build/addon-descriptor');
var rimraf = require('rimraf/rimraf');
var fs = require('fs');

function startServer() {

    var userHome = process.env.HOME || process.env.USERPROFILE;
    var devInstanceAccessInfo = JSON.parse(fs.readFileSync(userHome + '/atlas-cloud-dev.json', 'utf8'));

    addonDescriptor.register(function(addOnBaseUrl) {

        var config = webpackConfig.getBuildConfig(addOnBaseUrl);

        console.log("Clean output directory " + config.output.path);

        rimraf(config.output.path, function(error) {
        });

        console.log("Execute webpack build");

        webpack(config, function(err, stats) {
            if (err) {
                console.log(err);
            } else {

                config.plugins.push(
                    new HotModuleReplacementPlugin()
                );

                console.log("Start webpack development server");

                new WebpackDevServer(webpack(config), {
                    historyApiFallback: false,
                    contentBase: config.output.path,
                    noInfo: false,
                    quiet: false,
                    compress: true,
                    stats: {colors: true},
                    watchOptions: {
                        aggregateTimeout: 300,
                        poll: true
                    }
                }).listen(3000, 'localhost', function(err, result) {
                    if (err) {
                        console.log(err);
                    }
                    console.log('Server started on port 3000');
                });
            }
        });
    }, devInstanceAccessInfo);
}

startServer();

```

To configure the `devInstanceAccessInfo` you can use a json file (as above) or use a JS config object directly.
The following configuration values are usable:

```json
{
    "baseUrl": "https://myplugin-dev.atlassian.net/wiki",
    "user": "Atlassian-ID-email",
    "password": "secret",
    "ngrok": {
      "region" : "eu",
      "subdomain": "myplugin"
    }
}

```
where
- baseUrl identifies the Atlassian cloud instance
- user and password are the (Atlassian ID) user and password used to install the app descriptor, i.e. they need sufficient permissions in the Atlassian cloud instance. Only if user and password are given will the installation be attempted.
- ngrok can contain any sensible ngrok configuration passed on to the creation of the ngrok tunnel, see https://www.npmjs.com/package/ngrok#options.  

 
 
## Example scripts which can be added directly to the package.json

```npm
"clean:all": "rimraf node_modules target && npm cache clean",
"prepublish": "typings install",
"build": "npm run build:dev",
"build:dev": "devMode=true webpack --progress --config webpack-config.js --profile --colors --display-error-details --display-cached",
"build:prod": "webpack --config webpack-config.js --progress --profile --colors --display-error-details --display-cached",
"start": "npm run server:dev",
"server:dev": "devMode=true node webpack-server-config.js"
```

To run a script open a console withing the project and enter e.g. npm run build or just npm start

## Contribute to this project
If you like to contribute on this project, request a new feature or you find a bug please see [CONTRIBUTING.md](https://github.com/K15t/webpack-build/blob/master/CONTRIBUTING.md)
for further details.

## License
Licensed under The MIT License (MIT).
