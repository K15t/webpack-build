'use strict';

var fs = require('fs');
var path = require('path');
var mkdirp = require('mkdirp');
var nlf = require('nlf');
var formatter = require('nlf/lib/formatters/standard');
var RawSource = require('webpack-core/lib/RawSource');

function LicenseFinderPlugin(config) {
    this.base = config.base;
    this.licenses = getLicenses(config.licenseConfig);
    this.outputFile = config.outputFile;
    this.notAllowedLicenses = config.notAllowedLicenses || [];
}

function getLicenses(licenseConfig) {
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

    apply: function(compiler) {
        var that = this;

        compiler.plugin('emit', function(compilation, callback) {
            nlf.find({
                directory: that.base,
                production: true
            }, function(err, dependencies) {

                if (err) {
                    throw new Error('Parsing licenses failed: ' + JSON.stringify(err));

                } else {
                    dependencies = dependencies.filter(function(dependency) {
                        return dependency.id !== (process.env.npm_package_name + "@" + process.env.npm_package_version);
                    });

                    var unlicensedDepedencies = that.getUnlicensed(dependencies);

                    if (unlicensedDepedencies.length > 0) {
                        throw new Error(that.formatDependencyError(unlicensedDepedencies));

                    } else {
                        formatter.render(dependencies, {}, function(err, output) {

                            if (err) {
                                throw new Error('Formatting license file failed: ' + JSON.stringify(err));
                            }
                            console.log('License summary file: ' + that.outputFile);

                            var outputFolder = path.dirname(that.outputFile);
                            if (!fs.existsSync(outputFolder)) {

                                mkdirp(outputFolder, function(err) {
                                    if (err) {
                                        console.error(err);
                                    } else {
                                        fs.writeFile(that.outputFile, output, function(err) {
                                            if (err) return console.log(err);
                                        });
                                    }
                                });
                            } else {
                                fs.writeFile(that.outputFile, output, function(err) {
                                    if (err) return console.log(err);
                                });
                            }
                            callback();
                        });
                    }
                }
            });
        });
    },

    getLicense: function(dependency) {
        return this.licenses[dependency.id] || dependency.licenseSources.package.summary()[0] || 'none';
    },

    getUnlicensed: function getUnlicensed(dependencies) {
        return dependencies.filter(function(dependency) {
            var license = this.getLicense(dependency);
            console.log("Check license for " + dependency.id + " ... is licensed under " + license);
            return license == 'none' || this.notAllowedLicenses.indexOf(license) !== -1;
        }.bind(this));
    },

    formatDependencyError: function(dependencies) {
        var dependenciesList = dependencies.map(function(dependency) {
            return ' ' + dependency.id + ': ' + this.getLicense(dependency);
        }.bind(this)).join('\n');

        return (
            'License check failed. Not allowed license used! \n' +
            'All not allowed license: ' + this.notAllowedLicenses.join(',') + '\n' +
            'The following libraries are critical: \n' + dependenciesList
        );
    }

};

module.exports = LicenseFinderPlugin;