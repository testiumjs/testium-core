'use strict';

var findOpenPort = require('find-open-port');
var Bluebird = require('bluebird');

exports.name = 'proxy';

function getProxyOptions(config) {
  function buildOptionsFromPort(port) {
    var appPort = config.get('app.port');
    var proxyModule = require.resolve('./child');
    var commandPort = 4446;

    config.set('proxy.targetUrl', 'http://127.0.0.1:' + port);
    config.set('proxy.commandUrl', 'http://127.0.0.1:' + commandPort);

    var proxyType = config.get('proxy.proxyType', 'direct');
    if (proxyType === 'manual') {
      var httpProxy = '127.0.0.1:' + config.get('proxy.port');
      config.set('desiredCapabilities.proxy.proxyType', 'manual');
      config.set('desiredCapabilities.proxy.httpProxy', httpProxy);
    }

    return {
      dependsOn: config.getBool('launch', false) ? [ 'application' ] : [],
      command: process.execPath,
      commandArgs: [
        proxyModule,
        '' + appPort,
        '' + port,
        '' + commandPort,
      ],
      port: port,
      verifyTimeout: config.get('proxy.timeout', 6000),
    };
  }

  // Defaulting to 4445 for backward compatibility
  var port = config.get('proxy.port', 4445);

  if (port === 0) {
    return findOpenPort().then(buildOptionsFromPort);
  }
  return Bluebird.resolve(port).then(buildOptionsFromPort);
}
exports.getOptions = getProxyOptions;
