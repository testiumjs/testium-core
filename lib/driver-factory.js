'use strict';

var debug = require('debug')('testium-core:driver-factory');
var _ = require('lodash');

function loadDriver(driverType) {
  debug('Loading driver', driverType);
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
      if (!factory.instance) {
        factory.instance = createDriver(testium);
      }
      return factory.instance;
    },
  };
  return factory;
}, strictEqualityResolver());

function resolveDriver(driverType) {
  var createDriver = autoloadDriver(driverType);
  return getDriverFactory(createDriver);
}
module.exports = resolveDriver;
