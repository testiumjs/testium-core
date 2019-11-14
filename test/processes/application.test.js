'use strict';

const path = require('path');

const assert = require('assertive');

const Config = require('../../lib/config');
const App = require('../../lib/processes/application');
const spawnServer = require('../../lib/spawn-server');

const HELLO_WORLD = path.resolve(__dirname, '../../examples/hello-world');

describe('App', () => {
  it('can generate spawn options', async () => {
    const config = new Config({ root: HELLO_WORLD });
    const options = await App.getOptions(config);
    assert.hasType('Finds an open port', Number, options.port);
    assert.equal('Parses command from scripts.start', 'node', options.command);
    assert.deepEqual(
      'Parses commandArgs from scripts.start',
      ['server.js', 'Quinn'],
      options.commandArgs
    );
  });

  it('can actually spawn', async () => {
    const config = new Config({ root: HELLO_WORLD });
    const { application } = await spawnServer(config, App);
    application.rawProcess.kill();
  });
});
