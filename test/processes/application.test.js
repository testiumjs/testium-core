import path from 'path';

import assert from 'assertive';

import Config from '../../lib/config';
import App from '../../lib/processes/application';
import spawnServer from '../../lib/spawn-server';

const HELLO_WORLD = path.resolve(__dirname, '../../examples/hello-world');

describe('App', () => {
  it('can generate spawn options', async () => {
    const config = new Config({ root: HELLO_WORLD });
    const options = await App.getOptions(config);
    assert.hasType('Finds an open port', Number, options.port);
    assert.equal('Parses command from scripts.start', 'node', options.command);
    assert.equal('Parses environment variables in scripts.start', '*', options.spawnOpts.env.DEBUG);
    assert.equal('Does not override NODE_ENV', 'test', options.spawnOpts.env.NODE_ENV);
    assert.deepEqual('Parses commandArgs from scripts.start',
      ['server.js', 'Quinn'], options.commandArgs);
  });

  it('can actually spawn', async () => {
    const config = new Config({ root: HELLO_WORLD });
    const { application } = await spawnServer(config, App);
    application.rawProcess.kill();
  });
});
