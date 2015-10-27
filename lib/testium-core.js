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
  var driverFactory = resolveDriver(localConfig.get('driver', 'sync'));

  var launchApp = config.get('launch', false);
  var isExistingSession = reuseSession && !!driverFactory.instance;
  var skipPriming = !launchApp || isExistingSession;
  if (skipPriming) {
    debug('Skipping priming load');
  }

  function generateDriverError(error) {
    var logName = config.get('browser') === 'phantomjs' ? 'phantomjs.log' : 'selenium.log';

    error.message = [
      'Failed to initialize WebDriver. Check ' + logName + '.',
      error.message,
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
