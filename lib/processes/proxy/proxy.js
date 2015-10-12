'use strict';

var http = require('http');
var url = require('url');

var concat = require('concat-stream');
var _ = require('lodash');
var qs = require('qs');

var modifyResponse = require('testium-cookie').modifyResponse;

function buildRemoteRequestOptions(request, toPort) {
  var uri = url.parse(request.url);
  var opt = {
    port: toPort,
    path: uri.path,
    method: request.method,
    headers: request.headers
  };

  opt.headers.connection = 'keep-alive';
  opt.headers['cache-control'] = 'no-store';
  delete opt.headers['if-none-match'];
  delete opt.headers['if-modified-since'];
  return opt;
}

function trimHash(url) {
  return url.split('#')[0];
}

function normalizeOptions(options) {
  options.url = trimHash(options.url || '/');
  options.redirect = options.redirect === true || options.redirect === 'true';
  return options;
}

var openRequests = [];
var firstPage = true;
var newPageOptions = {};

function markNewPage(options, response, fromPort) {
  newPageOptions = normalizeOptions(options);
  console.log('\n[System] Marking new page request with options: %j', newPageOptions);

  openRequests.forEach(function(request) {
    console.log('[System] Aborting request for: %s', request.path);
    request.aborted = true;
    request.abort();
  });
  openRequests = [];

  if (options.redirect) {
    var targetUrl = 'http://127.0.0.1:' + fromPort + options.url;
    response.writeHead(302, {
      Location: targetUrl
    });
  }

  response.end();
}

function isNewPage(url) {
  return url === newPageOptions.url;
}

function markRequestClosed(targetRequest) {
  openRequests = openRequests.filter(function(request) {
    return request !== targetRequest;
  });
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
  switch(url) {
    case '/new-page':
      return markNewPage(options, response, fromPort);
    default:
      return commandError(url, response);
  }
}

function modifyRequest(request, options) {
  if (!options.headers) {
    return;
  }

  _.each(options.headers, function(value, header) {
    request.headers[header] = value;
  });
}

function proxyRequest(request, response, modifyResponse, toPort) {
  if (firstPage || request.url === '/testium-priming-load') {
    firstPage = false;
    console.log('--> %s %s (prime the browser)', request.method, request.url);
    return emptySuccess(response);
  }

  console.log('--> %s %s', request.method, request.url);

  var remoteRequestOptions = buildRemoteRequestOptions(request, toPort);
  console.log('    %j', remoteRequestOptions);

  if (isNewPage(request.url)) {
    modifyRequest(remoteRequestOptions, newPageOptions);
  }

  var remoteRequest = http.request(remoteRequestOptions, function(remoteResponse) {
    markRequestClosed(remoteRequest);

    if (isNewPage(request.url)) {
      modifyResponse(remoteResponse);
    }

    response.writeHead(remoteResponse.statusCode, remoteResponse.headers);
    remoteResponse.on('end', function() {
      console.log('<-- %s %s', response.statusCode, request.url);
    });

    remoteResponse.pipe(response);
  });

  remoteRequest.on('error', function(error) {
    response.statusCode = 500;

    markRequestClosed(remoteRequest);

    if (isNewPage(request.url)) {
      modifyResponse(response);
    }

    console.log(error.stack);
    console.log('<-- %s %s', response.statusCode, request.url);

    response.writeHead(response.statusCode, response.headers);
    response.end();
  });

  openRequests.push(remoteRequest);

  request.pipe(remoteRequest);
  request.on('end', function() {
    remoteRequest.end();
  });
}

module.exports =
function startProxy(fromPort, toPort, commandPort) {
  var server = http.createServer(function(request, response) {
    proxyRequest(request, response, modifyResponse, toPort);
  });
  server.listen(fromPort);
  console.log('Listening on port %s and proxying to %s.', fromPort, toPort);

  var commandServer = http.createServer(function(request, response) {
    if (request.method === 'GET') {
      var parsedUrl = url.parse(request.url);
      proxyCommand(parsedUrl.pathname, qs.parse(parsedUrl.query), response, fromPort);
    } else {
      request.pipe(concat(function(body) {
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
