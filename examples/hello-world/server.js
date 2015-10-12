'use strict';

var http = require('http');
var name = process.argv[2] || 'World';

http.createServer(function(req, res) {
  if (req.url.indexOf('/echo') === 0) {
    res.setHeader('Content-Type', 'application/json');
    return res.end(JSON.stringify({
      method: req.method,
      url: req.url,
      headers: req.headers
    }));
  }
  res.end('Hello ' + name);
}).listen(process.env.PORT || 3000);
