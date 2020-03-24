'use strict';

const findOpenPort = require('find-open-port');

function getPort(config, key, defaultPort = 0) {
  const port = parseInt(config.get(key, defaultPort), 10);
  return port === 0 ? findOpenPort() : Promise.resolve(port);
}

exports.getPort = getPort;
