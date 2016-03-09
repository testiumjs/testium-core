import path from 'path';

import assert from 'assertive';
import { each } from 'lodash';

import Config from '../lib/config';
import launchAllProcesses from '../lib/processes';

const HELLO_WORLD = path.resolve(__dirname, '../examples/hello-world');

describe('Launch all processes', () => {
  const config = new Config({
    root: HELLO_WORLD,
    launch: true,
    browser: 'phantomjs',
  });

  it('launches all the processes', async () => {
    const procs = await launchAllProcesses(config);
    const procNames = Object.keys(procs).sort();
    assert.deepEqual('Spawns app, phantom, and proxy',
      ['application', 'phantomjs', 'proxy'], procNames);
    each(procs, ({ rawProcess }) => rawProcess.kill());
  });
});
