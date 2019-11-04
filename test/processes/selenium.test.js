'use strict';

const path = require('path');

const assert = require('assertive');

const Config = require('../../lib/config');
const Selenium = require('../../lib/processes/selenium');
const spawnServer = require('../../lib/spawn-server');

describe('Selenium', () => {
  it('can actually spawn, for firefox', async () => {
    const config = new Config({
      browser: 'firefox',
      root: path.resolve(__dirname, '../tmp/selenium'),
    });

    const { selenium } = await spawnServer(config, Selenium);
    selenium.rawProcess.kill();

    assert.equal(
      'Sets the selenium server url',
      `http://127.0.0.1:${config.get('selenium.port')}/wd/hub`,
      config.get('selenium.serverUrl')
    );
  });
});
