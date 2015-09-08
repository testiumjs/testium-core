'use strict';

var path = require('path');

var tap = require('tap');

var Config = require('../../lib/config');
var App = require('../../lib/processes/application');
var Proxy = require('../../lib/processes/proxy');
var spawnServer = require('../../lib/spawn-server');

var HELLO_WORLD = path.resolve(__dirname, '../../examples/hello-world');

tap.test('Proxy.getOptions', function(t) {
  var config = new Config({ app: { port: 3041 } });
  Proxy.getOptions(config)
    .then(function(options) {
      t.ok(options.port, 'Finds an open port for the proxy');
      t.equal(options.commandArgs[1], '3041',
        'Passes in the app port as the 2nd param to the child');
      t.end();
    }, function(error) {
      t.error(error);
      t.end();
    });
});

tap.test('Launching the proxy', function(t) {
  var config = new Config({
    root: HELLO_WORLD,
    app: { port: 3041 }
  });
  spawnServer(config, [ Proxy, App ])
    .then(function(results) {
      var proxy = results['proxy'].rawProcess;
      proxy.kill();

      var app = results['application'].rawProcess;
      app.kill();

      t.end();
    })
    .then(null, function(error) {
      t.error(error);
      t.end();
    });
});
