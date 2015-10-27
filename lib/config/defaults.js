'use strict';

module.exports = function getDefaults() {
  return {
    // Root directory of the application.
    // All paths will be resolved relative to this directory.
    // It's also where testium will look for a `package.json` file
    // to figure out how to start the app.
    root: process.cwd(),
    // Automatically launch the app with the default NODE_ENV=test.
    // Set this to true if you want testium to handle this for you
    // when you call `getBrowser`.
    launch: false,
    // Customize the NODE_ENV of the service being started. Example: 'integration' or 'ci'
    launchEnv: 'test',
    // The browser to use, possible values:
    // phantomjs | chrome | firefox | internet explorer
    browser: 'phantomjs',
    desiredCapabilities: {},

    // Directory (relative to `root`) where logs are written by testium
    logDirectory: './test/log',
    // Directory to store automated screenshosts, e.g. on failing tests
    screenshotDirectory: './test/log/failed_screenshots',

    // Options for web driver connections
    // can specify timeout and connectTimeout here, defaults are
    // connectTimeout = 2000
    // timeout = 60000
    webdriver: {
      requestOptions: {},
    },

    app: {
      // A port of 0 means "auto-select available port"
      port: process.env.PORT || undefined,
      // How long to wait for the app to start listening
      timeout: 30000,
      // Command to start the app.
      // `undefined` means testium will simulate `npm start`
      command: undefined,
    },
    phantomjs: {
      // Command to start phantomjs
      // Change this if you don't have phantomjs in your PATH
      command: 'phantomjs',
      // How long to wait for phantomjs to listen
      timeout: 6000,
    },
    selenium: {
      // How long to wait for selenium to listen
      timeout: 90000,
      // Set this if you have a running selenium server
      // and don't want testium to start one.
      serverUrl: undefined,
      // Path to selenium jar.
      // `undefined` means "use testium built-in".
      // Using the testium built-in binaries requires you to run
      // `testium --download-selenium` before running your tests.
      jar: undefined,
      // Path to chromedriver.
      // `undefined` means "use testium built-in", see `jar` above.
      chromedriver: undefined,
      // Log debug info to selenium.log.
      debug: true,
    },
    repl: {
      // Module for the testium repl
      // If you want to use coffee-script in the repl, use:
      // * `module: coffee-script/repl` for coffee-script
      // * `module: coffee-script-redux/lib/repl` for redux
      module: 'repl',
    },
    mixins: {
      // mixin modules allow you to add new methods to the browser
      // Example:
      // ```
      // module.exports = {
      //   // available as `browser.goHome()`
      //   goHome: function() {
      //     this.click('header #home');
      //   }
      // };
      // ```
      // Elements in the array should be node.js module names
      // that can be required relative to `root`.
      browser: [],
      // Same as browser, only that it extends `browser.assert`.
      // Use this.browser to access the browser.
      assert: [],
    },
    mocha: {
      // mocha timeout for all tests that are in the suite the
      // browser was injected into.
      timeout: 20000,
      // Same, just for `slow`.
      slow: 2000,
    },
  };
};
