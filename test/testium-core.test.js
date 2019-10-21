import assert from 'assertive';
import Gofer from 'gofer';
import Bluebird from 'bluebird';

import { getTestium, getBrowser } from '../';

const gofer = new Gofer({
  globalDefaults: {},
});
function fetch(uri, options) {
  return Bluebird.resolve(gofer.fetch(uri, options));
}
function fetchResponse(uri, options) {
  return Bluebird.resolve(gofer.fetch(uri, options).getResponse());
}

describe('testium-core', () => {
  let testium;
  before(async () => {
    testium = await getTestium();
  });

  after(() => testium && testium.close());

  describe('getNewPageUrl', () => {
    it('ignores absolute urls', () => {
      assert.equal('https://www.example.com/?a=b',
        testium.getNewPageUrl('https://www.example.com', {
          query: { a: 'b' },
        }));
    });

    it('redirects to the target url', async () => {
      const result = await fetch(testium.getNewPageUrl('/error'));
      assert.equal('500 SERVER ERROR', result);
    });

    it('supports additional options', async () => {
      const response = await fetchResponse(
        testium.getNewPageUrl('/echo', { query: { x: 'y' } }), { json: true });

      const echo = response.body;
      assert.truthy('Sends a valid JSON response', echo);
      assert.equal('GET', echo.method);
      assert.equal('/echo?x=y', echo.url);

      assert.truthy('Sets a cookie', response.headers['set-cookie']);
      assert.include('Sets a _testium_ cookie',
        '_testium_=', `${response.headers['set-cookie']}`);
    });
  });

  describe('getInitialUrl', () => {
    it('is a blank page', async () => {
      const result = await fetch(testium.getInitialUrl());
      assert.equal('Initial url returns a blank page', '', result);
    });
  });

  describe('getChromeDevtoolsPort', () => {
    it('returns a number >= 1024 in chrome, throws otherwise', () => {
      if (testium.browser.capabilities.browserName === 'chrome') {
        assert.hasType(Number, testium.getChromeDevtoolsPort());
        assert.expect(testium.getChromeDevtoolsPort() >= 1024);
      } else {
        const err = assert.throws(() => testium.getChromeDevtoolsPort());
        assert.equal('Can only get devtools port for chrome', err.message);
      }
    });
  });


  describe('basic navigation', () => {
    describe('via wd driver', () => {
      it('can navigate to /index.html', async () => {
        const { browser } = await getTestium();
        await browser.navigateTo('/index.html');
        assert.equal('Test Title', await browser.getPageTitle());
      });

      it('preserves #hash segments of the url', async () => {
        const { browser } = await getTestium();
        await browser.navigateTo('/echo#!/foo?yes=it-is', {
          headers: {
            'x-random-data': 'present',
          },
        });
        const hash = await browser.evaluate(() => window.location.href);
        assert.equal('http://127.0.0.1:4445/echo#!/foo?yes=it-is', hash);

        // Making sure that headers are correctly forwarded
        const element = await browser.getElement('pre');
        const echo = JSON.parse(await element.text());
        assert.equal('present', echo.headers['x-random-data']);
      });
    });

    describe('via sync driver', () => {
      it('can navigate to /index.html', async () => {
        const browser = await getBrowser({ driver: 'sync' });
        browser.navigateTo('/index.html');
        assert.equal('Test Title', browser.getPageTitle());
      });

      it('preserves #hash segments of the url', async () => {
        const browser = await getBrowser({ driver: 'sync' });
        browser.navigateTo('/echo#!/foo?yes=it-is', {
          headers: {
            'x-random-data': 'present',
          },
        });
        const hash = browser.evaluate('return "" + window.location.hash;');
        assert.equal('#!/foo?yes=it-is', hash);

        // Making sure that headers are correctly forwarded
        const echo = JSON.parse(browser.getElement('pre').get('text'));
        assert.equal('present', echo.headers['x-random-data']);
      });
    });
  });

  describe('cross-test side effects', () => {
    describe('changes page size', () => {
      before(async () => {
        testium = await getTestium();
      });

      it('leaves a dirty state', () =>
        testium.browser.setPageSize({ width: 600, height: 800 }));

      it('can read its own changes', async () => {
        const pageSize = await testium.browser.getPageSize();
        assert.deepEqual({ width: 600, height: 800 }, pageSize);
      });
    });

    describe('expects original page size', () => {
      before(async () => {
        testium = await getTestium();
      });

      it('sees the default page size', async () => {
        const pageSize = await testium.browser.getPageSize();
        assert.deepEqual({ height: 768, width: 1024 }, pageSize);
      });
    });
  });

  describe('getTestium', () => {
    it('handles alternating drivers', async () => {
      testium = await getTestium({ driver: 'wd' });
      assert.hasType('first wd driver has assertStatusCode()',
        Function, testium.browser.assertStatusCode);

      testium = await getTestium({ driver: 'sync' });
      assert.hasType('second sync driver has assert.* functions',
        Object, testium.browser.assert);

      testium = await getTestium({ driver: 'wd' });
      assert.hasType('second wd driver has assertStatusCode()',
        Function, testium.browser.assertStatusCode);
    });
  });
});
