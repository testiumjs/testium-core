'use strict';

var path = require('path');

var tap = require('tap');

var Config = require('../lib/config');
var launchAllProcesses = require('../lib/processes');

var HELLO_WORLD = path.resolve(__dirname, '../examples/hello-world');

tap.test('Launch all processes', function(t) {
  var config = new Config({ root: HELLO_WORLD, launch: true });
  launchAllProcesses(config)
    .then(function(procs) {
      var procNames = Object.keys(procs).sort();
      t.deepEqual(procNames, [
        'application', 'phantomjs', 'proxy'
      ], 'Spawns app, phantom, and proxy');
      t.end();
    }, function(error) {
      t.error(error);
      t.end();
    });
});
