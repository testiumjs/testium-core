'use strict';

const net = require('net');

const port = process.argv[2];

const server = net.createServer(c => {
  c.write('hello\r\n');
  c.pipe(c);
});

server.listen(port, () => {
  // eslint-disable-next-line no-console
  console.log('booted on port: ', port);
});
