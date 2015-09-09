'use strict';

var _ = require('lodash');

// TODO: Move into testium-cookie (?)

function encode(string) {
  return new Buffer(string).toString('base64');
}

function decode(value) {
  return new Buffer(value, 'base64').toString('utf8');
}

function buildCookie(headers, statusCode) {
  var jsonData = JSON.stringify({
    headers: headers,
    statusCode: statusCode
  });
  var encodedData = encode(jsonData);
  return '_testium_=' + encodedData + '; path=/';
}

function modifyResponse(response) {
  response.headers = response.headers || {};

  if (response.headers['Set-Cookie']) {
    console.log('Existing Set-Cookie Header!', response.headers['Set-Cookie']);
  }

  response.headers['Cache-Control'] = 'no-store';
  response.headers['Set-Cookie'] = buildCookie(response.headers, response.statusCode);

  if (response.statusCode >= 400) {
    // force to 200 because phantomjs doesn't like
    // 400 and 500 status codes when taking screenshots
    console.log('<-- forcing status code from %s to 200', response.statusCode);
    response.statusCode = 200;
  }

  console.log('<-- Set-Cookie: %s', response.headers['Set-Cookie']);
  return response;
}
exports.modifyResponse = modifyResponse;

function tryParse(jsonString) {
  try {
    return JSON.parse(jsonString);
  } catch (error) {
    error.message = [
      'Unable to parse JSON: ' + error.message,
      'Attempted to parse: ' + jsonString
    ].join('\n');
    throw error;
  }
}

function parseTestiumCookie(cookie) {
  var json = decode(typeof cookie === 'string' ? cookie : cookie.value);
  return tryParse(json);
}

function getTestiumCookie(cookies) {
  // Gracefully handles the result of cookie.parse and an array of cookie objects
  var testiumCookie = cookies._testium_ || _.find(cookies, { name: '_testium_' });

  if (!testiumCookie) {
    throw new Error('Unable to communicate with internal proxy. Make sure you are using relative paths.');
  }

  return parseTestiumCookie(testiumCookie);
}
exports.getTestiumCookie = getTestiumCookie;
