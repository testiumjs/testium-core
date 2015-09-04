'use strict';

var path = require('path');

var tap = require('tap');

var loadConfig = require('../lib/config');

function enterDirectory(t, relative) {
  var old = process.cwd();
  process.chdir(path.resolve(__dirname, relative));

  t.tearDown(function() {
    process.chdir(old);
  });
}

tap.test('loadConfig just with defaults', function(t) {
  enterDirectory(t, '../');

  t.equal(loadConfig().launch, false,
    'launch is set to the default of false');
  t.end();
});

tap.test('loadConfig with an rc file', function(t) {
  enterDirectory(t, '../examples/rcfile');

  t.equal(loadConfig().launch, true,
    'launch is correctly read from the rc file');
  t.end();
});
