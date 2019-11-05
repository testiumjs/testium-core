NOTE: this is a vendored, promise-ported-and-updated version of
https://github.com/endangeredmassa/subprocess, since that project is defunct
and we still need it.  The idea is to eventually publish this as a major bump
under that same name.

# subprocess

subprocess is a child process management library for Node.js.
It handles startup, port management, availability checking, and teardown
of a series of child processes.

It's like an [`async.auto`](https://github.com/caolan/async#auto)
for processes, and with Promises.

Note that the depedencies are registered as the property `dependsOn`
instead of preceding elements in an array.

This project is a safe and inclusive place for contributors of all kinds.
See the [Code of Conduct](CODE_OF_CONDUCT.md) for details.

## install

```bash
npm install --save subprocess
```

## usage

```js
const subprocess = require('subprocess');

const config = {
  processName: {
    dependsOn: ['<other proc name>', ...],  // optional dependant processes
                                            // differs from async.auto in syntax
    command: 'node',
    commandArgs: ['index.js', '%port%'],    // %port% is replaced with the port
    port: 9999,                             // omit to get a random available port
    logFilePath: './log/process.log',           // file path to log file for stdio
    spawnOptions: {},                       // options to pass to child_process.spawn

    verifyInterval: 100,                    // ms, default
    verifyTimeout: 3000,                    // ms, default

    // optional, defaults to checking for something listening on the port
    // called every `verifyInterval` until `verifyTimeout` for as long as it
    // resolves false
    async verify(port) {
      // custom verification logic

      // a thrown error means to stop checking for availability
      // `return false` means to keep checking
      // `return true` means that the process is up and ready
      return isAvailable;
    }
  }
};

const processes = await subprocess(config);
// there may be a custom error thrown
// by the verify function or it can be
// an subprocess-specific error;
// see the errors section for more info

/*
processes = {
  processName: {
    rawProcess: [ChildProcess],
    baseUrl: "http://127.0.0.1:9999",
    port: 9999,
    logFilePath: './log/process.log',
    logHandle: [LogHandle],
    launchCommand: 'node',
    launchArguments: ['index.js', '9999'],
    workingDirectory: '~/someplace'
  }
}
*/
```

All processes started this way will be
automatically registered to kill themselves
on `process.on('uncaughtException', handler)`.


### `subprocess.killAll`

subprocess exposes a method that
can kill all of your processes for you.

```js
const processes = await subprocess(config);
// do some things
subprocess.killAll(processes);
});
```

You don't have to use this method
to kill all processes.
The point of subprocess is that it
will kill these for you when the
main process exits.
However, if you want to manage this yourself,
this is how you do it.


## example

```js
const subprocess = require('subprocess');
const { fetch } = require('gofer');

const processes = {
  app: {
    dependsOn: ['service'],
    command: 'node',
    commandArgs: ['index.js', '--port=%port%'],
    port: 4500
  },

  service: {
    command: 'node',
    commandArgs: ['service.js', '--port=%port%'],
    async verify(port){
      await fetch('http://localhost:'+port+'/status').text();
      return true;
    }
  }
};

const processes = await subprocess(processes);
console.log('processes started successfully!');
```

## errors

### command not found

When the `command` string is passed to the system
and a `NOENT` error is returned,
subprocess will raise an error with message:

```
Unable to find <command>
```

### process crashed

When a process started by subprocess crashes
before it can be verified,
subprocess will raise an error with message:

```
Process <processName> crashed with code <exitCode>.
Log output (last 20 lines):

>
> <log output>
>

See the full log at: <log path>
<original error message>
```

### process verification timeout

When a process appears to start propertly,
but cannot be verified before the `verifyTimeout`,
subprocess will raise an error with message:

```
Process <processName> did not start in time.

Debug info:
* command: <command>
           <command arguments>
* cwd:     <working directory>
* port:    <port>
* timeout: <timeout>

Log output (last 20 lines):

>
> <log output>
>

See the full log at: <log path>
<original error message>
```
