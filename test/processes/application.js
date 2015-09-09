'use strict';

var path = require('path');

var tap = require('tap');

var Config = require('../../lib/config');
var App = require('../../lib/processes/application');
var spawnServer = require('../../lib/spawn-server');

var HELLO_WORLD = path.resolve(__dirname, '../../examples/hello-world');

tap.test('App.getOptions', function(t) {
  var config = new Config({ root: HELLO_WORLD });
  App.getOptions(config)
    .then(function(options) {
      t.ok(options.port, 'Finds an open port for the app');
      t.equal(options.command, 'node',
        'Parses command from scripts.start');
      t.deepEqual(options.commandArgs, [ 'server.js', 'Quinn' ],
        'Parses commandArgs from scripts.start');
      t.end();
    }, function(error) {
      t.error(error);
      t.end();
    });
});

tap.test('Launching an application', function(t) {
  var config = new Config({ root: HELLO_WORLD });
  spawnServer(config, App)
    .then(function(results) {
      var app = results['application'].rawProcess;
      app.kill();
      t.end();
    }, function(error) {
      t.error(error);
      t.end();
    });
});
