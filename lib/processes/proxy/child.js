'use strict';

var proxy = require('./proxy');

var appPort = parseInt(process.argv[2], 10);
var proxyPort = parseInt(process.argv[3], 10);
var commandPort = 4446;

proxy(proxyPort, appPort, commandPort);
