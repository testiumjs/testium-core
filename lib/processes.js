'use strict';

var findOpenPort = require('find-open-port');
var _ = require('lodash');

var spawnServers = require('./spawn-server');

var Phantom = require('./processes/phantom');
var Proxy = require('./processes/proxy');
var App = require('./processes/application');

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
    return spawnServers(config, [ App, Phantom, Proxy ])
      .then(unrefAll);
  }

  // app.port is special because the proxy needs to know it
  if (config.get('app.port', 0) === 0) {
    return findOpenPort().then(launchWithAppPort);
  }
  return launchWithAppPort(config.get('app.port'));
}
module.exports = launchAllProcesses;
