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

const path = require('path');
const fs = require('fs');
const { promisify } = require('util');

const findOpenPort = require('find-open-port');
const SeleniumDownload = require('selenium-download');

const SELENIUM_TIMEOUT = 90000;

const BIN_PATH = path.join(__dirname, '..', '..', '..', 'bin');
const DEFAULT_JAR_PATH = path.join(BIN_PATH, 'selenium.jar');

const statAsync = promisify(fs.stat);
const downloadSelenium = promisify(SeleniumDownload.ensure).bind(
  null,
  BIN_PATH
);

function ensureFile(filename) {
  return statAsync(filename).catch(error => {
    const oldStack = error.stack;
    error.message = [
      'Could not find required files for running selenium.',
      `       - message: ${error.message}`,
      '',
      'You can provide your own version of selenium via ~/.testiumrc:',
      '',
      '```',
      '[selenium]',
      'jar = /path/to/selenium.jar',
      '```',
      '',
      'testium can also download these files for you,',
      'just execute the following before running your test suite:',
      '',
      '$ ./node_modules/.bin/testium --download-selenium',
      '',
      'testium will download selenium into this directory:',
      `  ${BIN_PATH}`,
    ].join('\n');
    error.stack = `${error.message}\n${oldStack}`;
    throw error;
  });
}

function ensureBinaries(browserName, jarPath) {
  const files = [ensureFile(jarPath)];
  return Promise.all(files).catch(error => {
    const usingDefaultFiles = jarPath === DEFAULT_JAR_PATH;
    if (usingDefaultFiles && error.code === 'ENOENT') {
      return downloadSelenium();
    }
    throw error;
  });
}

function getPort(config, key) {
  const port = config.get(key, 0);
  return port === 0 ? findOpenPort() : Promise.resolve(port);
}

function getSeleniumOptions(config) {
  const jarPath = config.get('selenium.jar', DEFAULT_JAR_PATH);
  const browserName = config.get('browser');

  return Promise.all([
    ensureBinaries(browserName, jarPath),
    getPort(config, 'selenium.port'),
  ]).then(([, port]) => {
    config.set('selenium.port', port);
    config.set('selenium.serverUrl', `http://127.0.0.1:${port}/wd/hub`);

    const args = ['-Xmx256m', '-jar', jarPath, '-port', `${port}`];
    if (config.getBool('selenium.debug', false)) args.push('-debug');

    return {
      command: 'java',
      commandArgs: args,
      port,
      verifyTimeout: config.get('selenium.timeout', SELENIUM_TIMEOUT),
    };
  });
}

module.exports = {
  name: 'selenium',
  getOptions: getSeleniumOptions,
};
