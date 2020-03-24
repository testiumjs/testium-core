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

const util = require('util');
const cp = require('child_process');
const debug = require('debug')('testium-core:chromedriver');

const findOpenPort = require('find-open-port');

function throwPrettyError(error) {
  const oldStack = error.stack;
  error.message = [
    'Could not find required files for running chromedriver.',
    `       - message: ${error.message}`,
    '',
    'You can provide your own version of chromedriver via ~/.testiumrc:',
    '',
    '```',
    '[chrome]',
    'chromedriver = /path/to/chromedriver',
    '```',
    '',
    'or you can install the "chromedriver" npm module and its',
    'downloaded copy will be used automatically',
  ].join('\n');
  error.stack = `${error.message}\n${oldStack}`;
  throw error;
}

function oldPath(config) {
  const cdPath = config.get('selenium.chromedriver', null);
  if (cdPath) {
    util.deprecate(() => {},
    'selenium.chromedriver is deprecated, use chrome.chromedriver')();
  }
  debug('oldPath: ', cdPath);
  return cdPath;
}

function pathFromModule() {
  let cdPath;
  try {
    // eslint-disable-next-line import/no-unresolved, import/no-extraneous-dependencies
    cdPath = require('chromedriver').path;
  } catch (err) {
    if (err.code !== 'MODULE_NOT_FOUND') throw err;
  }
  debug('pathFromModule: ', cdPath);
  return cdPath;
}

function confirmInPATH() {
  const cdPath = 'chromedriver';
  try {
    cp.execFileSync(cdPath, ['--version']);
  } catch (err) {
    throwPrettyError(err);
  }
  debug('confirmInPATH', cdPath);
  return cdPath;
}

function getChromedriverOptions(config) {
  const chromeDriverPath =
    config.get('chrome.chromedriver', null) ||
    oldPath(config) ||
    pathFromModule() ||
    confirmInPATH();

  const logLevel = config.get('chrome.logLevel', 'ALL');

  return findOpenPort().then(port => {
    config.set('selenium.serverUrl', `http://127.0.0.1:${port}`);
    return {
      command: chromeDriverPath,
      commandArgs: ['--port=%port%', `--log-level=${logLevel}`],
      port,
    };
  });
}

module.exports = {
  name: 'chromedriver',
  getOptions: getChromedriverOptions,
};
