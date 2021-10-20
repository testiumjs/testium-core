/*
 * Copyright (c) 2021, Groupon, Inc.
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

/*
  Given configuration like:
  {
    // ...
    processes: {
      memcached: {
        port: 11211,
        command: 'memcached',
        commandArgs: ['-u', 'memcached', '-d'],
        reuseExisting: true,
      },
      // ...
    }
  }

  This will turn them into server configuration bits and start things up
  for you; skipping them if something's already listening on that port
*/

const { isAvailable } = require('find-open-port');
const debug = require('debug')('testium-core:processes:extra');

/**
 * @typedef Server
 * @property {string} name
 * @property {() => SubprocessOpts | Promise<SubprocessOpts>} getOptions
 *
 * @typedef SubprocessOpts
 * @property {number} port
 * ...and a bunch more options; see subprocess/README.md
 *
 * @typedef {SubprocessOpts & { reuseExisting?: boolean }} ExtraProcOpts
 */

/** @param {Record<string, ExtraProcOpts>} extraProcs */
async function checkExtraProcs(extraProcs) {
  /** @type {Server[]} */
  const servers = [];

  /** @type {[ string, SubprocessOpts & { port: number } ]} */
  const toCheck = [];

  for (const [name, opts] of Object.entries(extraProcs)) {
    const { reuseExisting = false, ...subPOpts } = opts;

    if (!reuseExisting) {
      servers.push({ name, getOptions: () => subPOpts });
      continue;
    }

    if (!subPOpts.port) {
      throw new Error(
        `process.* with reuseExisting=true must include static port`
      );
    }

    toCheck.push([name, subPOpts]);
  }

  if (toCheck.length > 0) {
    await Promise.all(
      toCheck.map(async ([name, opts]) => {
        const { port } = opts;
        if (await isAvailable(port)) {
          servers.push({ name, getOptions: () => opts });
        } else {
          debug(
            `Not starting reuseExisting process ${name}: port ${port} is in use`
          );
        }
      })
    );
  }

  return servers;
}
exports.checkExtraProcs = checkExtraProcs;
