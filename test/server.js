'use strict';

var path = require('path');

var test = require('tap').test;

var Config = require('../lib/config');
var spawnServer = require('../lib/server');

test('spawn a simple node http server', function(t) {
  spawnServer(new Config({
    root: __dirname + '/tmp/server'
  }), {
    name: 'hello-world',
    getOptions: function() {
      return {
        command: process.execPath,
        args: [ 'examples/hello-world/server.js', 'Robin' ],
        port: 3040
      };
    }
  }).then(function(child) {
    t.type(child.pid, 'number', 'has a numeric pid');
    child.kill();
    t.end();
  });
});
