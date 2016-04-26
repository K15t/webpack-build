'use strict';

var fs = require('fs');
var nlf = require('nlf');
var formatter = require('nlf/lib/formatters/standard');
var RawSource = require('webpack-core/lib/RawSource');

function LicenseFinderPlugin (config) {
  this.base = config.base;
  this.licences = getLicenses(config.licenseConfig);
  this.outputFile = config.outputFile;
  this.permittedLicenses = config.permittedLicenses;
}

function getLicenses (licenseConfig) {
  var file, licenses;

  try {
    file = fs.readFileSync(licenseConfig, 'utf8');
    licenses = JSON.parse(file);

  } catch (e) {
    console.log('Warning, couldn\'t read license config: ' + licenseConfig + '\n');
  }

  return licenses || {};
}


LicenseFinderPlugin.prototype = {

  apply : function (compiler) {
    var that = this;

    compiler.plugin('emit', function (compilation, callback) {

      nlf.find({
        directory: that.base,
        production: true
      }, function (err, dependencies) {

        if (err) {
          throw new Error('Parsing licenses failed: ' + JSON.stringify(err));

        } else {
          var permittedLicences = that.permittedLicenses;
          var unlicensedDepedencies = that.getUnlicensed(permittedLicences, dependencies);

          if (unlicensedDepedencies.length > 0) {
            throw new Error(that.formatDependencyError(permittedLicences, unlicensedDepedencies));

          } else {
            formatter.render(dependencies, {}, function (err, output) {

              if (err) {
                throw new Error('Formatting license file failed: ' + JSON.stringify(err));
              }

              compilation.assets[that.outputFile] = new RawSource(output);
              callback();
            });
          }
        }
      });
    });
  },

  getLicense : function (dependency) {
    return this.licences[dependency.id] || dependency.licenseSources.package.summary()[0] || 'none';
  },

  getUnlicensed : function getUnlicensed (permittedLicenses, dependencies) {
    return dependencies.filter(function (dependency) {
      return permittedLicenses.indexOf(this.getLicense(dependency)) === -1;
    }.bind(this));
  },

  formatDependencyError: function (permittedLicenses, dependencies) {
    var dependenciesList = dependencies
      .map(function (dependency) {
        return dependency.id + ': ' + this.getLicense(dependency);
      }.bind(this))
      .join('\n');

    return (
      'Checking licenses failed: \n' +
      '(allowed: ' + permittedLicenses.join(',') + ')\n' +
      dependenciesList
    );
  }

};

module.exports = LicenseFinderPlugin;