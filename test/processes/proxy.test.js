import path from 'path';
import cp from 'child_process';

import assert from 'assertive';

import Config from '../../lib/config';
import App from '../../lib/processes/application';
import Proxy from '../../lib/processes/proxy';
import spawnServer from '../../lib/spawn-server';

import Bluebird from 'bluebird';

Bluebird.promisifyAll(cp);

const HELLO_WORLD = path.resolve(__dirname, '../../examples/hello-world');

describe('Proxy', () => {
  it('can generate spawn options', async () => {
    const config = new Config({ app: { port: 3041 } });
    const options = await Proxy.getOptions(config);
    assert.hasType('Finds an open port', Number, options.port);
    assert.equal('Passes in the app port as the 2nd param to the child',
      '3041', options.commandArgs[1]);
    assert.equal('http://127.0.0.1:' + options.port, config.get('proxy.targetUrl'));
  });

  it('can generate remote-selenium spawn options', async () => {
    const config = new Config(
      { app: { port: 3041 }, selenium: { serverUrl: 'http://example.com' } }
    );
    const [options, hostname] = await Bluebird.all([
      Proxy.getOptions(config),
      cp.execFileAsync('hostname', ['-f'], { encoding: 'utf8' }).call('trim'),
    ]);
    assert.equal(`http://${hostname}:${options.port}`,
                 config.get('proxy.targetUrl'));
  });

  it('can actually spawn', async () => {
    const config = new Config({
      root: HELLO_WORLD,
      app: { port: 3041 },
    });
    const { proxy, application } = await spawnServer(config, [Proxy, App]);
    proxy.rawProcess.kill();
    application.rawProcess.kill();
  });
});
