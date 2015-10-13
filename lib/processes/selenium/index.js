'use strict';

var path = require('path');
var fs = require('fs');

var findOpenPort = require('find-open-port');
var Bluebird = require('bluebird');
var SeleniumDownload = require('selenium-download');
var _ = require('lodash');

var SELENIUM_TIMEOUT = 90000;

var BIN_PATH = path.join(__dirname, '..', '..', '..', 'bin');
var DEFAULT_JAR_PATH = path.join(BIN_PATH, 'selenium.jar');
var DEFAULT_CHROME_PATH = path.join(BIN_PATH, 'chromedriver');

var statAsync = Bluebird.promisify(fs.stat);
var downloadSelenium =
  _.partial(Bluebird.promisify(SeleniumDownload.ensure), BIN_PATH);

exports.name = 'selenium';

function createSeleniumArguments(chromeDriverPath) {
  var chromeArgs = [
    '--disable-application-cache',
    '--media-cache-size=1',
    '--disk-cache-size=1',
    '--disk-cache-dir=/dev/null',
    '--disable-cache',
    '--disable-desktop-notifications',
  ].join(' ');
  var firefoxProfilePath = path.join(__dirname, './firefox-profile.js');
  return [
    '-Dwebdriver.chrome.driver=' + chromeDriverPath,
    '-Dwebdriver.chrome.args="' + chromeArgs + '"',
    '-firefoxProfileTemplate', firefoxProfilePath,
    '-ensureCleanSession',
  ];
}

function ensureFile(filename) {
  return statAsync(filename)
    .catch(function withPrettyError(error) {
      var oldStack = error.stack;
      error.message = [
        'Could not find required files for running selenium.',
        '       - message: ' + error.message,
        '',
        'You can provide your own version of selenium via ~/.testiumrc:',
        '',
        '```',
        '[selenium]',
        'jar = /path/to/selenium.jar',
        '; For running tests in chrome:',
        'chromedriver = /path/to/chromedriver',
        '```',
        '',
        'testium can also download these files for you,',
        'just execute the following before running your test suite:',
        '',
        '$ ./node_modules/.bin/testium --download-selenium',
        '',
        'testium will download selenium and chromedriver into this directory:',
        '  ' + BIN_PATH,
      ].join('\n');
      error.stack = error.message + '\n' + oldStack;
      throw error;
    });
}

function ensureBinaries(browserName, jarPath, chromeDriverPath) {
  var files = [ ensureFile(jarPath) ];
  if (browserName === 'chrome') {
    files.push(ensureFile(chromeDriverPath));
  }
  return Bluebird.all(files).catch(function gracefulDownload(error) {
    var usingDefaultFiles =
      jarPath === DEFAULT_JAR_PATH && chromeDriverPath === DEFAULT_CHROME_PATH;
    if (usingDefaultFiles && error.code === 'ENOENT') {
      return downloadSelenium();
    }
    throw error;
  });
}

function getPort(config, key) {
  var port = config.get(key, 0);
  return port === 0 ? findOpenPort() : Bluebird.resolve(port);
}

function getSeleniumOptions(config) {
  var jarPath = config.get('selenium.jar', DEFAULT_JAR_PATH);
  var chromeDriverPath = config.get('selenium.chromedriver', DEFAULT_CHROME_PATH);
  var browserName = config.get('browser');

  function buildOptions(data) {
    var port = data.port;
    config.set('selenium.port', port);
    config.set('selenium.serverUrl', 'http://127.0.0.1:' + port + '/wd/hub');

    var args = [
      '-Xmx256m',
      '-jar', jarPath,
      '-port', '' + port,
    ].concat(createSeleniumArguments(chromeDriverPath));
    if (config.get('selenium.debug', false)) {
      args.push('-debug');
    }
    return {
      command: 'java',
      commandArgs: args,
      port: port,
      verifyTimeout: config.get('phantomjs.timeout', SELENIUM_TIMEOUT),
    };
  }

  return Bluebird.props({
    binaries: ensureBinaries(browserName, jarPath, chromeDriverPath),
    port: getPort(config, 'selenium.port'),
  }).then(buildOptions);
}
exports.getOptions = getSeleniumOptions;
