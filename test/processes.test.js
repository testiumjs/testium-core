import path from 'path';

import assert from 'assertive';
import { each } from 'lodash';

import Config from '../lib/config';
import launchAllProcesses from '../lib/processes';

import { patchFs } from 'fs-monkey';
import { ufs } from 'unionfs';
import { Volume } from 'memfs';
import * as fs from 'fs';

import sinon from 'sinon';

const HELLO_WORLD = path.resolve(__dirname, '../examples/hello-world');

function killProcs(procs) {
  each(procs, ({ rawProcess }) => rawProcess.kill());
}

describe('Launch all processes PhantomJS', () => {
  const config = new Config({
    root: HELLO_WORLD,
    launch: true,
    browser: 'phantomjs',
  });

  it('launches all the processes', async () => {
    const procs = await launchAllProcesses(config);
    const procNames = Object.keys(procs).sort();
    assert.deepEqual(
      'Spawns app, phantom, and proxy',
      ['application', 'phantomjs', 'proxy'],
      procNames
    );
    killProcs(procs);
  });
});

describe('Launch all processes Chrome', () => {
  const chromeOptions = [
    '--disable-application-cache',
    '--media-cache-size=1',
    '--disk-cache-size=1',
    '--disk-cache-dir=/dev/null',
    '--disable-cache',
    '--disable-desktop-notifications',
    '--headless',
  ];

  let config;
  beforeEach(() => {
    config = new Config({
      root: HELLO_WORLD,
      launch: true,
      browser: 'chrome',
    });
  });

  afterEach(() => {
    config = null;
  });

  it('launches all the processes', async () => {
    const procs = await launchAllProcesses(config);
    const procNames = Object.keys(procs).sort();
    assert.deepEqual(
      'Spawns app, chrome, and proxy',
      ['application', 'chromedriver', 'proxy'],
      procNames
    );
    killProcs(procs);
  });

  it('has the correct chromeOptions when NOT IN docker container', async () => {
    const procs = await launchAllProcesses(config);
    const { args } = config.desiredCapabilities.chromeOptions;
    assert.deepEqual(chromeOptions, args);
    killProcs(procs);
  });

  it('runs has --no-sandbox when run as root', async () => {
    const getuidStub = sinon.stub(process, 'getuid').returns(0);

    const procs = await launchAllProcesses(config);
    const { args } = config.desiredCapabilities.chromeOptions;
    assert.deepEqual([...chromeOptions, '--no-sandbox'], args);
    getuidStub.restore();
    killProcs(procs);
  });

  it('has the correct chromeOptions when IN docker container', async () => {
    // simulate docker file system
    const vol = Volume.fromJSON({
      '/.dockerenv': 'docker',
    });
    ufs.use(fs).use(vol); // build fileystem
    const unpatch = patchFs(ufs); // patch native fs calls

    const procs = await launchAllProcesses(config);
    const { args } = config.desiredCapabilities.chromeOptions;
    assert.deepEqual([...chromeOptions, '--disable-dev-shm-usage'], args);
    killProcs(procs);

    unpatch();
  });

  describe('configure desiredCapabilities.chromeOptions', () => {
    it('replaces the base chromeOptions as default option', async () => {
      const newConfig = new Config({
        ...config,
        desiredCapabilities: { chromeOptions: { args: ['--foobar'] } },
      });

      const procs = await launchAllProcesses(newConfig);
      const { args } = newConfig.desiredCapabilities.chromeOptions;
      assert.deepEqual(['--foobar'], args);
      killProcs(procs);
    });

    context('when mergeArgs: false', () => {
      it('replaces base chromeOptions with mergeArgs: false', async () => {
        const newConfig = new Config({
          ...config,
          desiredCapabilities: {
            chromeOptions: { mergeArgs: false, args: ['--foobar'] },
          },
        });

        const procs = await launchAllProcesses(newConfig);
        const { args } = newConfig.desiredCapabilities.chromeOptions;
        assert.deepEqual(['--foobar'], args);
        killProcs(procs);
      });
    });

    context('when mergeArgs: true', () => {
      it('handles args that only have keys', async () => {
        const newConfig = new Config({
          ...config,
          desiredCapabilities: {
            chromeOptions: {
              mergeArgs: true,
              args: ['--disable-application-cache', '--foo'],
            },
          },
        });

        const procs = await launchAllProcesses(newConfig);
        const { args } = newConfig.desiredCapabilities.chromeOptions;
        assert.deepEqual([...chromeOptions, '--foo'], args);
        killProcs(procs);
      });

      it('handles args that have options with key=value', async () => {
        const newConfig = new Config({
          ...config,
          desiredCapabilities: {
            chromeOptions: {
              mergeArgs: true,
              args: ['--foo=false', '--bar=true', '--window-size=1280,1696'],
            },
          },
        });

        const procs = await launchAllProcesses(newConfig);
        const { args } = newConfig.desiredCapabilities.chromeOptions;
        assert.deepEqual(
          [
            ...chromeOptions,
            '--foo=false',
            '--bar=true',
            '--window-size=1280,1696',
          ],
          args
        );
        killProcs(procs);
      });

      it('handles updating base chromeOptions with key=value', async () => {
        const newConfig = new Config({
          ...config,
          desiredCapabilities: {
            chromeOptions: {
              mergeArgs: true,
              args: ['--disk-cache-size=2', '--disk-cache-dir=./tmp'],
            },
          },
        });

        const procs = await launchAllProcesses(newConfig);
        const { args } = newConfig.desiredCapabilities.chromeOptions;
        assert.deepEqual(
          [
            ...chromeOptions.slice(0, 2),
            '--disk-cache-size=2',
            '--disk-cache-dir=./tmp',
            ...chromeOptions.slice(4),
          ],
          args
        );
        killProcs(procs);
      });
    });
  });
});
