'use strict';

const { spawn } = require('child_process');

const fs = require('fs');
const { promisify } = require('util');

const readFile = promisify(fs.readFile);

function killAllProcs(procs) {
  procs.forEach(proc => {
    try {
      proc.rawProcess.kill();
    } catch (err) {
      // eslint-disable-next-line no-console
      console.error(err);
    }
  });
}

const allProcs = [];
function registerUncaughtHandler(proc) {
  allProcs.push(proc);
  if (allProcs.length > 1) return;
  process.on('uncaughtException', error => {
    killAllProcs(allProcs);
    throw error;
  });
  process.on('exit', () => {
    killAllProcs(allProcs);
  });
}

function procNotFoundError(error, cmd) {
  error.message = `Unable to find ${cmd}`;
  return error;
}

function interpolatePort(port) {
  return arg => arg.replace('%port%', port);
}

function doSpawn(
  name,
  command,
  commandArgs,
  port,
  logPath,
  logHandle,
  spawnOpts
) {
  commandArgs = commandArgs.map(interpolatePort(port));
  const child = {
    rawProcess: spawn(command, commandArgs, spawnOpts),
    name,
    baseUrl: `http://127.0.0.1:${port}`,
    port,
    logPath,
    logHandle,
    launchCommand: command,
    launchArguments: commandArgs,
    workingDirectory: spawnOpts.cwd,
  };
  registerUncaughtHandler(child);

  child.readLog = () => readFile(logPath, 'utf8');

  child.rawProcess.on('error', err => {
    if (err.errno === 'ENOENT') {
      child.error = procNotFoundError(err, command).stack;
    }
    child.rawProcess.kill();
  });

  return child;
}

module.exports = doSpawn;
