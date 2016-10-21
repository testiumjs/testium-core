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

var debug = require('debug')('testium-core:driver-factory');
var _ = require('lodash');
var Bluebird = require('bluebird');

function loadDriver(driverType) {
  debug('Loading driver', driverType);
  // eslint-disable-next-line global-require
  return require('testium-driver-' + driverType);
}

function autoloadDriver(driverType) {
  if (driverType === false) {
    debug('Driver creation disabled');
    return _.identity;
  }

  switch (typeof driverType) {
    case 'function':
      return driverType;

    case 'string':
      return loadDriver(driverType);

    default:
      throw new Error('Invalid driver type: ' + driverType);
  }
}

// We want to memo based on strict equality, not based on string-value
function strictEqualityResolver() {
  var knownValues = [];
  function resolveMemoKey(value) {
    if (knownValues.indexOf(value) === -1) {
      knownValues.push(value);
    }
    return '' + _.indexOf(knownValues, value);
  }
  return resolveMemoKey;
}

var getDriverFactory = _.memoize(function createDriverFactory(createDriver) {
  var factory = {
    create: createDriver,
    // Exposed so that we can tell if priming is needed
    instance: null,
    once: function createDriverOnce(testium) {
      if (factory.instance) {
        testium.browser = factory.instance;
        return Bluebird.resolve(testium);
      }

      return Bluebird.resolve(createDriver(testium)).then(function saveInst() {
        factory.instance = testium.browser;
        return testium;
      });
    }
  };
  return factory;
}, strictEqualityResolver());

function resolveDriver(driverType) {
  var createDriver = autoloadDriver(driverType);
  return getDriverFactory(createDriver);
}
module.exports = resolveDriver;
