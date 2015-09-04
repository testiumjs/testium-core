'use strict';

var findOpenPort = require('find-open-port');
var Bluebird = require('bluebird');

// 1. Collect port, launch command, arguments, and options
// 2. Launch process (not done in here)
// 3. Check for process ready (maybe using a custom url)
exports.name = 'phantomjs';

function getPhantomOptions(config) {
  function buildOptionsFromPort(port) {
    config.set('phantomjs.port', port);
    config.set('selenium.serverUrl', 'http://127.0.0.1:' + port + '/wd/hub');

    return {
      command: config.get('phantomjs.command', 'phantomjs'),
      args: [
        '--webdriver=' + port,
        '--webdriver-loglevel=DEBUG',
        '--ssl-protocol=tlsv1'
      ],
      port: port,
      timeout: config.get('phantomjs.timeout', 6000)
    };
  }

  var port = config.get('phantomjs.port', 0);
  if (port === 0) {
    return findOpenPort().then(buildOptionsFromPort);
  } else {
    return Bluebird.resolve(buildOptionsFromPort(port));
  }
}
exports.getOptions = getPhantomOptions;

function checkPhantomReady(config) {
  return Bluebird.resolve();
}
exports.checkReady = checkPhantomReady;
