'use strict';

var findOpenPort = require('find-open-port');
var Bluebird = require('bluebird');

exports.name = 'phantomjs';

function getPhantomOptions(config) {
  function buildOptionsFromPort(port) {
    config.set('phantomjs.port', port);
    config.set('selenium.serverUrl', 'http://127.0.0.1:' + port + '/wd/hub');

    return {
      command: config.get('phantomjs.command', 'phantomjs'),
      commandArgs: [
        '--webdriver=' + port,
        '--webdriver-loglevel=DEBUG',
        '--ssl-protocol=tlsv1',
      ],
      port: port,
      verifyTimeout: config.get('phantomjs.timeout', 6000),
    };
  }

  var port = config.get('phantomjs.port', 0);
  if (port === 0) {
    return findOpenPort().then(buildOptionsFromPort);
  }
  return Bluebird.resolve(port).then(buildOptionsFromPort);
}
exports.getOptions = getPhantomOptions;
