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

const urlLib = require('url');
const http = require('http');
const path = require('path');
const fs = require('fs');

const _ = require('lodash');
const debug = require('debug')('testium-core:init');
const qs = require('qs');
const Bluebird = require('bluebird');

const Config = require('./config');
const launchAll = require('./processes');

// Retains the url fragment and query args from url, not overridden via queryArgs
function extendUrlWithQuery(url, queryArgs) {
  if (_.isEmpty(queryArgs)) {
    return url;
  }

  const parts = urlLib.parse(url);
  const query = _.extend(qs.parse(parts.query), queryArgs);
  parts.search = `?${qs.stringify(query)}`;
  return urlLib.format(
    _.pick(
      parts,
      'protocol',
      'slashes',
      'host',
      'auth',
      'pathname',
      'search',
      'hash'
    )
  );
}

function getNewPageUrl(targetUrl, url, options) {
  options = options || {};
  const query = options.query;
  if (query) {
    if (typeof query !== 'object') {
      throw new Error('options.query has to be an Object if provided');
    }
    url = extendUrlWithQuery(url, query);
  }

  // We don't support absolute urls in proxy (~= starting with a protocol)
  if (/^\w+:\/\//.test(url)) {
    return url;
  }
  options = _.defaults({ url, redirect: true }, _.omit(options, 'query'));
  return `${targetUrl}/__testium_command__/new-page?${qs.stringify(options)}`;
}

function isTruthyConfig(setting) {
  return (
    setting && setting !== '0' && setting !== 'null' && setting !== 'false'
  );
}

function initTestium(config) {
  config = config || Config.load();

  const appConfig = config.get('app', {});
  if (!isTruthyConfig(appConfig)) {
    debug('Disabling launch via app config', appConfig);
    config.set('launch', false);
  }

  function createFromProcesses(procs) {
    let testium;

    function closeSeleniumSession() {
      const browser = testium.browser;
      if (browser && typeof browser.quit === 'function') {
        return browser.quit();
      }
      return browser && browser.close();
    }

    let devtoolsPort = null;
    function getChromeDevtoolsPort() {
      const capabilities = testium.browser.capabilities;
      if (!capabilities.chrome) {
        throw new Error('Can only get devtools port for chrome');
      }
      if (devtoolsPort === null) {
        const userDataDir = capabilities.chrome.userDataDir;
        const devToolsPortPath = path.join(userDataDir, 'DevToolsActivePort');
        const devToolsPortFile = fs.readFileSync(devToolsPortPath, 'utf8');
        devtoolsPort = +devToolsPortFile.split('\n')[0];
        debug('Found DevTools port %j in', devtoolsPort, devToolsPortFile);
      }
      return devtoolsPort;
    }

    function killAllProcesses() {
      _.each(procs, (proc, name) => {
        try {
          proc.rawProcess.kill();
        } catch (e) {
          debug('Error killing process %s', name, e);
        }
      });
    }

    function close() {
      return Bluebird.try(closeSeleniumSession)
        .catch(e => {
          debug('Could not close session', e);
        })
        .then(killAllProcesses);
    }

    function getInitialUrl() {
      return `${config.get('proxy.targetUrl')}/testium-priming-load`;
    }

    testium = {
      close,
      config,
      getChromeDevtoolsPort,
      getInitialUrl,
      getNewPageUrl: _.partial(getNewPageUrl, config.get('proxy.targetUrl')),
    };
    return testium;
  }

  function verifySelenium(procs) {
    return new Bluebird((resolve, reject) => {
      const seleniumUrl = config.get('selenium.serverUrl');
      debug('Verify selenium: ', seleniumUrl);
      const req = http.get(`${seleniumUrl}/status`, res => {
        debug('Selenium /status: ', res.statusCode);
        resolve(procs);
      });
      req.on('error', error => {
        let oldStack = error.stack;
        oldStack = oldStack.substr(oldStack.indexOf('\n') + 1);
        error.message = [
          'Error: Failed to connect to existing selenium server',
          `       - url: ${seleniumUrl}`,
          `       - message: ${error.message}`,
        ].join('\n');
        error.stack = `${error.message}\n${oldStack}`;
        reject(error);
      });
    });
  }

  return launchAll(config).then(verifySelenium).then(createFromProcesses);
}
module.exports = initTestium;
