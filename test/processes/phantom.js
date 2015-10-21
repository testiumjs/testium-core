import path from 'path';

import assert from 'assertive';

import Config from '../../lib/config';
import Phantom from '../../lib/processes/phantom';
import spawnServer from '../../lib/spawn-server';

describe('Phantom', () => {
  it('can generate spawn options', async () => {
    const config = new Config();
    const options = await Phantom.getOptions(config);
    assert.hasType('Finds an open port', Number, options.port);
    assert.equal('Sets the selenium server url',
      'http://127.0.0.1:' + options.port + '/wd/hub',
      config.get('selenium.serverUrl'));
  });

  it('can actually spawn', async () => {
    const config = new Config({
      root: path.resolve(__dirname, '../tmp/phantom'),
    });
    const { phantomjs } = await spawnServer(config, Phantom);
    phantomjs.rawProcess.kill();
  });
});
