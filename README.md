# Testium: Core [![Build Status](https://travis-ci.org/testiumjs/testium-core.svg?branch=main)](https://travis-ci.org/testiumjs/testium-core)

Juggling the bits and pieces to run integration tests.

This project is a safe and inclusive place
for contributors of all kinds.
See the [Code of Conduct](CODE_OF_CONDUCT.md)
for details.

## Install

```
npm install --save testium-core
```

## Usage

### Starting Up

The following boots up phantomjs/selenium, an application
and a slim proxy to handle response code normalization etc.:

```js
var initTestium = require('testium-core');
initTestium()
  .then(function(testium) {
    // Use testium.config to set up your integration tests.
    // At the end of it all call `testium.close` to quit all child processes.
    testium.close();
  });
```


#### `testium.config`

This contains all the configuration needed and exposed by testium.
The initial data is loaded from config files using [`rc`](https://www.npmjs.com/package/rc).
It's extended during startup, e.g. by generating `proxy.targetUrl`.
The following settings are important when consuming the config:

* `selenium.serverUrl`: The url of the selenium server.
* `proxy.targetUrl`: The base url to use when talking to the app.
* `proxy.commandUrl`: The url to use when sending meta-requests to the proxy,
  e.g. marking a new page. This should be rarely used directly.


##### `testium.config.get(path, defaultValue)`

Retrieve a config setting using its `path`, e.g. `"app.port"`.
If the setting does not exist and no `defaultValue` is provided,
an error will be thrown.


##### `testium.config.has(path)`

Returns `true` if the config has a valid setting at the given `path`.


#### `testium.close()`

Quits all child processes created during startup.


#### `testium.getNewPageUrl(path, options)`

Generates a URL that should be loaded to navigate to a new page.
The advantage of using this method is that it allows to send custom headers
and it properly tracks the headers and status code of the response.


#### `testium.getInitialUrl()`

Generates a URL that should be loaded before navigating to any other page.
This allows setting cookies before the first proper page load
and can work around some confusing errors.
