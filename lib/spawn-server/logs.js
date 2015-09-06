'use strict';

var fs = require('fs');
var path = require('path');

var Bluebird = require('bluebird');
var mkdirp = require('mkdirp-then');
var debug = require('debug')('testium-core:logs');

var openAsync = Bluebird.promisify(fs.open);

function init(config) {
  var root = config.get('root');
  var logDirectory = config.get('logDirectory', './test/log');

  function resolveLogFile(name) {
    return path.resolve(root, logDirectory, name + '.log');
  }

  function openLogFile(name, flags) {
    if (typeof flags === 'function') {
      callback = flags;
      flags = 'w+';
    }

    var filename = resolveLogFile(name);
    var dirname = path.dirname(filename);

    debug('Opening log', filename);
    return mkdirp(dirname)
      .then(function() {
        return openAsync(filename, flags);
      })
      .then(function(fd) {
        return { filename: filename, fd: fd };
      });
  }

  return { resolveLogFile: resolveLogFile, openLogFile: openLogFile };
}
module.exports = init;
