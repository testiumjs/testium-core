'use strict';

const path = require('path');
const cp = require('child_process');
const { promisify } = require('util');

const assert = require('assertive');

const Config = require('../../lib/config');
const App = require('../../lib/processes/application');
const Proxy = require('../../lib/processes/proxy');
const spawnServer = require('../../lib/spawn-server');

const execFileAsync = promisify(cp.execFile);

const HELLO_WORLD = path.resolve(__dirname, '../../examples/hello-world');

describe('Proxy', () => {
  it('can generate spawn options', async () => {
    const config = new Config({ app: { port: 3041 } });
    const options = await Proxy.getOptions(config);
    assert.equal('Uses default port', 4445, options.port);
    assert.equal(
      'Passes in the app port as the 2nd param to the child',
      '3041',
      options.commandArgs[1]
    );
    assert.equal(
      `http://127.0.0.1:${options.port}`,
      config.get('proxy.targetUrl')
    );
  });

  it('can generate remote-selenium spawn options', async () => {
    const config = new Config({
      app: { port: '3041' },
      selenium: { serverUrl: 'http://example.com' },
      proxy: { port: '0' },
    });
    const [options, hostname] = await Promise.all([
      Proxy.getOptions(config),
      execFileAsync('hostname', ['-f'], { encoding: 'utf8' }).then(res =>
        res.stdout.trim()
      ),
    ]);
    assert.hasType('Finds an open port', Number, options.port);
    assert.expect('Port is no longer 0', options.port > 0);
    assert.notEqual('Port is not default', 4445, options.port);
    assert.equal(
      `http://${hostname}:${options.port}`,
      config.get('proxy.targetUrl')
    );
  });

  it('can actually spawn', async () => {
    const config = new Config({
      root: HELLO_WORLD,
      app: { port: '3041' },
      proxy: { port: '0' },
    });
    const { proxy, application } = await spawnServer(config, [Proxy, App]);
    proxy.rawProcess.kill();
    application.rawProcess.kill();
  });
});
