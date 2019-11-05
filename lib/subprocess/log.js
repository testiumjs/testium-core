'use strict';

const fs = require('fs');
const path = require('path');
const { promisify } = require('util');

const mkdirp = promisify(require('mkdirp'));

const open = promisify(fs.open);

async function log(cwd, logPath) {
  const filename = path.resolve(cwd, logPath);
  const dirname = path.dirname(filename);
  const flags = 'w';
  await mkdirp(dirname);

  const fd = await open(filename, flags);

  return { filename, fd };
}
module.exports = log;
