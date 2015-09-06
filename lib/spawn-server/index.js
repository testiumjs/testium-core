'use strict';

var cp = require('child_process')

var Bluebird = require('bluebird');
var _ = require('lodash');

var initLogs = require('./logs');
var autoKillChild = require('./auto-kill');

function setupChild(results) {
  var logHandle = results.log.fd;
  var options = results.options;
  var command = options.command;
  var args = options.args;

  var spawnOpts = _.extend({
    stdio: [ 'ignore', logHandle, logHandle ],
    cwd: process.cwd()
  }, _.pick(options, 'cwd', 'env'));
  var child = cp.spawn(command, args, spawnOpts);
  autoKillChild(child);
  child.baseUrl = 'http://127.0.0.1:' + options.port;
  child.logPath = results.log.filename;
  child.logHandle = logHandle;
  child.launchCommand = command;
  child.launchArguments = args;
  child.workingDirectory = spawnOpts.cwd;
  child.name = options.name;

  return child;
}

function spawnServer(config, server) {
  var logs = initLogs(config);

  return Bluebird.props({
    log: logs.openLogFile(server.name, 'w+'),
    options: server.getOptions(config)
  }).then(setupChild);
}
module.exports = spawnServer;
