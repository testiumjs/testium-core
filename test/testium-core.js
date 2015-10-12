'use strict';

var tap = require('tap');
var Gofer = require('gofer');
var Bluebird = require('bluebird');

var initTestium = require('../');

var gofer = new Gofer({
  globalDefaults: {}
});
function fetch(uri, options) {
  return Bluebird.resolve(gofer.fetch(uri, options));
}
function fetchResponse(uri, options) {
  return Bluebird.resolve(gofer.fetch(uri, options).getResponse());
}

tap.test('Init against hello-world', function(t) {
  process.chdir(__dirname + '/../examples/hello-world');
  var testium;
  initTestium()
    .then(function(_testium) { testium = _testium; })
    .then(function() {
      t.equal(testium.getNewPageUrl('https://www.example.com', {
        query: { a: 'b' }
      }), 'https://www.example.com/?a=b');

      return fetch(testium.getInitialUrl());
    })
    .then(function(result) {
      t.equal(result, '', 'Initial url returns a blank page');
      return fetch(testium.getNewPageUrl('/foo'));
    })
    .then(function(result) {
      t.equal(result, 'Hello Quinn', 'New page url redirects to target');
      return fetchResponse(
        testium.getNewPageUrl('/echo', { query: { 'x': 'y' } }), { json: true });
    })
    .then(function(response) {
      var echo = response.body;
      t.equal(echo.method, 'GET');
      t.equal(echo.url, '/echo?x=y');

      t.ok(response.headers['set-cookie'], 'Sets a cookie');
      t.ok(('' + response.headers['set-cookie']).indexOf('_testium_=') !== -1,
        'Sets a _testium_ cookie');
    })
    .then(function() {
      t.end();
    })
    .then(null, function(error) {
      if (testium) {
        testium.close();
      }
      t.error(error);
      t.end();
    });
});
