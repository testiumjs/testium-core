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

const rc = require('rc');
const get = require('lodash/get');
const set = require('lodash/set');

const getDefaults = require('./defaults');

class Config {
  constructor(setting) {
    Object.assign(this, setting);
  }
  get(path, defaultValue) {
    const value = get(this, path, defaultValue);
    if (value === undefined) {
      throw new Error(
        `Missing required config setting ${JSON.stringify(path)}`
      );
    }
    return value;
  }
  getBool(path, defaultValue) {
    const value = this.get(path, defaultValue);
    return value !== '0' && value !== 'false' && !!value;
  }

  has(path) {
    return get(this, path) !== undefined;
  }

  set(path, value) {
    set(this, path, value);
    return this;
  }

  createShallowChild(options) {
    return Object.assign(Object.create(this), options);
  }
}

function loadConfig() {
  const settings = rc('testium', getDefaults());
  if (settings.app === 'null') {
    settings.app = null;
  }
  return new Config(settings);
}

Config.default = Config;
Config.load = loadConfig;
module.exports = Config;
