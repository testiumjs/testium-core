'use strict';

var path = require('path');

var test = require('tap').test;

var Config = require('../lib/config');
var spawnServer = require('../lib/spawn-server');

test('spawn a simple node http server', function(t) {
  spawnServer(new Config({
    root: __dirname + '/tmp/server'
  }), {
    name: 'hello-world',
    getOptions: function() {
      return {
        command: process.execPath,
        commandArgs: [ 'examples/hello-world/server.js', 'Robin' ],
        port: 3000
      };
    }
  }).then(function(results) {
    var child = results['hello-world'].rawProcess;
    t.type(child.pid, 'number', 'has a numeric pid');
    child.kill();
    t.end();
  });
});

test('a child that fails to start', function(t) {
  spawnServer(new Config({
    root: __dirname + '/tmp/server'
  }), {
    name: 'throws',
    getOptions: function() {
      return {
        command: process.execPath,
        commandArgs: [ 'examples/throws/server.js', 'Robin' ],
        port: 3040
      };
    }
  }).then(function(results) {
    var child = results['throws'].rawProcess;
    t.fail('Should have failed b/c the child exits');
    child.kill();
    t.end();
  }, function(error) {
    t.end();
  });
});

test('a child that takes too long to listen', function(t) {
  spawnServer(new Config({
    root: __dirname + '/tmp/server'
  }), {
    name: 'hello-world',
    getOptions: function() {
      return {
        command: process.execPath,
        commandArgs: [ 'examples/hello-world/server.js', 'Robin' ],
        verifyTimeout: 250,
        port: 3001 // wrong port on purpose
      };
    }
  }).then(function(results) {
    var child = results['hello-world'].rawProcess;
    t.fail('Should have failed b/c the child listens on the wrong port');
    child.kill();
    t.end();
  }, function(error) {
    t.end();
  });
});
