'use strict';

var fs = require('fs');
var path = require('path');

var test = require('tap').test;

var Config = require('../lib/config');
var initLogs = require('../lib/logs');

test('open a log file', function(t) {
  var logs = initLogs(new Config({
    root: __dirname,
    logDirectory: 'tmp/nested/log/dir'
  }));
  logs.openLogFile('foo', 'w+')
    .then(function(log) {
      t.equal(log.filename,
        path.join(__dirname, 'tmp/nested/log/dir/foo.log'),
        'generates log filename based on "foo"');

      fs.writeSync(log.fd, 'my content');
      fs.closeSync(log.fd);
      t.equal(fs.readFileSync(log.filename, 'utf8'), 'my content',
        'writes the content to the log file');

      t.end();
    })
    .then(null, function(error) {
      t.error(error);
      t.end();
    })
});
