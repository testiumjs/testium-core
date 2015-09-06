'use strict';

var http = require('http');
var name = process.argv[2] || 'World';

http.createServer(function(req, res) {
  res.end('Hello ' + name);
}).listen(process.env.PORT || 3000);
