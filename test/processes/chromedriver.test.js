'use strict';

const path = require('path');
const fs = require('fs');

const assert = require('assertive');
const mkdirp = require('mkdirp-then');

const Config = require('../../lib/config');
const ChromeDriver = require('../../lib/processes/chromedriver');
const spawnServer = require('../../lib/spawn-server');

const browser = 'chrome';
const root = path.resolve(__dirname, '../tmp/chromedriver');

const tmpCDPath = `${root}/chromedriver/lib/chromedriver/chromedriver`;

async function startChromeDriver(cfg) {
  const config = new Config({ browser, root, ...cfg });
  const { chromedriver } = await spawnServer(config, ChromeDriver);
  chromedriver.rawProcess.kill();

  assert.match(
    'Sets the selenium server url',
    /^http:\/\/127.0.0.1:\d+$/,
    config.get('selenium.serverUrl')
  );
}

describe('ChromeDriver', () => {
  before(() => {
    try {
      fs.unlinkSync(`${__dirname}/../../node_modules/.bin/chromedriver`);
    } catch (err) {
      /* ignored */
    }
    return mkdirp(root);
  });

  afterEach(() => {
    process.env.PATH = process.env.PATH.replace(
      /[^:]+\/lib\/chromedriver:/,
      ''
    );
  });

  describe('without chromedriver module', () => {
    before(() => {
      fs.renameSync(
        `${__dirname}/../../node_modules/chromedriver`,
        `${root}/chromedriver`
      );
    });

    after(() => {
      fs.renameSync(
        `${root}/chromedriver`,
        `${__dirname}/../../node_modules/chromedriver`
      );
    });

    it.skip('errors out prettily if none found', async () => {
      const err = await assert.rejects(startChromeDriver());
      assert.include('You can provide your own', err.stack);
    });

    it('uses the chrome.chromedriver setting', () =>
      startChromeDriver({ chrome: { chromedriver: tmpCDPath } }));

    it('finds chromedriver in $PATH', async () => {
      process.env.PATH += `:${path.dirname(tmpCDPath)}`;
      await startChromeDriver();
    });
  });

  // this must be last, and in a describe, otherwise it pollutes the require
  // cache in a way I can't figure out how to clear properly
  describe('with chromedriver module', () => {
    it('finds chromedriver from module', () => startChromeDriver());
  });
});
