'use strict';

const assert = require('assert');
const { createServer } = require('net');

const findOpenPort = require('find-open-port');

const { checkExtraProcs } = require('../../lib/processes/extra');

describe('extra processes in config', () => {
  /** @type {import('net').Server | undefined} */
  let server;
  afterEach(async () => {
    if (server) {
      await new Promise(r => server.close(r));
      server = undefined;
    }
  });

  it('returns server objects for extra procs', async () => {
    // don't parallelize to avoid collisions
    const freePort1 = await findOpenPort.findPort();
    const freePort2 = await findOpenPort.findPort();

    server = createServer();
    await new Promise(r => server.listen({ port: 0, host: '127.0.0.1' }, r));
    const usedPort = server.address().port;

    const processes = {
      reuse1: {
        command: 'nc',
        commandArgs: ['-l', '%port%'],
        reuseExisting: true,
        port: freePort1,
      },
      reuse2: {
        command: 'nc',
        commandArgs: ['-l', '%port%'],
        reuseExisting: true,
        port: usedPort,
      },
      start1: {
        command: 'nc',
        commandArgs: ['-l', '%port%'],
        port: freePort2,
      },
      start2: {
        command: 'nc',
        commandArgs: ['-l', '%port%'],
      },
    };

    const servers = await checkExtraProcs(processes);

    assert.ok(
      servers.every(s => s.name !== 'reuse2'),
      'reuseExisting with port in use should not be in servers list'
    );

    assert.strictEqual(servers.length, 3);
    assert.deepStrictEqual(
      servers.find(s => s.name === 'reuse1').getOptions(),
      {
        command: 'nc',
        commandArgs: ['-l', '%port%'],
        port: freePort1,
      }
    );
  });

  it('errors if configs are incorrect', async () => {
    await assert.rejects(
      checkExtraProcs({
        kaboom: { reuseExisting: true },
      }),
      { message: /reuseExisting.+static port/ }
    );
  });
});
