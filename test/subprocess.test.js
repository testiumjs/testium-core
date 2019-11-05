'use strict';

const assert = require('assertive');

const sub = require('../lib/subprocess');

let currentProcesses = null;

// if mocha crashes, the child process
// running our tests won't clean itself
// up properly; so, we have to do this
process.on('uncaughtException', error => {
  if (currentProcesses != null) sub.killAll(currentProcesses);

  // eslint-disable-next-line no-console
  console.error(error.stack);
  // eslint-disable-next-line no-process-exit
  process.exit(1);
});

async function runSub(config) {
  const ps = await sub(config);
  // save off the current processes
  // so that we can kill them
  // (1) if mocha crashes or
  // (2) afterEach test
  currentProcesses = ps;
  // if an error is thrown async,
  // the mocha process crashes;
  // this allows the test suite to
  // keep running

  return ps;
}

describe('subprocess', () => {
  describe('basics', () => {
    describe('starts a process', () => {
      let proc;
      before(async () => {
        const config = {
          app: {
            command: 'node',
            commandArgs: ['examples/subprocess/service.js', '%port%'],
            logFilePath: 'test/log/start-proc.log',
            port: 9903,
          },
        };
        const processes = await runSub(config);
        proc = processes && processes.app;
      });
      after(() => {
        if (currentProcesses != null) {
          sub.killAll(currentProcesses);
        }
        currentProcesses = null;
      });

      it('has rawProcess.pid', () => {
        assert.truthy('process.rawProcess.pid', proc.rawProcess.pid);
      });
      it('has baseUrl', () => {
        assert.equal('process.baseUrl', 'http://127.0.0.1:9903', proc.baseUrl);
      });
      it('has port', () => {
        assert.equal('process.port', 9903, proc.port);
      });
      it('has logPath', () => {
        assert.match(
          'process.logPath',
          /test\/log\/start-proc\.log$/,
          proc.logPath
        );
      });
      it('has logHandle', () => {
        assert.equal('process.logHandle', 'number', typeof proc.logHandle);
      });
      it('has launchCommand', () => {
        assert.equal('process.launchCommand', 'node', proc.launchCommand);
      });
      it('has launchArguments', () => {
        assert.deepEqual(
          'process.launchArguments',
          ['examples/subprocess/service.js', '9903'],
          proc.launchArguments
        );
      });
      it('has workingDirectory', () => {
        assert.equal(
          'process.workingDirectory',
          'string',
          typeof proc.workingDirectory
        );
      });
    });
  });

  describe('advanced', () => {
    afterEach(() => {
      if (currentProcesses != null) {
        sub.killAll(currentProcesses);
      }
      currentProcesses = null;
    });
    it('allows custom verification', async () => {
      const forceError = new Error('force failure');
      const config = {
        app: {
          command: 'node',
          commandArgs: ['examples/subprocess/service.js', '%port%'],
          logFilePath: 'test/log/custom-verification.log',
          port: 6501,
          verify: () => Promise.reject(forceError),
        },
      };
      // THIS IS THE ONE THAT HANGS MOCHA - MAYBE NEEDS TO INCLUDE processes in error
      const error = await assert.rejects(runSub(config));
      assert.equal(forceError, error);
    });
    it('passes along spawn options', async () => {
      const config = {
        app: {
          command: 'node',
          commandArgs: ['examples/subprocess/env-echo.js'],
          logFilePath: 'test/log/spawn-opts.log',
          port: 9933,
          verify: () => Promise.resolve(true),
          spawnOpts: { env: { testResult: 100 } },
        },
      };
      const processes = await runSub(config);

      // wait a little bit for the process
      // to actually write out to the log file;
      // yes, arbitrary delays are bad
      await new Promise(resolve => setTimeout(resolve, 100));

      const log = await processes.app.readLog();
      assert.include('100', log);
    });
    it('allows arbitrary verification timeouts', async () => {
      const config = {
        app: {
          command: 'node',
          commandArgs: ['examples/subprocess/hang.js'],
          logFilePath: 'test/log/timeout.log',
          verifyTimeout: 10,
          // not yet ready
          verify: () => Promise.resolve(false),
        },
      };

      const error = await assert.rejects(runSub(config));
      assert.include('timeout: 10ms', error.message);
    });
    it('shows the log when a process errors', async () => {
      const config = {
        app: {
          command: 'node',
          commandArgs: ['examples/subprocess/error.js', '%port%'],
          logFilePath: 'test/log/process-error.log',
        },
      };
      const error = await assert.rejects(runSub(config));
      assert.include('intentional failure', error.message);
    });
    it('starts dependant processes', async () => {
      let serviceReady = false;
      const config = {
        app: {
          dependsOn: ['service'],
          command: 'node',
          commandArgs: ['examples/subprocess/service.js', '%port%'],
          logFilePath: 'test/log/dep-app.log',
          port: 6500,
          async verify() {
            if (!serviceReady) throw new Error('service not yet started');
            return true;
          },
        },
        service: {
          command: 'node',
          commandArgs: ['examples/subprocess/service.js', '%port%'],
          logFilePath: 'test/log/dep-service.log',
          async verify() {
            serviceReady = true;
            // no error
            return true;
          },
        },
      };

      await runSub(config);
    });
  });
});
