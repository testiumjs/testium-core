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

const { promisify } = require('util');

const findOpenPort = require('find-open-port');
const _ = require('lodash');
const debug = require('debug')('testium-core:processes:application');
const readPackageJson = promisify(require('read-package-json'));

exports.name = 'application';

const NO_LAUNCH_COMMAND_ERROR =
  'No launch command found: please add scripts.start to package.json';

function getLaunchCommand(config) {
  if (config.has('app.command')) {
    return config.get('app.command');
  }

  debug('Trying to use package.json:scripts.start');
  const pkgJsonPath = `${config.get('root')}/package.json`;
  return readPackageJson(pkgJsonPath).then(pkgJson => {
    const start = pkgJson.scripts && pkgJson.scripts.start;
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

    const commandArgs = options.command.split(/\s+/g);

    const customEnv = {};
    let m;
    while ((m = (commandArgs[0] || '').match(/^([^=]+)=(.*)/))) {
      commandArgs.shift();
      customEnv[m[1]] = m[2];
    }

    return _.extend(options, {
      command: commandArgs.shift(),
      commandArgs,
      verifyTimeout: config.get('app.timeout', 30000),
      spawnOpts: {
        env: {
          NODE_ENV: config.get('launchEnv', 'test'),
          PORT: options.port,
          PATH: `./node_modules/.bin:${process.env.PATH}`,
          ...process.env,
          ...customEnv,
        },
        cwd: config.get('root'),
      },
    });
  }

  const cfgPort = config.get('app.port', 0);
  return Promise.all([
    cfgPort === 0 ? findOpenPort() : cfgPort,
    getLaunchCommand(config),
  ]).then(([port, command]) => buildOptions({ port, command }));
}
exports.getOptions = getAppOptions;
