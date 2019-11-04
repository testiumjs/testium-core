/*
 * Copyright (c) 2015, Groupon, Inc.
 * All rights reserved.
 *
 * Redistribution and use in source and binary forms, with or without
 * modification, are permitted provided that the following conditions
 * are met:
 *
 * Redistributions of source code must retain the above copyright notice,
 * this list of conditions and the following disclaimer.
 *
 * Redistributions in binary form must reproduce the above copyright
 * notice, this list of conditions and the following disclaimer in the
 * documentation and/or other materials provided with the distribution.
 *
 * Neither the name of GROUPON nor the names of its contributors may be
 * used to endorse or promote products derived from this software without
 * specific prior written permission.
 *
 * THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS "AS
 * IS" AND ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED
 * TO, THE IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A
 * PARTICULAR PURPOSE ARE DISCLAIMED. IN NO EVENT SHALL THE COPYRIGHT
 * HOLDER OR CONTRIBUTORS BE LIABLE FOR ANY DIRECT, INDIRECT, INCIDENTAL,
 * SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES (INCLUDING, BUT NOT LIMITED
 * TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES; LOSS OF USE, DATA, OR
 * PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND ON ANY THEORY OF
 * LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT (INCLUDING
 * NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE OF THIS
 * SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.
 */
/* eslint no-console:0 */

'use strict';

const http = require('http');
const { URL } = require('url');

const concat = require('concat-stream');
const _ = require('lodash');

const modifyResponse = require('testium-cookie').modifyResponse;

function fromEntries(entries) {
  return [...entries].reduce(
    (o, [k, v]) => ({
      ...o,
      [k]: v,
    }),
    {}
  );
}

function buildRemoteRequestOptions(request, toPort) {
  const opt = {
    port: toPort,
    path: request.url.replace(/^https?:\/\/[^/]+/, ''),
    method: request.method,
    headers: request.headers,
  };

  opt.headers.connection = 'keep-alive';
  opt.headers['cache-control'] = 'no-store';
  delete opt.headers['if-none-match'];
  delete opt.headers['if-modified-since'];
  return opt;
}

function normalizeOptions(options) {
  options.url = options.url || '/';
  options.redirect = options.redirect === true || options.redirect === 'true';
  return options;
}

let openRequests = [];
let firstPage = true;
let newPageOptions = {};

function markNewPage(options, response, proxyUrl) {
  newPageOptions = normalizeOptions(options);
  console.log(
    '\n[System] Marking new page request with options: %j',
    newPageOptions
  );

  openRequests.forEach(request => {
    console.log('[System] Aborting request for: %s', request.path);
    request.aborted = true;
    request.abort();
  });
  openRequests = [];

  if (options.redirect) {
    const targetUrl = proxyUrl + options.url;
    console.log('[System] 302 -> %s', targetUrl);
    response.writeHead(302, {
      Location: targetUrl,
    });
  }

  response.end();
}

function stripHash(url) {
  return url.split('#')[0];
}

function isNewPage(url) {
  if (!newPageOptions.url) return false;
  return url === stripHash(newPageOptions.url);
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

function proxyCommand(url, options, response, proxyUrl) {
  console.log('~~> command: %s, %j', url, options);
  switch (url) {
    case '/new-page':
      return markNewPage(options, response, proxyUrl);
    default:
      return commandError(url, response);
  }
}

function modifyRequest(request, options) {
  if (!options.headers) {
    return;
  }

  _.each(options.headers, (value, header) => {
    request.headers[header] = value;
  });
}

function proxyRequest(request, response, toPort) {
  if (firstPage || request.url === '/testium-priming-load') {
    firstPage = false;
    console.log('--> %s %s (prime the browser)', request.method, request.url);
    emptySuccess(response);
    return;
  }

  console.log('--> %s %s', request.method, request.url);

  const remoteRequestOptions = buildRemoteRequestOptions(request, toPort);
  if (isNewPage(request.url)) {
    modifyRequest(remoteRequestOptions, newPageOptions);
  }
  console.log('    %j', remoteRequestOptions);

  const remoteRequest = http.request(remoteRequestOptions, remoteResponse => {
    markRequestClosed(remoteRequest);

    if (isNewPage(request.url)) {
      modifyResponse(remoteResponse);
    }

    response.writeHead(remoteResponse.statusCode, remoteResponse.headers);
    remoteResponse.on('end', () => {
      console.log('<-- %s %s', response.statusCode, request.url);
    });

    remoteResponse.pipe(response);
  });

  request.on('aborted', remoteRequest.abort.bind(remoteRequest));

  remoteRequest.on('error', error => {
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
  request.on('end', () => {
    remoteRequest.end();
  });
}

module.exports = function startProxy(fromPort, toPort, proxyUrl) {
  const server = http.createServer((request, response) => {
    const parsedUrl = new URL(
      `${/^https?:/.test(request.url) ? '' : 'http://localhost'}${request.url}`
    );
    const m = parsedUrl.pathname.match(/^\/__testium_command__(\/.*)/);
    if (m) {
      if (request.method === 'GET') {
        proxyCommand(
          m[1],
          fromEntries(parsedUrl.searchParams),
          response,
          proxyUrl
        );
      } else {
        request.pipe(
          concat(body => {
            let options;
            if (body) {
              options = JSON.parse(body.toString());
            }
            proxyCommand(parsedUrl.pathname, options, response, proxyUrl);
          })
        );
      }
    } else {
      proxyRequest(request, response, toPort);
    }
  });
  server.listen(fromPort);
  console.log('Listening on port %s and proxying to %s.', fromPort, toPort);
};
