#!/usr/bin/env node

'use strict';

var request = require('request');
var RSVP = require('rsvp');
var ngrok = require('ngrok');

var registerAddOnDescriptor = function(hostRegUrl, descriptorUrl, user, password) {

    // default authentication credentials against Confluence
    var authCredentials = {
        'user': user,
        'pass': password,
        'sendImmediately': true
    };

    return new RSVP.Promise(function(resolve, reject) {
        console.log('Request url for getting upm-token ' + hostRegUrl + '/rest/plugins/1.0/');
        request.head({
            uri: hostRegUrl + '/rest/plugins/1.0/',
            jar: false,
            auth: authCredentials
        }, function(err, res) {

            console.log('Result of getting upm-token: ' + res.statusCode);

            if (err || (res && (res.statusCode < 200 || res.statusCode > 299))) {
                return reject([err, res]);
            }

            var upmToken = res.headers['upm-token'];

            console.log('Request url for updating add-on descriptor ' + descriptorUrl);
            request.post({
                uri: hostRegUrl + '/rest/plugins/1.0/?token=' + upmToken,
                headers: {'content-type': 'application/vnd.atl.plugins.remote.install+json'},
                body: JSON.stringify({pluginUri: descriptorUrl}),
                jar: false,
                auth: authCredentials
            }, function(err, res) {
                console.log('Result of updating add-on descriptor: ' + res.statusCode);
                if (err || (res && res.statusCode !== 202)) {
                    return reject([err, res]);
                }
                console.log('Successfully updated add-on descriptor');
                resolve();
            });
        });

    });
};

var waitUntilServersAreReady = function(hostRegUrl, descriptorUrl, user, password) {
    console.log("Check if the local server and the cloud instance are available ...");
    setTimeout(function() {
        request.head({
            uri: hostRegUrl
        }, function(err, res) {
            if (res !== undefined && res.statusCode === 200) {
                console.log("Cloud instance is available (" + hostRegUrl + ")");
                request.head({
                    uri: descriptorUrl
                }, function(err, res) {
                    if (res !== undefined && res.statusCode === 200) {
                        console.log("Server instance is available (" + descriptorUrl + ")");
                        registerAddOnDescriptor(hostRegUrl, descriptorUrl, user, password);
                    } else {
                        console.log("Server instance is not available under " + descriptorUrl);
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

function register(callback, devInstanceAccessInfo) {
    ngrok.connect(3000, function(err, url) {
        if (err) {
            console.log(err);
        } else {
            console.log('Tunnel established. The ngrok url is ' + url);

            waitUntilServersAreReady(
                devInstanceAccessInfo.baseUrl,
                url + '/atlassian-connect.json',
                devInstanceAccessInfo.user,
                devInstanceAccessInfo.password
            );

            callback(url);
        }
    });
}

module.exports = {
    register: register
};

