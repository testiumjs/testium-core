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
var _ = require('lodash');
var debug = require('debug')('testium-core:processes:application');
var readPackageJson = require('read-package-json');

exports.name = 'application';

var NO_LAUNCH_COMMAND_ERROR =
  'No launch command found: please add scripts.start to package.json';

function getLaunchCommand(config) {
  if (config.has('app.command')) {
    return config.get('app.command');
  }

  debug('Trying to use package.json:scripts.start');
  var pkgJsonPath = config.get('root') + '/package.json';
  return Bluebird.fromNode(_.partial(readPackageJson, pkgJsonPath))
    .then(function extractStartScript(pkgJson) {
      var start = pkgJson.scripts && pkgJson.scripts.start;
      debug('Loaded from package json', start);
      if (!start) {
        throw new Error(NO_LAUNCH_COMMAND_ERROR);
      }
      return start;
    });
}

function getAppOptions(config) {
  function buildOptions(options) {
    config.set('app.port', options.port);

    var commandArgs = options.command.split(/[\s]+/g);

    return _.extend(options, {
      command: commandArgs.shift(),
      commandArgs: commandArgs,
      verifyTimeout: config.get('app.timeout', 30000),
      spawnOpts: {
        env: _.defaults({
          NODE_ENV: config.get('launchEnv', 'test'),
          PORT: options.port,
          PATH: './node_modules/.bin:' + process.env.PATH
        }, process.env),
        cwd: config.get('root')
      }
    });
  }

  var port = config.get('app.port', 0);
  return Bluebird.props({
    port: port === 0 ? findOpenPort() : port,
    command: getLaunchCommand(config)
  }).then(buildOptions);
}
exports.getOptions = getAppOptions;
