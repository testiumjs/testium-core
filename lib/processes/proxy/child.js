'use strict';

var http = require('http');

var appPort = parseInt(process.argv[2], 10);
var proxyPort = parseInt(process.argv[3], 10);
var commandPort = 4446;

function handleRequest(req, res) {
}

http.createServer(handleRequest).listen(proxyPort);
