import assert from 'assertive';
import Gofer from 'gofer';
import Bluebird from 'bluebird';

import {parse as parseUrl} from 'url';

import {getTestium, getBrowser} from '../';

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
      const {query} = parseUrl(testium.getNewPageUrl('https://www.example.com', {
        query: { a: 'b' },
      }), true);
      assert.equal('https://www.example.com/?a=b', query.url);
    });

    it('redirects to an absolute target url', async () => {
      const result = await fetch(testium.getNewPageUrl('http://testiumjs.com/index.html'));
      assert.include('<html', result);
    });

    it('sets cookies for absolute target urls', async () => {
      const targetUrl = testium.getNewPageUrl('http://testiumjs.com/index.html');
      const response = await fetchResponse(targetUrl, {
        proxy: testium.config.get('proxy.targetUrl'),
      });

      assert.truthy('Sets a cookie', response.headers['set-cookie']);
      assert.include('Sets a _testium_ cookie',
        '_testium_=', '' + response.headers['set-cookie']);
    });

    it('redirects to the target url', async () => {
      const result = await fetch(testium.getNewPageUrl('/error'));
      assert.equal('500 SERVER ERROR', result);
    });

    it('supports additional options', async () => {
      const response = await fetchResponse(
        testium.getNewPageUrl('/echo', { query: { 'x': 'y' } }), { json: true });

      const echo = response.body;
      assert.truthy('Sends a valid JSON response', echo);
      assert.equal('GET', echo.method);
      assert.equal('/echo?x=y', echo.url);

      assert.truthy('Sets a cookie', response.headers['set-cookie']);
      assert.include('Sets a _testium_ cookie',
        '_testium_=', '' + response.headers['set-cookie']);
    });
  });

  describe('getInitialUrl', () => {
    it('is a blank page', async () => {
      const result = await fetch(testium.getInitialUrl());
      assert.equal('Initial url returns a blank page', '', result);
    });
  });

  describe('basic navigation', () => {
    it('can navigate to /index.html', async () => {
      const browser = await getBrowser();
      browser.navigateTo('/index.html');
      assert.equal('Test Title', browser.getPageTitle());
    });

    it('preserves #hash segments of the url', async () => {
      const browser = await getBrowser();
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
});
