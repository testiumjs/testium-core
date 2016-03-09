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

exports.name = 'proxy';

function getProxyOptions(config) {
  function buildOptionsFromPort(port) {
    var appPort = config.get('app.port');
    var proxyModule = require.resolve('./child');
    var commandPort = 4446;

    config.set('proxy.targetUrl', 'http://127.0.0.1:' + port);
    config.set('proxy.commandUrl', 'http://127.0.0.1:' + commandPort);

    return {
      dependsOn: config.getBool('launch', false) ? ['application'] : [],
      command: process.execPath,
      commandArgs: [
        proxyModule,
        '' + appPort,
        '' + port,
        '' + commandPort,
      ],
      port: port,
      verifyTimeout: config.get('proxy.timeout', 6000),
    };
  }

  // Defaulting to 4445 for backward compatibility
  var port = config.get('proxy.port', 4445);

  if (port === 0) {
    return findOpenPort().then(buildOptionsFromPort);
  }
  return Bluebird.resolve(port).then(buildOptionsFromPort);
}
exports.getOptions = getProxyOptions;
