'use strict';

const path = require('path');
const cp = require('child_process');
const { promisify } = require('util');

const assert = require('assertive');

const Config = require('../../lib/config');
const Phantom = require('../../lib/processes/phantom');
const spawnServer = require('../../lib/spawn-server');

const execFile = promisify(cp.execFile);

describe('Phantom', () => {
  it('can generate spawn options', async () => {
    const config = new Config();
    const options = await Phantom.getOptions(config);
    assert.hasType('Finds an open port', Number, options.port);
    assert.equal(
      'Sets the selenium server url',
      `http://127.0.0.1:${options.port}/wd/hub`,
      config.get('selenium.serverUrl')
    );
  });

  it('can actually spawn', async function () {
    // gracefully skip test if phantom isn't installed
    try {
      await execFile('phantomjs', ['--help']);
    } catch (err) {
      if (err.code !== 'ENOENT') throw err;
      this.skip();
      return;
    }

    const config = new Config({
      root: path.resolve(__dirname, '../tmp/phantom'),
    });
    const { phantomjs } = await spawnServer(config, Phantom);
    phantomjs.rawProcess.kill();
  });
});
