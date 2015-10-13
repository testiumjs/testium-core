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
  _.each(procs, function(proc, name) {
    proc.rawProcess.unref();
  });
  return procs;
}

function launchAllProcesses(config) {
  function launchWithAppPort(appPort) {
    config.set('app.port', appPort);

    var browserName = config.get('browser');
    config.set('desiredCapabilities.browserName', browserName);

    var servers = [ Proxy ];

    if (config.get('launch', false)) {
      debug('Launching app');
      servers.push(App);
    } else {
      debug('Using already running application');
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
  if (config.get('app.port', 0) === 0) {
    return findOpenPort().then(launchWithAppPort);
  }
  return launchWithAppPort(config.get('app.port'));
}
module.exports = launchAllProcesses;
