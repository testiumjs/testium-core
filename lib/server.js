'use strict';

var Bluebird = require('bluebird');

var initLogs = require('./logs');

function spawnServer(config, server) {
  var name = server.name;
  var timeout = server.timeout || 1000;
  var port = server.port;

  var logs = initLogs(config);

  return Bluebird.props({
    log: logs.openLogFile(name, 'w+'),
    options: server.getOptions(config)
  });
}
