'use strict';

var cp = require('child_process')

var Bluebird = require('bluebird');
var _ = require('lodash');

var initLogs = require('./logs');
var autoKillChild = require('./auto-kill');
var waitForChild = require('./wait-for-child');

function setupChild(results) {
  var logHandle = results.log.fd;
  var options = results.options;
  var command = options.command;
  var args = options.args;
  var port = options.port;
  var timeout = options.timeout || 1000;

  var spawnOpts = _.extend({
    stdio: [ 'ignore', logHandle, logHandle ],
    cwd: process.cwd()
  }, _.pick(options, 'cwd', 'env'));
  var child = cp.spawn(command, args, spawnOpts);
  autoKillChild(child);
  child.baseUrl = 'http://127.0.0.1:' + port;
  child.logPath = results.log.filename;
  child.logHandle = logHandle;
  child.launchCommand = command;
  child.launchArguments = args;
  child.workingDirectory = spawnOpts.cwd;
  child.name = results.name;

  console.log('waiting for child');
  return waitForChild(child, port, timeout);
}

function spawnServer(config, server) {
  var logs = initLogs(config);

  return Bluebird.props({
    name: server.name,
    log: logs.openLogFile(server.name, 'w+'),
    options: server.getOptions(config)
  }).then(setupChild);
}
module.exports = spawnServer;
