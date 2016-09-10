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

var findOpenPort = require('find-open-port');
var Bluebird = require('bluebird');
var cp = Bluebird.promisifyAll(require('child_process'));

exports.name = 'proxy';

function getProxyOptions(config) {
  function getProxyHost() {
    var proxyHost = config.get('proxy.host', null);
    var localPrefix = 'http://127.0.0.1:';

    if (proxyHost) return Bluebird.resolve(proxyHost);

    // if they didn't set the proxy.host, default it to localhost unless
    // you're running a remote selenium.serverUrl, then default it to hostname
    var selUrl = config.get('selenium.serverUrl', localPrefix);
    if (/^http:\/\/(localhost|127\.0\.0\.1)\b/i.test(selUrl)) {
      return Bluebird.resolve('127.0.0.1');
    }

    return cp.execFileAsync('hostname', ['-f'], { encoding: 'utf8' })
             .call('trim');
  }

  function getProxyPort() {
    // Defaulting to 4445 for backward compatibility
    var port = config.get('proxy.port', 4445);
    if (port === 0) {
      return findOpenPort();
    }
    return Bluebird.resolve(port);
  }

  function buildOptions(proxyHost, port) {
    var appPort = config.get('app.port');
    var proxyModule = require.resolve('./child');
    var commandPort = 4446;
    var targetUrl = 'http://' + proxyHost + ':' + port;
    config.set('proxy.targetUrl', targetUrl);
    config.set('proxy.commandUrl', 'http://' + proxyHost + ':' + commandPort);

    return {
      dependsOn: config.getBool('launch', false) ? ['application'] : [],
      command: process.execPath,
      commandArgs: [
        proxyModule,
        '' + appPort,
        '' + port,
        '' + commandPort,
        targetUrl,
      ],
      port: port,
      verifyTimeout: config.get('proxy.timeout', 6000),
    };
  }

  return Bluebird.all([getProxyHost(), getProxyPort()]).spread(buildOptions);
}
exports.getOptions = getProxyOptions;
