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
