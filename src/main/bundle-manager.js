'use strict';

const { execFile } = require('child_process');
const os = require('os');

/**
 * Detect available language runtimes/compilers on the system.
 * @returns {Promise<object>} bundle status for each language
 */
async function detectBundles() {
  const [java, javac, gpp, python3, python] = await Promise.all([
    which('java'),
    which('javac'),
    which('g++'),
    which('python3'),
    which('python'),
  ]);

  const javaVersion = java ? await getVersion('java', ['-version']) : null;
  const gppVersion = gpp ? await getVersion('g++', ['--version']) : null;
  const pyVersion = python3
    ? await getVersion('python3', ['--version'])
    : python
    ? await getVersion('python', ['--version'])
    : null;

  return {
    java: {
      available: !!(java && javac),
      path: java,
      version: javaVersion,
      status: java && javac ? 'ready' : java ? 'missing javac' : 'not installed',
    },
    cpp: {
      available: !!gpp,
      path: gpp,
      version: gppVersion,
      status: gpp ? 'ready' : 'not installed',
    },
    python: {
      available: !!(python3 || python),
      path: python3 || python,
      version: pyVersion,
      status: python3 || python ? 'ready' : 'not installed',
    },
    platform: process.platform,
    arch: os.arch(),
  };
}

function which(cmd) {
  return new Promise((resolve) => {
    const whichCmd = process.platform === 'win32' ? 'where' : 'which';
    execFile(whichCmd, [cmd], (err, stdout) => {
      resolve(err ? null : stdout.trim().split('\n')[0].trim());
    });
  });
}

function getVersion(cmd, args) {
  return new Promise((resolve) => {
    execFile(cmd, args, { timeout: 5000 }, (err, stdout, stderr) => {
      const out = (stdout || stderr || '').trim();
      const line = out.split('\n')[0];
      resolve(line || null);
    });
  });
}

module.exports = { detectBundles };
