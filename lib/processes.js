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

const fs = require('fs');

const Bluebird = require('bluebird');
const findOpenPort = require('find-open-port');
const _ = require('lodash');
const debug = require('debug')('testium-core:processes');

const spawnServers = require('./spawn-server');

const Phantom = require('./processes/phantom');
const Proxy = require('./processes/proxy');
const App = require('./processes/application');
const Selenium = require('./processes/selenium');
const ChromeDriver = require('./processes/chromedriver');

const CHROME = 'chrome';

function isChromeInDocker(browserName) {
  if (browserName !== CHROME) {
    return Bluebird.reject();
  }

  const fileName = '/.dockerenv';
  return new Bluebird((resolve, reject) => {
    fs.stat(fileName, (err, stats) => {
      return err ? reject(err) : resolve(stats);
    });
  });
}

function mergeChromeOptions(baseOpts, configOpts) {
  const reg = /^([-\w]+)=?([.,/\w]*)/;

  const objOpts = baseOpts.concat(configOpts).reduce((acc, val) => {
    const match = reg.exec(val);
    acc[match[1]] = match[2];
    return acc;
  }, {});

  return Object.keys(objOpts).reduce((acc, key) => {
    const option = objOpts[key] !== '' ? `${key}=${objOpts[key]}` : key;
    return acc.concat([option]);
  }, []);
}

function unrefAll(procs) {
  // Make sure these processes don't keep the parent alive
  _.each(procs, proc => {
    proc.rawProcess.unref();
  });
  return procs;
}

function launchAllProcesses(config) {
  const launchApp = config.getBool('launch', false);

  function launchWithAppPort(appPort) {
    config.set('app.port', appPort);

    const browserName = config.get('browser');
    config.set('desiredCapabilities.browserName', browserName);

    const servers = [Proxy];

    if (launchApp) {
      debug('Launching app');
      servers.push(App);
    } else {
      debug('Using already running application on port %d', appPort);
    }

    const seleniumUrl = config.get('selenium.serverUrl', false);
    if (!seleniumUrl) {
      debug('Will launch webdriver server for %j', browserName);
      servers.push(
        {
          phantomjs: Phantom,
          chrome: ChromeDriver,
        }[browserName] || Selenium
      );
    } else {
      debug('Using existing selenium server', seleniumUrl);
    }

    if (browserName === CHROME) {
      const chromePath = config.get('chrome.command', null);
      if (chromePath) {
        config.set('desiredCapabilities.chromeOptions.binary', chromePath);
      }

      let args = [
        '--disable-application-cache',
        '--media-cache-size=1',
        '--disk-cache-size=1',
        '--disk-cache-dir=/dev/null',
        '--disable-cache',
        '--disable-desktop-notifications',
      ];

      const headlessCfg = config.get('chrome.headless', !process.env.DISPLAY);
      if (headlessCfg && headlessCfg !== 'false') args.push('--headless');

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

      return isChromeInDocker(browserName)
        .then(() => {
          debug('Running in docker env');
          args.push('--disable-dev-shm-usage');
        })
        .catch(() => {
          debug('Not running in docker env');
        })
        .then(() => {
          config.set('desiredCapabilities.chromeOptions.args', args);
          return spawnServers(config, servers);
        })
        .then(unrefAll);
    }

    return spawnServers(config, servers).then(unrefAll);
  }

  // app.port is special because the proxy needs to know it
  const appPort = config.get('app.port', launchApp ? 0 : -1);
  if (appPort === 0) {
    return findOpenPort().then(launchWithAppPort);
  }
  return launchWithAppPort(appPort);
}
module.exports = launchAllProcesses;
