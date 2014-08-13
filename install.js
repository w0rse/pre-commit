'use strict';

var which = require('which')
  , path = require('path')
  , fs = require('fs');

//
// Compatibility with older node.js.
//
var existsSync = fs.existsSync || path.existsSync;

//
// Our own pre-commit hook runner.
//
var hook = fs.readFileSync('./hook', 'utf-8');

//
// The root of repository.
//
var root = path.resolve(__dirname, '../..');

//
// The location .git and it's hooks
//
var git = path.resolve(root, '.git')
  , hooks = path.resolve(git, 'hooks')
  , precommit = path.resolve(hooks, 'pre-commit');

//
// Check if we are in a git repository so we can bail out early when this is not
// the case.
//
if (!existsSync(git) || !fs.lstatSync(git).isDirectory()) {
  return console.error('pre-commit: No valid git or hooks directory found.');
}

//
// Create a hooks directory if it's missing.
//
if (!existsSync(hooks)) fs.mkdirSync(hooks);

//
// We cannot assume that `node` is in the $PATH as `env node` doesn't work well
// with GUI clients according to observing/pre-commit#12
//
try {
  require('which').sync('node');
} catch (e) {
  hook = hook.replace('#!/usr/bin/env node',
    existsSync('/usr/local/bin/node')
    ? '/usr/local/bin/node'
    : process.execPath
  );
}

//
// If there's an existing `pre-commit` hook we want to back it up instead of
// overriding it and losing it completely.
//
if (existsSync(precommit) && fs.readFileSync(precommit, 'uf8') !== hook) {
  console.log('');
  console.log('pre-commit: Detected an existing git pre-commit hook');
  fs.writeFileSync(precommit +'.old', fs.readFileSync(precommit));
  console.log('pre-commit: Old pre-commit hook backuped to pre-commit.old');
  console.log('');
}

//
// Everything is ready for the installation of the pre-commit hook. Write it and
// make it executable.
//
fs.writeFileSync(precommit, hook);
fs.chmodSync(precommit, '755');
