import assert from 'assertive';
import Gofer from 'gofer';
import Bluebird from 'bluebird';

import TestiumCore from '../';

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
    testium = await TestiumCore.getTestium();
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
      const browser = await TestiumCore.getBrowser();
      browser.navigateTo('/index.html');
      assert.equal('Test Title', browser.getPageTitle());
    });
  });
});
