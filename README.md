# Master Webpack Build

The project provides a general master configuration for using webpack, typescript and tslint.
If required the master configuration can be easily customized for example to use an additional 
plugin or to define a different output structure.


## Installing

```
$ npm install k15t-webpack-build
```


## Usage

To use the master configuration in your project create a new webpack configuration file file e.g. wepack-config.js and add the
following example lines:


```js
// include the master configuration in your project
var master = require('k15t-webpack-build/webpack-master-config.js');

// check if test will be executed
if (!!process.env.testMode) {
    module.exports = master({
       module: {
            noParse: [
                utils.getAbsolutePath('zone.js/dist'),
                utils.getAbsolutePath('angular2/bundles')
            ]
       }
    });
} else {
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

Example scripts which can be added directly to the package.json

```js
"watch": "npm run watch:dev",
"watch:dev": "debug=true ./node_modules/.bin/webpack --watch --config webpack-config.js --progress --profile --colors --display-error-details --display-cached",
"build": "npm run build:dev",
"build:dev": "devMode=true ./node_modules/.bin/webpack --progress --config webpack-config.js --profile --colors --display-error-details --display-cached",
"build:prod": "./node_modules/.bin/webpack --config webpack-config.js --progress --profile --colors --display-error-details --display-cached",
"start:server": "devMode=true ./node_modules/.bin/webpack-dev-server --config webpack-config.js --progress --profile --colors --display-error-details --display-cached --inline",
"start:tests": "testMode=true ./node_modules/.bin/karma start",
"create:docs": "./node_modules/.bin/typedoc --options ./node_modules/k15t-webpack-build/build/typedoc.json  src/**/*.ts --out  ./target/doc",
```

To run a script type open a console withing the project and enter: npm run build

## License

Licensed under The MIT License (MIT).
