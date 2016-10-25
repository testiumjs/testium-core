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
'use strict';

var tunnelSSH = require('reverse-tunnel-ssh');
var debug = require('debug')('testium-core:proxy:tunnel');
var Bluebird = require('bluebird');
var findOpenPort = require('find-open-port');
var fs = require('fs');
var os = require('os');
var path = require('path');

function getProxyPort(port) {
  port = parseInt(port, 10);
  if (port === 0) return findOpenPort();
  return Bluebird.resolve(port);
}

function findPrivateKey() {
  debug('No SSH_AUTH_SOCK found; looking for private key files in ~/.ssh');
  var dir = path.join(os.homedir(), '.ssh');
  var candidates = ['id_rsa', 'id_ecdsa', 'id_dsa'];
  for (var i = 0; i < candidates.length; i++) {
    var cand = path.join(dir, candidates[i]);
    try {
      return fs.readFileSync(cand);
    } catch (err) {
      debug("findPrivateKey(): couldn't load " + cand, err);
    }
  }
  throw new Error('proxy.tunnel failed: no SSH_AUTH_SOCK env var set and no keys found in ~/.ssh');
}

function tunnelProxyPort(username, host, sshPort, srcPort, existingRemotePort) {
  function makeSSHTunnel(proxyPort) {
    // if there's already a tunnel set up for us
    if (existingRemotePort) {
      return Bluebird.resolve([proxyPort, existingRemotePort]);
    }

    var privateKey;
    if (!process.env.SSH_AUTH_SOCK) privateKey = findPrivateKey();

    return new Bluebird(function connectSSH(resolve) {
      var conn = tunnelSSH({
        host: host,
        port: sshPort,
        username: username,
        dstHost: '0.0.0.0',
        dstPort: 0, // dynamically allocate remote port
        srcPort: proxyPort,
        privateKey: privateKey
      }, function onTunnelConnect(err) {
        if (err) console.error(err); // eslint-disable-line no-console
      });
      conn.on('forward-in', function onForward(destPort) {
        debug('forwarding %s:%d -> localhost:%d', host, destPort, proxyPort);
        resolve([proxyPort, destPort]);
      });
    });
  }

  return getProxyPort(srcPort).then(makeSSHTunnel);
}

function getTunnelProxyOptions(config) {
  if (config.get('driver', 'sync') !== 'wd') {
    throw new Error('proxy.tunnel only works with driver = wd');
  }

  // TODO: DRY some of this with index.js?
  var appPort = config.get('app.port');
  var proxyModule = require.resolve('./child');
  var tunnelHost = config.get('proxy.tunnel.host');
  var sshPort = config.get('proxy.tunnel.sshPort', 22);
  var proxyHost = config.get('proxy.host', tunnelHost);
  var proxyPort = config.get('proxy.port', 4445);
  var username = config.get('proxy.tunnel.username', process.env.USER);
  var existingRemotePort = config.get('proxy.tunnel.port', null);

  return tunnelProxyPort(username, tunnelHost, sshPort, proxyPort,
                         existingRemotePort)
    .spread(function buildConfig(realProxyPort, remotePort) {
      var targetUrl = 'http://' + proxyHost + ':' + remotePort;
      config.set('proxy.targetUrl', targetUrl);
      debug('proxy.targetUrl = ' + targetUrl);
      return {
        dependsOn: config.getBool('launch', false) ? ['application'] : [],
        command: process.execPath,
        commandArgs: [
          proxyModule,
          '' + appPort,
          '' + realProxyPort,
          targetUrl
        ],
        port: realProxyPort,
        verifyTimeout: config.get('proxy.timeout', 6000)
      };
    });
}

module.exports = getTunnelProxyOptions;
