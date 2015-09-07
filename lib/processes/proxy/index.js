'use strict';

var findOpenPort = require('find-open-port');
var Bluebird = require('bluebird');

exports.name = 'proxy';

function getProxyOptions(config) {
  function buildOptionsFromPort(port) {
    var appPort = config.get('app.port');
    var proxyModule = require.resolve('./child');

    return {
      command: process.execPath,
      args: [
        proxyModule,
        '' + appPort,
        '' + port
      ],
      port: port,
      timeout: config.get('proxy.timeout', 6000)
    };
  }

  var port = config.get('proxy.port', 0);

  if (port === 0) {
    return findOpenPort().then(buildOptionsFromPort);
  } else {
    return Bluebird.resolve(port).then(buildOptionsFromPort);
  }
}
exports.getOptions = getProxyOptions;

function checkProxyReady(config) {
  return Bluebird.resolve();
}
exports.checkReady = checkProxyReady;
