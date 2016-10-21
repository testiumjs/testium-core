import path from 'path';

import assert from 'assertive';

import Config from '../../lib/config';
import Selenium from '../../lib/processes/selenium';
import spawnServer from '../../lib/spawn-server';

describe('Selenium', () => {
  it('can actually spawn, for firefox', async () => {
    const config = new Config({
      browser: 'firefox',
      root: path.resolve(__dirname, '../tmp/selenium'),
    });

    const { selenium } = await spawnServer(config, Selenium);
    selenium.rawProcess.kill();

    assert.equal('Sets the selenium server url',
      `http://127.0.0.1:${config.get('selenium.port')}/wd/hub`,
      config.get('selenium.serverUrl'));
  });
});
