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

const { readFileSync } = require('fs');

function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

function getLogWithQuote(proc) {
  let logQuote;
  try {
    logQuote = createTailQuote(readFileSync(proc.logPath, 'utf8'), 20);
  } catch (err) {
    logQuote = `(failed to load log: ${err.message})`;
  }

  return `\
Log output (last 20 lines):

${logQuote}

See the full log at: ${proc.logPath}\
`;
}

function procCrashedError(proc) {
  let message = `\
Process \"${proc.name}\" crashed with code ${proc.exitCode}.
${getLogWithQuote(proc)}\
`;

  if (proc.error && proc.error.length > 0) message += `\n${proc.error.trim()}`;

  return new Error(message);
}

function niceTime(ms) {
  if (ms > 1000 * 60) {
    return `${ms / 1000 / 60}min`;
  } else if (ms > 1000) {
    return `${ms / 1000}s`;
  } else {
    return `${ms}ms`;
  }
}

function createTailQuote(str, count) {
  const lines = str.split('\n').slice(-count);
  return `> ${lines.join('\n> ')}`;
}

function procTimedoutError(proc, port, timeout) {
  function formatArguments(args = []) {
    if (!args.length) return '(no arguments)';
    return args.join('\n           ');
  }

  let message = `\
Process \"${proc.name}\" did not start in time.

Debug info:
* command: ${proc.launchCommand}
           ${formatArguments(proc.launchArguments)}
* cwd:     ${proc.workingDirectory}
* port:    ${port}
* timeout: ${niceTime(timeout)}
\`\`\`

${getLogWithQuote(proc)}\
`;

  if (proc.error && proc.error.length > 0) message += `\n${proc.error.trim()}`;

  return new Error(message);
}

function tryToKill(proc) {
  try {
    proc.rawProcess.kill();
  } catch (err) {
    /* noop */
  }
}

async function verify(proc, validate, interval, timeout, port) {
  if (proc.rawProcess.exitCode != null) {
    throw procCrashedError(proc);
  }

  const startTime = Date.now();

  while (Date.now() - startTime < timeout) {
    try {
      if (await validate(port)) {
        return;
      }
    } catch (err) {
      tryToKill(proc);
      throw err;
    }
    if (proc.rawProcess.exitCode != null) {
      throw procCrashedError(proc);
    }
    await delay(100);
  }

  tryToKill(proc);
  throw procTimedoutError(proc, port, timeout);
}

module.exports = verify;
