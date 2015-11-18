'use strict';

var rc = require('rc');
var _ = require('lodash');

var getDefaults = require('./defaults');

function Config(settings) {
  _.assign(this, settings);
}

Config.prototype.get = function get(path, defaultValue) {
  var value = _.get(this, path, defaultValue);
  if (value === undefined) {
    throw new Error('Missing required config setting ' + JSON.stringify(path));
  }
  return value;
};

Config.prototype.getBool = function getBool(path, defaultValue) {
  var value = this.get(path, defaultValue);
  return value !== '0' && value !== 'false' && !!value;
};

Config.prototype.has = function has(path) {
  return _.get(this, path) !== undefined;
};

Config.prototype.set = function set(path, value) {
  _.set(this, path, value);
  return this;
};

Config.prototype.createShallowChild = function createShallowChild(options) {
  return _.extend(Object.create(this), options || {});
};

function loadConfig() {
  var settings = rc('testium', getDefaults());
  if (settings.app === 'null') {
    settings.app = null;
  }
  return new Config(settings);
}

Config.default = Config;
Config.load = loadConfig;
module.exports = Config;
