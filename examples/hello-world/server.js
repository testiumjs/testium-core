'use strict';

const http = require('http');

const name = process.argv[2] || 'World';

http
  .createServer((req, res) => {
    // eslint-disable-next-line no-console
    console.log('%s %s', req.method, req.url);
    if (req.url.indexOf('/echo') === 0) {
      res.setHeader('Content-Type', 'application/json');
      return void res.end(
        JSON.stringify({
          method: req.method,
          url: req.url,
          headers: req.headers,
        })
      );
    }
    res.end(`Hello ${name}`);
  })
  .listen(process.env.PORT || 3000);
