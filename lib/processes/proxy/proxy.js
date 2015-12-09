/* eslint no-console:0 */
'use strict';

var http = require('http');
var parseUrl = require('url').parse;

var concat = require('concat-stream');
var _ = require('lodash');
var qs = require('qs');

var modifyResponse = require('testium-cookie').modifyResponse;

function buildRemoteRequestOptions(request, fromPort, toPort) {
  var uri = parseUrl(request.url);
  var opt = {
    path: uri.path,
    method: request.method,
    headers: request.headers,
  };

  var hostHeader = request.headers.host;
  if (!hostHeader || request.headers.host === '127.0.0.1:' + fromPort) {
    opt.host = '127.0.0.1';
    opt.port = toPort;
  } else {
    var parts = hostHeader.split(':');
    opt.host = parts[0];
    opt.port = parts[1];
  }

  opt.headers.connection = 'keep-alive';
  opt.headers['cache-control'] = 'no-store';
  delete opt.headers['if-none-match'];
  delete opt.headers['if-modified-since'];
  return opt;
}

function normalizeOptions(options) {
  options.url = options.url || '/';
  options.serverUrl = parseUrl(options.url).path;
  options.redirect = options.redirect === true || options.redirect === 'true';
  return options;
}

var openRequests = [];
var firstPage = true;
var newPageOptions = {};

function markNewPage(options, response, fromPort) {
  newPageOptions = normalizeOptions(options);
  console.log('\n[System] Marking new page request with options: %j', newPageOptions);

  openRequests.forEach(function abortRequest(request) {
    console.log('[System] Aborting request for: %s', request.path);
    request.aborted = true;
    request.abort();
  });
  openRequests = [];

  if (options.redirect) {
    var targetUrl = options.url[0] === '/' ?
      'http://127.0.0.1:' + fromPort + options.url : options.url;
    response.writeHead(302, {
      Location: targetUrl,
    });
  }

  response.end();
}

function isNewPage(url) {
  // This completely ignores the hostname right now.
  // Which shouldn't cause problems unless someone tries to load
  // the exact same url from two hosts at the same time.
  return url === newPageOptions.serverUrl;
}

function markRequestClosed(targetRequest) {
  openRequests = _.without(openRequests, targetRequest);
}

function commandError(url, response) {
  console.log('[System] Unknown command: %s', url);
  response.statusCode = 500;
  response.writeHead(response.statusCode, response.headers);
  response.end();
}

function emptySuccess(response) {
  // force a blank, successful html response
  response.writeHead(200, { 'Content-Type': 'text/html' });
  response.end();
}

function proxyCommand(url, options, response, fromPort) {
  switch (url) {
  case '/new-page':
  case '/testium-new-page':
    return markNewPage(options, response, fromPort);
  default:
    return commandError(url, response);
  }
}

function modifyRequest(request, options) {
  if (!options.headers) {
    return;
  }

  _.each(options.headers, function copyHeader(value, header) {
    request.headers[header] = value;
  });
}

function proxyRequest(request, response, fromPort, toPort) {
  var parsedUrl = parseUrl(request.url);
  if (parsedUrl.pathname === '/testium-new-page') {
    return markNewPage(qs.parse(parsedUrl.query), response, fromPort);
  } else if (firstPage || parsedUrl.pathname === '/testium-priming-load') {
    firstPage = false;
    console.log('--> %s %s (prime the browser)', request.method, request.url);
    return emptySuccess(response);
  }

  console.log('--> %s %s', request.method, request.url);

  var remoteRequestOptions = buildRemoteRequestOptions(request, fromPort, toPort);
  if (isNewPage(parsedUrl.path)) {
    modifyRequest(remoteRequestOptions, newPageOptions);
  }
  console.log('    %j', remoteRequestOptions);

  var remoteRequest = http.request(remoteRequestOptions, function forwardResponse(remoteResponse) {
    markRequestClosed(remoteRequest);

    if (isNewPage(parsedUrl.path)) {
      modifyResponse(remoteResponse);
    }

    response.writeHead(remoteResponse.statusCode, remoteResponse.headers);
    remoteResponse.on('end', function logEnd() {
      console.log('<-- %s %s', response.statusCode, request.url);
    });

    remoteResponse.pipe(response);
  });

  remoteRequest.on('error', function onFetchFailed(error) {
    response.statusCode = 500;

    markRequestClosed(remoteRequest);

    if (isNewPage(parsedUrl.path)) {
      modifyResponse(response);
    }

    console.log(error.stack);
    console.log('<-- %s %s', response.statusCode, request.url);

    response.writeHead(response.statusCode, response.headers);
    response.end();
  });

  openRequests.push(remoteRequest);

  request.pipe(remoteRequest);
  request.on('end', function sendRemoteRequest() {
    remoteRequest.end();
  });
}

module.exports =
function startProxy(fromPort, toPort, commandPort) {
  var server = http.createServer(function handleProxy(request, response) {
    proxyRequest(request, response, fromPort, toPort);
  });
  server.listen(fromPort);
  console.log('Listening on port %s and proxying to %s.', fromPort, toPort);

  var commandServer = http.createServer(function handleCommand(request, response) {
    if (request.method === 'GET') {
      var parsedUrl = parseUrl(request.url);
      proxyCommand(parsedUrl.pathname, qs.parse(parsedUrl.query), response, fromPort);
    } else {
      request.pipe(concat(function withBody(body) {
        var options;
        if (body) {
          options = JSON.parse(body.toString());
        }
        proxyCommand(request.url, options, response, fromPort);
      }));
    }
  });
  commandServer.listen(commandPort);
  console.log('Listening for commands on port %s.', commandPort);
};
