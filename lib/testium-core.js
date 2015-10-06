'use strict';

var urlLib = require('url');

var _ = require('lodash');
var debug = require('debug')('testium-core');
var qs = require('qs');

var Config = require('./config');
var launchAll = require('./processes');

// Retains the url fragment and query args from url, not overridden via queryArgs
function extendUrlWithQuery(url, queryArgs) {
  if (_.isEmpty(queryArgs)) {
    return url;
  }

  var parts = urlLib.parse(url);
  var query = _.extend(qs.parse(parts.query), queryArgs);
  parts.search = '?' + qs.stringify(query);
  urlLib.format(_.pick(
    parts,
    'protocol',
    'slashes',
    'host',
    'auth',
    'pathname',
    'search',
    'hash'
  ));
}

function getNewPageUrl(commandUrl, url, options) {
  options = options || {};
  var query = options.query;
  if (query) {
    if (typeof query !== 'object') {
      throw new Error('options.query has to be an Object if provided');
    }
    url = extendUrlWithQuery(url, query);
  }
  options = _.defaults({ url: url, redirect: true }, _.omit(options, 'query'));
  return commandUrl + '/new-page?' + qs.stringify(options);
}

function initTestium() {
  var config = Config.load();

  function createFromProcesses(procs) {
    function close() {
      _.each(procs, function(proc, name) {
        try {
          proc.rawProcess.kill();
        } catch (e) {
          debug('Error killing process %s', name, e);
        }
      });
    }

    function getInitialUrl() {
      return config.get('proxy.targetUrl') + '/testium-priming-load';
    }

    return {
      close: close,
      config: config,
      getInitialUrl: getInitialUrl,
      getNewPageUrl: _.partial(getNewPageUrl, config.get('proxy.commandUrl'))
    };
  }

  return launchAll(config).then(createFromProcesses);
}
module.exports = initTestium;
initTestium['default'] = initTestium;
