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

var urlLib = require('url');
var http = require('http');

var _ = require('lodash');
var debug = require('debug')('testium-core:init');
var qs = require('qs');
var Bluebird = require('bluebird');

var Config = require('./config');
var launchAll = require('./processes');

// Retains the url fragment and query args from url, not overridden via queryArgs
function extendUrlWithQuery(url, queryArgs) {
  if (_.isEmpty(queryArgs)) {
    return url;
  }

  var parts = urlLib.parse(url);
  var query = _.extend(qs.parse(parts.query), queryArgs);
  parts.search = '?' + qs.stringify(query);
  return urlLib.format(_.pick(
    parts,
    'protocol',
    'slashes',
    'host',
    'auth',
    'pathname',
    'search',
    'hash'
  ));
}

function getNewPageUrl(targetUrl, url, options) {
  options = options || {};
  var query = options.query;
  if (query) {
    if (typeof query !== 'object') {
      throw new Error('options.query has to be an Object if provided');
    }
    url = extendUrlWithQuery(url, query);
  }
  // We don't support absolute urls in proxy (~= starting with a protocol)
  if (/^[\w]+:\/\//.test(url)) {
    return url;
  }
  options = _.defaults({ url: url, redirect: true }, _.omit(options, 'query'));
  return targetUrl + '/__testium_command__/new-page?' + qs.stringify(options);
}

function isTruthyConfig(setting) {
  return setting && setting !== '0' && setting !== 'null' && setting !== 'false';
}

function initTestium(config) {
  config = config || Config.load();

  var appConfig = config.get('app', {});
  if (!isTruthyConfig(appConfig)) {
    debug('Disabling launch via app config', appConfig);
    config.set('launch', false);
  }

  function createFromProcesses(procs) {
    var testium;

    function closeSeleniumSession() {
      var browser = testium.browser;
      if (browser && typeof browser.quit === 'function') {
        return browser.quit();
      }
      return browser && browser.close();
    }

    function killAllProcesses() {
      _.each(procs, function killProc(proc, name) {
        try {
          proc.rawProcess.kill();
        } catch (e) {
          debug('Error killing process %s', name, e);
        }
      });
    }

    function close() {
      return Bluebird
        .try(closeSeleniumSession)
        .catch(function logBrowserCloseError(e) {
          debug('Could not close session', e);
        })
        .then(killAllProcesses);
    }

    function getInitialUrl() {
      return config.get('proxy.targetUrl') + '/testium-priming-load';
    }

    testium = {
      close: close,
      config: config,
      getInitialUrl: getInitialUrl,
      getNewPageUrl: _.partial(getNewPageUrl, config.get('proxy.targetUrl'))
    };
    return testium;
  }

  function verifySelenium(procs) {
    return new Bluebird(function pingStatus(resolve, reject) {
      var seleniumUrl = config.get('selenium.serverUrl');
      debug('Verify selenium: ', seleniumUrl);
      var req = http.get(seleniumUrl + '/status', function onResponse(res) {
        debug('Selenium /status: ', res.statusCode);
        resolve(procs);
      });
      req.on('error', function onRequestError(error) {
        var oldStack = error.stack;
        oldStack = oldStack.substr(oldStack.indexOf('\n') + 1);
        error.message = [
          'Error: Failed to connect to existing selenium server',
          '       - url: ' + seleniumUrl,
          '       - message: ' + error.message
        ].join('\n');
        error.stack = error.message + '\n' + oldStack;
        reject(error);
      });
    });
  }

  return launchAll(config)
    .then(verifySelenium)
    .then(createFromProcesses);
}
module.exports = initTestium;
