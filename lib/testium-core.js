'use strict';

var _ = require('lodash');
var debug = require('debug')('testium-core');

var Config = require('./config');
var launchAll = require('./processes');

function initTestium() {
  var config = Config.load();

  function createFromProcesses(procs) {
    function close() {
      _.each(procs, function(proc, name) {
        try {
          proc.kill();
        } catch (e) {
          debug('Error killing process %s', name, e);
        }
      });
    }

    return {
      close: close,
      config: config
    };
  }

  return launchAll(config).then(createFromProcesses);
}
module.exports = initTestium;
initTestium['default'] = initTestium;
