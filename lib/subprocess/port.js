'use strict';

const { createServer } = require('net');

const portscanner = require('portscanner');

async function isAvailable(port) {
  const status = await portscanner.checkPortStatus(port, '127.0.0.1');
  return status === 'closed';
}

function findOpen(port = 0) {
  const server = createServer();
  return new Promise((resolve, reject) => {
    server.on('error', error => {
      error.message = `Checking port ${port}:\n${error.message}`;
      reject(error);
    });
    server.listen(port, function() {
      ({ port } = this.address());
      server.on('close', () => {
        resolve(port);
      });
      server.close();
    });
  });
}

module.exports = {
  isAvailable,
  findOpen,
};
