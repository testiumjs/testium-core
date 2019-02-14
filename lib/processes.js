/*
 * Copyright (c) 2015, Groupon, Inc.
 * All rights reserved.
 *
 * Redistribution and use in source and binary forms, with or without
 * modification, are permitted provided that the following conditions
 * are met:
 *
 * Redistributions of source code must retain the above copyright notice,
 * this list of conditions and the following disclaimer.
 *
 * Redistributions in binary form must reproduce the above copyright
 * notice, this list of conditions and the following disclaimer in the
 * documentation and/or other materials provided with the distribution.
 *
 * Neither the name of GROUPON nor the names of its contributors may be
 * used to endorse or promote products derived from this software without
 * specific prior written permission.
 *
 * THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS "AS
 * IS" AND ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED
 * TO, THE IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A
 * PARTICULAR PURPOSE ARE DISCLAIMED. IN NO EVENT SHALL THE COPYRIGHT
 * HOLDER OR CONTRIBUTORS BE LIABLE FOR ANY DIRECT, INDIRECT, INCIDENTAL,
 * SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES (INCLUDING, BUT NOT LIMITED
 * TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES; LOSS OF USE, DATA, OR
 * PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND ON ANY THEORY OF
 * LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT (INCLUDING
 * NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE OF THIS
 * SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.
 */
'use strict';

var fs = require('fs');

var Bluebird = require('bluebird');
var findOpenPort = require('find-open-port');
var _ = require('lodash');
var debug = require('debug')('testium-core:processes');

var spawnServers = require('./spawn-server');

var Phantom = require('./processes/phantom');
var Proxy = require('./processes/proxy');
var App = require('./processes/application');
var Selenium = require('./processes/selenium');
var ChromeDriver = require('./processes/chromedriver');

var CHROME = 'chrome';

function isChromeInDocker(browserName) {
  if (browserName !== CHROME) {
    return Bluebird.reject();
  }

  var fileName = '/.dockerenv';
  return new Bluebird(function promise(resolve, reject) {
    fs.stat(fileName, function fsCb(err, stats) {
      return err ? reject(err) : resolve(stats);
    });
  });
}

function mergeChromeOptions(baseOpts, configOpts) {
  var reg = /^([-\w]+)=?([\.,\/\w]*)/;

  var objOpts = baseOpts
    .concat(configOpts)
    .reduce(function filterOpts(acc, val) {
      var match = reg.exec(val);
      acc[match[1]] = match[2];
      return acc;
    }, {});

  return Object.keys(objOpts).reduce(function mergeOpts(acc, key) {
    var option = objOpts[key] !== '' ? key + '=' + objOpts[key] : key;
    return acc.concat([option]);
  }, []);
}

function unrefAll(procs) {
  // Make sure these processes don't keep the parent alive
  _.each(procs, function unrefProc(proc) {
    proc.rawProcess.unref();
  });
  return procs;
}

function launchAllProcesses(config) {
  var launchApp = config.getBool('launch', false);

  function launchWithAppPort(appPort) {
    config.set('app.port', appPort);

    var browserName = config.get('browser');
    config.set('desiredCapabilities.browserName', browserName);

    var servers = [Proxy];

    if (launchApp) {
      debug('Launching app');
      servers.push(App);
    } else {
      debug('Using already running application on port %d', appPort);
    }

    var seleniumUrl = config.get('selenium.serverUrl', false);
    if (!seleniumUrl) {
      debug('Will launch webdriver server for %j', browserName);
      servers.push({
        phantomjs: Phantom,
        chrome: ChromeDriver
      }[browserName] || Selenium);
    } else {
      debug('Using existing selenium server', seleniumUrl);
    }

    if (browserName === CHROME) {
      var chromePath = config.get('chrome.command', null);
      if (chromePath) {
        config.set('desiredCapabilities.chromeOptions.binary', chromePath);
      }

      var args = [
        '--disable-application-cache',
        '--media-cache-size=1',
        '--disk-cache-size=1',
        '--disk-cache-dir=/dev/null',
        '--disable-cache',
        '--disable-desktop-notifications'
      ];

      if (config.get('chrome.headless', !process.env.DISPLAY)) {
        args.push('--headless');
      }

      if (config.has('desiredCapabilities.chromeOptions.args')) {
        if (
          config.get('desiredCapabilities.chromeOptions.mergeArgs', false) ===
          true
        ) {
          args = mergeChromeOptions(
            args,
            config.get('desiredCapabilities.chromeOptions.args')
          );
        } else {
          args = config.get('desiredCapabilities.chromeOptions.args');
        }
      }

      if (process.getuid() === 0) args.push('--no-sandbox');

      return isChromeInDocker(browserName).then(function isDockerEnv() {
        debug('Running in docker env');
        args.push('--disable-dev-shm-usage');
      }).catch(function isNotDockerEnv() {
        debug('Not running in docker env');
      }).then(function setChromeOptions() {
        config.set('desiredCapabilities.chromeOptions.args', args);
        return spawnServers(config, servers);
      }).then(unrefAll);
    }

    return spawnServers(config, servers).then(unrefAll);
  }

  // app.port is special because the proxy needs to know it
  var appPort = config.get('app.port', launchApp ? 0 : -1);
  if (appPort === 0) {
    return findOpenPort().then(launchWithAppPort);
  }
  return launchWithAppPort(appPort);
}
module.exports = launchAllProcesses;
