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

const Bluebird = require('bluebird');
const debug = require('debug')('testium-core');
const bindKey = require('lodash/bindKey');
const constant = require('lodash/constant');
const once = require('lodash/once');

const Config = require('./config');
const initTestium = require('./init');
const resolveDriver = require('./driver-factory');

const initTestiumOnce = once(initTestium);
const getConfig = once(Config.load);

const DEFAULT_PAGE_SIZE = { height: 768, width: 1024 };

// For backwards-compatibility
module.exports = initTestium;

function clearCookies(testium) {
  return Bluebird.try(bindKey(testium.browser, 'clearCookies'))
    .then(debug.bind(null, 'Cookies cleared'))
    .then(constant(testium));
}

function primingLoad(testium) {
  return Bluebird.try(
    bindKey(testium.browser, 'navigateTo', testium.getInitialUrl())
  )
    .then(debug.bind(null, 'Browser was primed'))
    .then(constant(testium));
}

function resetViewport(testium) {
  const pageSize = testium.config.get('defaultPageSize', DEFAULT_PAGE_SIZE);
  return Bluebird.try(bindKey(testium.browser, 'setPageSize', pageSize))
    .then(debug.bind(null, 'View reset to default size', pageSize))
    .then(constant(testium));
}

function getTestium(options) {
  const config = getConfig();
  const localConfig = config.createShallowChild(options);

  const reuseSession = localConfig.get('reuseSession', true);
  const keepCookies = localConfig.get('keepCookies', false);
  const driverFactory = resolveDriver(localConfig.get('driver', 'wd'));

  const skipPriming = reuseSession && !!driverFactory.instance;
  if (skipPriming) {
    debug('Skipping priming load');
  }

  function generateDriverError(error) {
    const logName =
      config.get('browser') === 'phantomjs' ? 'phantomjs.log' : 'selenium.log';

    error.message = [
      `Failed to initialize WebDriver. Check ${logName}.`,
      error.message,
    ].join('\n');

    throw error;
  }

  return initTestiumOnce(config)
    .then(reuseSession ? driverFactory.once : driverFactory.create)
    .then(resetViewport)
    .then((...args) => (keepCookies ? args[0] : clearCookies(...args)))
    .then((...args) => (skipPriming ? args[0] : primingLoad(...args)))
    .catch(generateDriverError);
}
module.exports.getTestium = getTestium;

function getBrowser(options) {
  return getTestium(options).then(testium => testium.browser);
}
module.exports.getBrowser = getBrowser;

module.exports.getConfig = getConfig;
