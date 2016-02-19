'use strict';

var path = require('path');

module.exports = {

    getAbsolutePath: function(args) {
        args = Array.prototype.slice.call(arguments, 0);
        return path.join.apply(path, [__dirname].concat(args));
    }

};
