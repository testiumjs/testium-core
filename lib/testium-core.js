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

var Bluebird = require('bluebird');
var debug = require('debug')('testium-core');
var _ = require('lodash');

var Config = require('./config');
var initTestium = require('./init');
var resolveDriver = require('./driver-factory');

var initTestiumOnce = _.once(initTestium);
var getConfig = _.once(Config.load);

var DEFAULT_PAGE_SIZE = { height: 768, width: 1024 };

// For backwards-compatibility
module.exports = initTestium;

function clearCookies(testium) {
  return Bluebird
    .try(_.bindKey(testium.browser, 'clearCookies'))
    .then(_.partial(debug, 'Cookies cleared'))
    .then(_.constant(testium));
}

function primingLoad(testium) {
  return Bluebird
    .try(_.bindKey(testium.browser, 'navigateTo', testium.getInitialUrl()))
    .then(_.partial(debug, 'Browser was primed'))
    .then(_.constant(testium));
}

function resetViewport(testium) {
  var pageSize = testium.config.get('defaultPageSize', DEFAULT_PAGE_SIZE);
  return Bluebird
    .try(_.bindKey(testium.browser, 'setPageSize', pageSize))
    .then(_.partial(debug, 'View reset to default size', pageSize))
    .then(_.constant(testium));
}

function getTestium(options) {
  var config = getConfig();
  var localConfig = config.createShallowChild(options);

  var reuseSession = localConfig.get('reuseSession', true);
  var keepCookies = localConfig.get('keepCookies', false);
  var driverFactory = resolveDriver(localConfig.get('driver', 'wd'));

  var isExistingSession = reuseSession && !!driverFactory.instance;
  var skipPriming = isExistingSession;
  if (skipPriming) {
    debug('Skipping priming load');
  }

  function generateDriverError(error) {
    var logName = config.get('browser') === 'phantomjs' ? 'phantomjs.log' : 'selenium.log';

    error.message = [
      'Failed to initialize WebDriver. Check ' + logName + '.',
      error.message
    ].join('\n');

    throw error;
  }

  return initTestiumOnce(config)
    .then(reuseSession ? driverFactory.once : driverFactory.create)
    .then(resetViewport)
    .then(keepCookies ? _.identity : clearCookies)
    .then(skipPriming ? _.identity : primingLoad)
    .catch(generateDriverError);
}
module.exports.getTestium = getTestium;

function getBrowser(options) {
  return getTestium(options).then(_.property('browser'));
}
module.exports.getBrowser = getBrowser;

module.exports.getConfig = getConfig;
