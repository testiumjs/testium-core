'use strict';

var path = require('path');

var tap = require('tap');

var Config = require('../../lib/config');
var Phantom = require('../../lib/processes/phantom');
var spawnServer = require('../../lib/server');

tap.test('Phantom.getOptions', function(t) {
  var config = new Config();
  Phantom.getOptions(config)
    .then(function(options) {
      t.ok(options.port, 'Finds an open port for phantom');
      t.equal(config.get('selenium.serverUrl'),
        'http://127.0.0.1:' + options.port + '/wd/hub',
        'Sets the selenium server url');
      t.end();
    }, function(error) {
      t.error(error);
      t.end();
    });
});

tap.test('Launching phantom', function(t) {
  var config = new Config({
    root: path.resolve(__dirname, '../tmp/phantom')
  });
  spawnServer(config, Phantom)
    .then(function(phantom) {
      phantom.kill();
      t.end();
    })
    .then(null, function(error) {
      t.error(error);
      t.end();
    });
});
