'use strict';

var findOpenPort = require('find-open-port');
var _ = require('lodash');
var debug = require('debug')('testium-core:processes');

var spawnServers = require('./spawn-server');

var Phantom = require('./processes/phantom');
var Proxy = require('./processes/proxy');
var App = require('./processes/application');
var Selenium = require('./processes/selenium');

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

    var servers = [ Proxy ];

    if (launchApp) {
      debug('Launching app');
      servers.push(App);
    } else {
      debug('Using already running application on port %d', appPort);
    }

    var seleniumUrl = config.get('selenium.serverUrl', false);
    if (!seleniumUrl) {
      debug('Will launch selenium server for %j', browserName);
      servers.push(browserName === 'phantomjs' ? Phantom : Selenium);
    } else {
      debug('Using existing selenium server', seleniumUrl);
    }

    return spawnServers(config, servers)
      .then(unrefAll);
  }

  // app.port is special because the proxy needs to know it
  var appPort = config.get('app.port', launchApp ? 0 : -1);
  if (appPort === 0) {
    return findOpenPort().then(launchWithAppPort);
  }
  return launchWithAppPort(appPort);
}
module.exports = launchAllProcesses;
