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

const async = require('async');
const { merge, clone } = require('lodash');
const portscanner = require('portscanner');

const openLogFile = require('./log');
const { findOpen } = require('./port');
const spawn = require('./spawn');
const verify = require('./verify');

function convert(proc) {
  proc = merge({}, defaults(proc.name), proc);

  if (proc.spawnOpts.cwd == null) proc.spawnOpts.cwd = process.cwd();

  return async () => {
    const results = await openLogFile(proc.spawnOpts.cwd, proc.logFilePath);

    const { fd: logHandle, filename: logPath } = results;
    const spawnOpts = {
      stdio: ['ignore', logHandle, logHandle],
      env: clone(process.env),
    };
    merge(spawnOpts, proc.spawnOpts);

    const availablePort = await findOpen(proc.port);

    const child = spawn(
      proc.name,
      proc.command,
      proc.commandArgs,
      availablePort,
      logPath,
      logHandle,
      spawnOpts
    );

    await verify(
      child,
      proc.verify,
      proc.verifyInterval,
      proc.verifyTimeout,
      availablePort
    );

    return child;
  };
}

function autoable(name, proc) {
  proc.name = name;
  const func = convert(proc);
  if (!proc.dependsOn || proc.dependsOn.length === 0) return func;
  return [...proc.dependsOn, func];
}

function defaults(procName) {
  return {
    // get random available port
    port: 0,
    logFilePath: `./log/${procName}.log`,
    spawnOpts: {},
    verifyInterval: 100,
    verifyTimeout: 3000,
    async verify(port) {
      const status = await portscanner.checkPortStatus(port, '127.0.0.1');
      return status !== 'closed';
    },
  };
}

function subprocess(processConfig) {
  const config = {};
  for (const [key, val] of Object.entries(processConfig)) {
    config[key] = autoable(key, val);
  }
  return async.auto(config);
}

function killAll(procs) {
  for (const proc of Object.values(procs)) proc.rawProcess.kill();
}
subprocess.killAll = killAll;

module.exports = subprocess;
