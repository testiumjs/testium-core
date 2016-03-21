import assert from 'assertive';

import Config from '../lib/config';
import spawnServer from '../lib/spawn-server';

describe('spawnServer', () => {
  it('spawns a simple node http server', async () => {
    const { helloWorld } = await spawnServer(new Config({
      root: __dirname + '/tmp/server',
    }), {
      name: 'helloWorld',
      getOptions() {
        return {
          command: process.execPath,
          commandArgs: ['examples/hello-world/server.js', 'Robin'],
          port: 3000,
        };
      },
    });
    const child = helloWorld.rawProcess;
    try {
      assert.hasType(Number, child.pid);
    } finally {
      child.kill();
    }
  });

  it('handles a child that fails to start', async () => {
    try {
      await spawnServer(new Config({
        root: __dirname + '/tmp/server',
      }), {
        name: 'throws',
        getOptions() {
          return {
            command: process.execPath,
            commandArgs: ['examples/throws/server.js', 'Robin'],
            port: 3040,
          };
        },
      });
    } catch (err) {
      assert.include('Broken by design', err.stack);
      return;
    }

    throw new Error('Should have failed b/c the child exits');
  });

  it('fails for a child that takes too long to listen', async () => {
    try {
      await spawnServer(new Config({
        root: __dirname + '/tmp/server',
      }), {
        name: 'hello-world',
        getOptions() {
          return {
            command: process.execPath,
            commandArgs: ['examples/hello-world/server.js', 'Robin'],
            verifyTimeout: 250,
            port: 3001, // wrong port on purpose
          };
        },
      });
    } catch (err) {
      assert.include('Process "hello-world" did not start in time.', err.stack);
      return;
    }

    throw new Error('Should have failed b/c the child listens on the wrong port');
  });
});
