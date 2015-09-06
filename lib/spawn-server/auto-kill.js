'use strict';

// TODO: Turn into stand-alone module

var children = [];

function addChild(child) {
  children.push(child);
}

function killAllChildren() {
  children.forEach(function(childProcess) {
    try {
      childProcess.kill();
    } catch (childErr) {
      console.error(childErr.stack);
    }
  });
}

function killAllChildrenAndThrow(error) {
  killAllChildren();
  throw error;
}

process.on('exit', killAllChildren);
process.on('uncaughtException', killAllChildrenAndThrow);

module.exports = addChild;
