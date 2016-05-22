# About Master Webpack Build

The project provides a general master configuration for using webpack, typescript and tslint.
If required the master configuration can be easily customized for example to use an additional
plugin or to define a different output structure.


## Installing

```
$ npm install k15t-webpack-build
```


## Usage

To use the master configuration in your project create a new webpack configuration file e.g. wepack-config.js and add the
following example lines:


```javascript
// include the master configuration in your project
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

That's all! If you now build your project it automatically include the following steps:
* Validates the code base according to the defined tslint rules (see tslint.config.json)
* Executes the TypeScript compiler and transpile it to the desired EcmaScripts version 
* Replace all placeholder defined as envProperties
* In case your project has a index.html it will be copied to the target folder
* In case your project has an asset folder all included assets will be copied to the target folder
* Removes all unused code parts
* Compress and ugligfy the code 

### Customize configuration

You can directly setup your desired configuration as you would do if you use Webpack directly. The configuration will
merged together with the one defined by the master configuration. In case of plugins you have different possibilities
e.g. to add a new plugin or to use only plugins you have defined in your project. For adding new plugins you can just
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

In the implementation you can use it like that:

```javascript
if (process.env.BUILD_FOR_CONNECT) {
    return new ServiceFactoryConnect();
} else {
    return new ServiceFactoryServer();
}

```


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

The configuration basically tells the compiler to transpile the porject to ES5 and use commonjs as module system. For more details, see
the official TypeScript [documentation](http://www.typescriptlang.org/docs/handbook/tsconfig.json.html) 
 
 
## Example scripts which can be added directly to the package.json

```javascript
"watch": "npm run watch:dev",
"watch:dev": "webpack --watch --config webpack-config.js --progress --profile --colors --display-error-details --display-cached",
"build": "npm run build:dev",
"build:dev": "devMode=true webpack --progress --config webpack-config.js --profile --colors --display-error-details --display-cached",
"build:prod": "webpack --config webpack-config.js --progress --profile --colors --display-error-details --display-cached",
"start": "devMode=true webpack-dev-server --config webpack-config.js --progress --profile --colors --display-error-details --display-cached --inline"

```

To run a script type open a console withing the project and enter: npm run build

## Contribute to this project
If you like to contribute on this project, request a new feature or you find a bug please see [CONTRIBUTING.md](https://github.com/K15t/webpack-build/blob/master/CONTRIBUTING.md)
for further details.

## License
Licensed under The MIT License (MIT).
