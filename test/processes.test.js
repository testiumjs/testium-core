'use strict';

const path = require('path');
const fs = require('fs');
const { promisify } = require('util');
const execFile = promisify(require('child_process').execFile);

const assert = require('assertive');
const { each } = require('lodash');
const { patchFs } = require('fs-monkey');
const { ufs } = require('unionfs');
const { Volume } = require('memfs');
const sinon = require('sinon');

const Config = require('../lib/config');
const launchAllProcesses = require('../lib/processes');

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

  it('launches all the processes', async function () {
    // gracefully skip test if phantom isn't installed
    try {
      await execFile('phantomjs', ['--help']);
    } catch (err) {
      if (err.code !== 'ENOENT') throw err;
      this.skip();
      return;
    }

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
  let display;
  let procs;
  beforeEach(() => {
    config = new Config({
      root: HELLO_WORLD,
      launch: true,
      browser: 'chrome',
    });
    display = process.env.DISPLAY;
    delete process.env.DISPLAY;
    procs = undefined;
  });

  afterEach(() => {
    config = null;
    process.env.DISPLAY = display;
    if (procs) killProcs(procs);
  });

  it('launches all the processes', async () => {
    procs = await launchAllProcesses(config);
    const procNames = Object.keys(procs).sort();
    assert.deepEqual(
      'Spawns app, chrome, and proxy',
      ['application', 'chromedriver', 'proxy'],
      procNames
    );
  });

  it('has the correct chromeOptions when NOT IN docker container', async () => {
    procs = await launchAllProcesses(config);
    const { args } = config.desiredCapabilities.chromeOptions;
    assert.deepEqual(chromeOptions, args);
  });

  it('runs has --no-sandbox when run as root', async () => {
    const getuidStub = sinon.stub(process, 'getuid').returns(0);

    procs = await launchAllProcesses(config);
    const { args } = config.desiredCapabilities.chromeOptions;
    assert.deepEqual([...chromeOptions, '--no-sandbox'], args);
    getuidStub.restore();
  });

  // for some reason this is crashing & hanging local & travis
  xit('has the correct chromeOptions when IN docker container', async () => {
    // simulate docker file system
    const vol = Volume.fromJSON({
      '/.dockerenv': 'docker',
    });
    ufs.use(fs).use(vol); // build fileystem
    const unpatch = patchFs(ufs); // patch native fs calls

    procs = await launchAllProcesses(config);
    const { args } = config.desiredCapabilities.chromeOptions;
    assert.deepEqual([...chromeOptions, '--disable-dev-shm-usage'], args);

    unpatch();
  });

  describe('configure desiredCapabilities.chromeOptions', () => {
    it('replaces the base chromeOptions as default option', async () => {
      const newConfig = new Config({
        ...config,
        desiredCapabilities: { chromeOptions: { args: ['--foobar'] } },
      });

      procs = await launchAllProcesses(newConfig);
      const { args } = newConfig.desiredCapabilities.chromeOptions;
      assert.deepEqual(['--foobar'], args);
    });

    context('when mergeArgs: false', () => {
      it('replaces base chromeOptions with mergeArgs: false', async () => {
        const newConfig = new Config({
          ...config,
          desiredCapabilities: {
            chromeOptions: { mergeArgs: false, args: ['--foobar'] },
          },
        });

        procs = await launchAllProcesses(newConfig);
        const { args } = newConfig.desiredCapabilities.chromeOptions;
        assert.deepEqual(['--foobar'], args);
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

        procs = await launchAllProcesses(newConfig);
        const { args } = newConfig.desiredCapabilities.chromeOptions;
        assert.deepEqual([...chromeOptions, '--foo'], args);
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

        procs = await launchAllProcesses(newConfig);
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

        procs = await launchAllProcesses(newConfig);
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
      });
    });
  });
});
