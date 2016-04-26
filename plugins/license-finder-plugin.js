'use strict';

var nlf = require('nlf');
var formatter = require('nlf/lib/formatters/standard');
var RawSource = require('webpack-core/lib/RawSource');

function LicenseFinderPlugin (config) {
  this.base = config.base;
  this.fileName = config.fileName;
}

LicenseFinderPlugin.prototype.apply = function (compiler) {
  var that = this;

  compiler.plugin('emit', function (compilation, callback) {

    nlf.find({
      directory: this.base,
      production: true
    }, function (err, data) {

      if (err) {
        throw new Error('Generating license file failed: ' +  JSON.stringify(err));

      } else {
        formatter.render(data, {}, function (err, output) {

          if (err) {
            throw new Error('Formatting license file failed: ' + JSON.stringify(err));
          }

          compilation.assets[that.fileName] = new RawSource(output);
          callback();
        });
      }
    });
  });
};

module.exports = LicenseFinderPlugin;