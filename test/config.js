import path from 'path';

import assert from 'assertive';

import Config from '../lib/config';

function enterDirectory(relative) {
  const old = process.cwd();

  before(() =>
    process.chdir(path.resolve(__dirname, relative)));

  after(() => process.chdir(old));
}

describe('Config', () => {
  describe('Config::set', () => {
    let config;
    beforeEach(() => config = new Config({ original: 42 }));

    it('changes existing values', () => {
      config.set('original', 13);
      assert.equal(13, config.original);
    });

    it('can introduce new nested keys', () => {
      config.set('a.b.c', 'foo');
      assert.equal('foo', config.a.b.c);
    });
  });

  describe('Config::createShallowChild', () => {
    let parent;
    let child;

    beforeEach(() => {
      parent = new Config({ original: 42 });
      child = parent.createShallowChild({ foo: 'bar' });
    });

    it('keeps settings isolated to child', () => {
      assert.equal('adds settings to child', 'bar', child.foo);
      assert.equal('settings don\'t appear in parent', undefined, parent.foo);
      child.set('original', 13);
      assert.equal('changes value in child', child.original, 13);
      assert.equal('keeps existing value in parent', parent.original, 42);
    });

    it('makes changes to parent visible in child', () => {
      assert.equal('is undefined initially', undefined, child.zapp);
      parent.set('zapp', true);
      assert.equal('becomes true after parent changed', true, child.zapp);
    });
  });

  describe('Config.load', () => {
    describe('just with defaults', () => {
      // throws has an empty .testiumrc file
      enterDirectory('../examples/throws');

      it('defaults `launch` to false', () => {
        assert.equal('launch is set to the default of false',
          false, Config.load().launch);
      });
    });

    describe('with an rc file', () => {
      enterDirectory('../examples/rcfile');

      let config;
      beforeEach(() => config = Config.load());

      it('reads `launch` from the rc file', () => {
        assert.equal('launch is correctly read from the rc file',
          true, config.launch);
        assert.equal('can retrieve the setting using get(propertyPath)',
          true, config.get('launch'));
      });

      it('handles non-existing settings', () => {
        assert.equal('Allows specifying a default value',
          'or this', config.get('not.a.thing', 'or this'));

        const err = assert.throws('Throws when trying to retrieve a non-existing setting',
          () => config.get('not.a.thing'));
        assert.equal('Missing required config setting "not.a.thing"', err.message);

        assert.equal('Allows specifying `null` as a default for optional settings',
          null, config.get('not.a.thing', null));
      });
    });
  });
});
