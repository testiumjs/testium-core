/**
 * WebDriver does not return status codes or response headers.
 * This module stores those in a special cookie that can be read
 * from normal WebDriver methods.
 */
'use strict';

function encode(string) {
  return new Buffer(string).toString('base64');
}

function buildCookie(headers, statusCode) {
  var jsonData = JSON.stringify({
    headers: headers,
    statusCode: statusCode
  });
  var encodedData = encode(encodedData);
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
module.exports = modifyResponse;
