# Master Webpack Build

The project provides a general master configuration for webpack including tslint rules to simplify configurations.
Furthermore, if necessary options can be customized like entry, output, plugins, etc.


## Installing

```
$ npm install k15t-webpack-build
```


## Usage

```js
var master = require('k15t-webpack-build/webpack-master-config.js');
var extend = require('node.extend');

var defaults = {
    title = 'My example project';
    contextPath = '/myproject';
    devServer {
        host: 'localhost',
        port: 8090
    };
}

if ('test' === process.env.ENV) {
    module.exports = master({
       metadata: extend(true, {}, defaults),
       module: {
            noParse: [
                utils.getAbsolutePath('zone.js/dist'),
                utils.getAbsolutePath('angular2/bundles')
            ]
       }
    });
} else {
    module.exports = master({
        metadata: extend(true, {}, defaults),
        entry: {
            'vendor': './src/vendor.ts',
            'main': './src/main.ts' // our angular app
        }
    });
}


```

## License

Licensed under The MIT License (MIT).