# About Master Webpack Build

The project provides a general master configuration for using webpack in combination with typescript, tslint and other plugins.
If required the master configuration can be easily customized e.g. using an additional plugin or defining a different output structure.


## Installing

```
$ npm install k15t-webpack-build
```


## Usage

To use the master configuration in your project create a new webpack configuration file e.g. wepack-config.js and add the
following lines:


```javascript
// import the master configuration
var master = require('k15t-webpack-build/webpack-master-config.js');

{
    module.exports = master({
        metadata: {
            title = 'Project title'
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

That's all! If you now building your project it automatically includes the following steps:
* Validates the code base according to the defined tslint rules (see tslint.config.json)
* Executes the TypeScript compiler and transpiles it to the desired EcmaScripts version 
* Replace all placeholder defined as envProperties
* In case your project has an index.html it will be copied to the target folder
* In case your project has an asset folder all assets will be copied to the target folder
* Removes all unused code parts
* Compress and uglifies the code 

### Customize configuration

You can directly setup your desired configuration as you would do if you use Webpack directly. The configuration will
be merged together with the one defined by the master configuration. In case of plugins you have different possibilities
e.g. to add a new plugin or to use only the plugins you have defined in your project. For adding new plugins you can just
add a plugins entry as usual and the plugins will be added during the build:

```javascript
{
    module.exports = master({
        ...
        plugins: [
            new HtmlWebpackPlugin({
                filename: 'editor.html',
                template: 'src/editor.html',
                chunks: ['editor', 'vendor'],
                inject: false
            }))
        ],
        ...
    });
}

```

or if you want to use only the plugins from your projects:

```javascript
{
    module.exports = master({
        ...
        redefinePlugins: function(devModeEnabled, testingEnabled, debugModeEnabled) {
            
            let plugins = [];
            
            plugins.push(new HtmlWebpackPlugin({
                filename: 'editor.html',
                template: 'src/editor.html',
                chunks: ['editor', 'vendor'],
                inject: false
            }));

            return plugins;
        },
        ...
    });
}

```

In case you want to use project specific placeholders e.g. for conditional imports you can do the following:

```javascript
{
    module.exports = master({
        ...
        envProperties: {
            BUILD_FOR_CLOUD: process.env.npm_config_targetPlatform === 'connect'
        },
        ...
    });
}

```

In the code you can use it in the following way:

```javascript
if (process.env.BUILD_FOR_CONNECT) {
    return new ServiceFactoryConnect();
} else {
    return new ServiceFactoryServer();
}

```

## Check third-party licenses building the project
The prod build includes also a license check which gather all used third-party licenses and writes a summery to the root of the
output directory. To setup a different output directory you can override metadata.outputlicenseSummaryFile or to define
the licenses which must not be used e.g. GPL you can override metadata.notAllowedLicenses = ['GPL'] 

## Atlassian connect add-on 
In case you developing an Atlassian connect add-on the file addon-descriptor.js help you to open a HTTPS tunnel and register the
add-on descriptor(atlassian-connect.json) on your dev instance when starting the webpack dev server:
 
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
    }, {
        "baseUrl": devInstanceAccessInfo.baseUrl,
        "user": devInstanceAccessInfo.user,
        "password": devInstanceAccessInfo.password
    });
}

startServer();

```

For the installation of the add-on descriptor the webpack dev sever must server the descriptor under https://host:port/atlassian-connect.json.

## Configure the TypeScript compiler
To customize the compiler add a json configuration file tsconfig.json to the root folder of your project. Example configuration:
 
```javascript
{
  "compilerOptions": {
    "target": "es5",
    "module": "commonjs",
    "removeComments": true,
    "emitDecoratorMetadata": true,
    "experimentalDecorators": true,
    "noEmitHelpers": false,
    "sourceMap": true,
    "declaration": false
  },
  "files": [
    "typings/main.d.ts"
  ]
}

```

The configuration basically tells the compiler to transpile the project to ES5 and use commonjs as module system. For more details, see
the official TypeScript [documentation](http://www.typescriptlang.org/docs/handbook/tsconfig.json.html) 
 
## Example scripts which can be added directly to the package.json

```javascript
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
