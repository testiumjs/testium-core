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

var path = require('path');

var Bluebird = require('bluebird');
var _ = require('lodash');
var subprocess = require('subprocess');
var debug = require('debug')('testium-core:spawn-server');

function setupChild(optionsByName) {
  return new Bluebird(function callSubprocess(resolve, reject) {
    subprocess(optionsByName, function nodeCb(error, results) {
      return error ? reject(error) : resolve(results);
    });
  });
}

function spawnServer(config, servers) {
  var root = config.get('root');
  var logDirectory = config.get('logDirectory', './test/log');

  function resolveLogFile(name) {
    return path.resolve(root, logDirectory, name + '.log');
  }

  function addDefaults(name, options) {
    return _.extend({
      logFilePath: resolveLogFile(name)
    }, options);
  }

  if (!Array.isArray(servers)) {
    servers = [servers];
  }

  var optionsByName = servers.reduce(function prepareServer(out, server) {
    debug('Preparing %s for launch', server.name);
    out[server.name] =
      Bluebird
        .try(server.getOptions, [config])
        .then(_.partial(addDefaults, server.name));
    return out;
  }, {});

  return Bluebird.props(optionsByName).then(setupChild);
}
module.exports = spawnServer;
