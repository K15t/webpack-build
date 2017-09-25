#!/usr/bin/env node

'use strict';

var request = require('request');
var ngrok = require('ngrok');
var upmInstall = require('upm-install');

var waitUntilServersAreReady = function(hostRegUrl, descriptorUrl, user, password) {
    console.log("Check if the local server %s and the cloud instance %s are available ...", descriptorUrl, hostRegUrl);
    setTimeout(function() {
        request.get({
            uri: hostRegUrl
        }, function(err, res) {
            if (res !== undefined && res.statusCode === 200) {
                green("Cloud instance is available (" + hostRegUrl + ")");
                request.head({
                    uri: descriptorUrl
                }, function(err, res) {
                    if (res !== undefined && res.statusCode === 200) {
                        green("Server instance is available (" + descriptorUrl + ")");
                        upmInstall({
                            descriptorUrl: descriptorUrl,
                            productUrl: hostRegUrl,
                            username: user,
                            password: password
                        })
                            .then(() => green('Successfully installed app descriptor ' + descriptorUrl + ' to ' + hostRegUrl))
                            .catch((err) => red('Error installing app descriptor ' + descriptorUrl + ' to ' + hostRegUrl + ': ' + err));
                    } else {
                        red("Server instance is not available under " + descriptorUrl);
                        waitUntilServersAreReady(hostRegUrl, descriptorUrl, user, password);
                    }
                })
            } else {
                console.log("Waiting for cloud instance (" + hostRegUrl + ")");
                waitUntilServersAreReady(hostRegUrl, descriptorUrl, user, password);
            }
        });
    }, 5000);
};

function green(logText) {
    console.log('\x1b[32m%s\x1b[0m', logText);
}

function red(logText) {
    console.log('\x1b[31m%s\x1b[0m', logText);
}

/**
 * @param callback function that is called once the tunnel is enabled, with the tunnel URL.
 * @param config, configuration object which can contain baseUrl, user, password for the atlassian.net developer instance.
 *  If user and password are defined, these credentials will be used to (re-)install the app descriptor, otherwise this
 *  will be skipped. The user property must contain the Atlassian ID name, i.e. the email address.
 *  If the ngrok property exists, it can contain the ngrok config object as defined here: https://www.npmjs.com/package/ngrok#options .
 */
function register(callback, config) {
    console.log('Establishing ngrok tunnel');
    let ngrokConfig = Object.assign({"addr": 3000}, config.ngrok);
    ngrok.connect(ngrokConfig, function(err, url) {
        if (err) {
            console.log(err);
        } else {
            green('Tunnel established. The ngrok url is ' + url);

            if (config && config.user && config.password) {
                waitUntilServersAreReady(
                    config.baseUrl,
                    url + '/atlassian-connect.json',
                    config.user,
                    config.password
                );
            } else {
                green('Skipping installation of app descriptor from %s on %s. user and password are missing', url, config.baseUrl);
            }

            callback(url);
        }
    });
}

module.exports = {
    register: register
};

