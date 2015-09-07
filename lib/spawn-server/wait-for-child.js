'use strict';

var isAvailable = require('find-open-port').isAvailable;
var Bluebird = require('bluebird');
var debug = require('debug')('testium-core:spawn-server:wait-for-child');

function CrashError(child) {
  return new Error('Process crashed!');
}

function TimeoutError(child, port, timeout) {
  return new Error('Process timed out!');
}

function waitForChild(child, port, timeout) {
  var procName = child.name;
  var startTime = Date.now();

  function isChildReady() {
    debug('Checking for %s on port %s', procName, port);
    return isAvailable(port)
      .then(function(available) { return !available; });
  }

  return new Bluebird(function(resolve, reject) {
    function onReadyCheck(ready) {
      if (child.exitCode != undefined) {
        throw CrashError(child);
      }

      if (ready) {
        return resolve(child);
      }

      if ((Date.now() - startTime) >= timeout) {
        try {
          child.kill();
        } catch (e) {}
        return reject(TimeoutError(child, port, timeout));
      } else {
        setTimeout(check, 100);
      }
    }

    function check() {
      Bluebird.try(isChildReady)
        .then(onReadyCheck).then(null, reject);
    }

    check();
  });
}
module.exports = waitForChild;
