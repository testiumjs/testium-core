'use strict';

var cp = require('child_process');
var path = require('path');

var Bluebird = require('bluebird');
var _ = require('lodash');
var subprocess = require('subprocess');
var debug = require('debug')('testium-core:spawn-server');

function setupChild(optionsByName) {
  return new Bluebird(function(resolve, reject) {
    subprocess(optionsByName, function(error, results) {
      return error ? reject(error) : resolve(results);
    });
  });
}

function spawnServer(config, servers) {
  var root = config.get('root');
  var logDirectory = config.get('logDirectory', './test/log');

  function resolveLogFile(name) {
    return path.resolve(root, logDirectory, name + '.log');
  }

  function addDefaults(name, options) {
    return _.extend({
      logFilePath: resolveLogFile(name)
    }, options);
  }

  if (!Array.isArray(servers)) {
    servers = [ servers ];
  }

  var optionsByName = servers.reduce(function(optionsByName, server) {
    debug('Preparing %s for launch', server.name);
    optionsByName[server.name] =
      Bluebird
        .try(server.getOptions, [ config ])
        .then(_.partial(addDefaults, server.name));
    return optionsByName;
  }, {});

  return Bluebird.props(optionsByName).then(setupChild);
}
module.exports = spawnServer;
