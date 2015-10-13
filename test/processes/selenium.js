'use strict';

var path = require('path');

var tap = require('tap');

var Config = require('../../lib/config');
var Selenium = require('../../lib/processes/selenium');
var spawnServer = require('../../lib/spawn-server');

tap.test('Launching selenium for firefox', function(t) {
  var config = new Config({
    browser: 'firefox',
    root: path.resolve(__dirname, '../tmp/selenium')
  });
  spawnServer(config, Selenium)
    .then(function(results) {
      var selenium = results['selenium'].rawProcess;
      selenium.kill();

      t.equal(config.get('selenium.serverUrl'),
        'http://127.0.0.1:' + config.get('selenium.port') + '/wd/hub',
        'Sets the selenium server url');

      t.end();
    }, function(error) {
      t.error(error);
      t.end();
    });
});
