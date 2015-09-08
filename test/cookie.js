'use strict';

var tap = require('tap');

var parseCookie = require('cookie').parse;

var cookie = require('../cookie');

function makeResponse() {
  return {
    statusCode: 420,
    headers: {
      'x-rate-limit': '250'
    }
  };
}

tap.test('Adding the _testium_ cookie to a response', function(t) {
  var res = makeResponse();
  cookie.modifyResponse(res);
  t.ok(res.headers['Set-Cookie'], 'Sets a cookie header');
  t.end();
});

tap.test('Parsing the _testium_ cookie', function(t) {
  var res = makeResponse();
  cookie.modifyResponse(res);
  var cookies = parseCookie(res.headers['Set-Cookie']);
  var meta = cookie.getTestiumCookie(cookies);
  t.equal(meta.statusCode, 420, 'Can retrieve the status code');
  t.equal(meta.headers['x-rate-limit'], '250', 'Can retrieve a header');
  t.end();
});
