'use strict';

var path = require('path');

var tap = require('tap');

var Config = require('../lib/config');

function enterDirectory(t, relative) {
  var old = process.cwd();
  process.chdir(path.resolve(__dirname, relative));

  t.tearDown(function() {
    process.chdir(old);
  });
}

tap.test('Config::set', function(t) {
  var config = new Config({ original: 42 });
  config.set('original', 13);
  t.equal(config.original, 13, 'changes existing values');
  config.set('a.b.c', 'foo');
  t.equal(config.a.b.c, 'foo', 'can introduce new nested key');
  t.end();
});

tap.test('Config.load just with defaults', function(t) {
  enterDirectory(t, '../');

  t.equal(Config.load().launch, false,
    'launch is set to the default of false');
  t.end();
});

tap.test('Config.load with an rc file', function(t) {
  enterDirectory(t, '../examples/rcfile');

  var config = Config.load();

  t.equal(config.launch, true,
    'launch is correctly read from the rc file');
  t.equal(config.get('launch'), true,
    'can retrieve the setting using get(propertyPath)');

  t.equal(config.get('not.a.thing', 'or this'), 'or this',
    'Allows specifying a default value');
  t.throws(function() { config.get('not.a.thing'); },
    { message: 'Missing required config setting "not.a.thing"' },
    'Throws when trying to retrieve a non-existing setting');
  t.equal(config.get('not.a.thing', null), null,
    'Allows specifying `null` as a default for optional settings');
  t.end();
});
