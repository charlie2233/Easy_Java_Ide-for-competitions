'use strict';

const { execFile } = require('child_process');
const fs = require('fs');
const path = require('path');
const os = require('os');

const VERSION_TIMEOUT_MS = 5000;

function tokenizeCommand(spec) {
  if (!spec || typeof spec !== 'string') return [];
  const parts = spec.match(/(?:[^\s"]+|"[^"]*")+/g) || [];
  return parts.map((part) => part.replace(/^"(.*)"$/, '$1'));
}

function isLikelyPath(cmd) {
  return path.isAbsolute(cmd) || cmd.includes('/') || cmd.includes('\\');
}

function runExec(cmd, args = [], opts = {}) {
  return new Promise((resolve) => {
    execFile(cmd, args, opts, (err, stdout, stderr) => {
      resolve({
        ok: !err,
        code: err ? (err.code ?? 1) : 0,
        stdout: stdout || '',
        stderr: stderr || '',
        error: err || null,
      });
    });
  });
}

async function whichAll(cmd) {
  const whichCmd = process.platform === 'win32' ? 'where' : 'which';
  const result = await runExec(whichCmd, [cmd]);
  if (!result.ok) return [];
  return result.stdout
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);
}

async function resolveCommand(spec, source = 'auto') {
  const tokens = tokenizeCommand(spec);
  if (!tokens.length) return null;

  const [cmd, ...args] = tokens;
  let resolvedPath = null;

  if (isLikelyPath(cmd)) {
    if (fs.existsSync(cmd)) {
      resolvedPath = path.resolve(cmd);
    }
  } else {
    const paths = await whichAll(cmd);
    if (paths.length) resolvedPath = paths[0];
  }

  if (!resolvedPath) return null;
  return {
    command: cmd,
    args,
    resolvedPath,
    source,
    raw: spec,
  };
}

function dedupeCommands(candidates) {
  const seen = new Set();
  return candidates.filter((candidate) => {
    if (!candidate) return false;
    const key = `${candidate.resolvedPath}|${candidate.args.join(' ')}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

async function getVersion(commandInfo, extraArgs = ['--version']) {
  if (!commandInfo) return null;
  const result = await runExec(
    commandInfo.command,
    [...commandInfo.args, ...extraArgs],
    { timeout: VERSION_TIMEOUT_MS },
  );
  const out = (result.stdout || result.stderr || '').trim();
  return out ? out.split(/\r?\n/)[0] : null;
}

function defaultCppCandidates() {
  if (process.platform === 'darwin') return ['clang++', 'g++'];
  if (process.platform === 'win32') return ['g++', 'clang++', 'cl'];
  return ['g++', 'clang++'];
}

function installHint(language) {
  if (process.platform === 'darwin') {
    if (language === 'java') return 'Install JDK 17+ via Adoptium or `brew install openjdk`.';
    if (language === 'cpp') return 'Install Xcode Command Line Tools: `xcode-select --install`.';
    if (language === 'python') return 'Install Python 3 via python.org or `brew install python`.';
  }
  if (process.platform === 'win32') {
    if (language === 'java') return 'Install JDK 17+ and add `java` + `javac` to PATH.';
    if (language === 'cpp') return 'Install MSYS2/MinGW g++ or LLVM clang++ and add it to PATH.';
    if (language === 'python') return 'Install Python 3 and enable "Add python.exe to PATH".';
  }
  if (language === 'java') return 'Install OpenJDK 17+.';
  if (language === 'cpp') return 'Install g++ or clang++.';
  return 'Install Python 3.';
}

async function detectJava(settings = {}) {
  const allowAuto = settings.autoPickBestBundle !== false;
  const manualJava = await resolveCommand(settings.javaPath || '', 'settings');
  const manualJavac = await resolveCommand(settings.javacPath || '', 'settings');

  let derivedJavac = null;
  if (manualJava && !manualJavac) {
    const sibling = path.join(
      path.dirname(manualJava.resolvedPath),
      process.platform === 'win32' ? 'javac.exe' : 'javac',
    );
    if (fs.existsSync(sibling)) {
      derivedJavac = {
        command: sibling,
        args: [],
        resolvedPath: sibling,
        source: 'derived',
        raw: sibling,
      };
    }
  }

  const autoJava = await resolveCommand('java', 'auto');
  const autoJavac = await resolveCommand('javac', 'auto');

  const runtime = manualJava || (allowAuto ? autoJava : null);
  const compiler = manualJavac || derivedJavac || (allowAuto ? autoJavac : null);
  const available = !!(runtime && compiler);
  const version = runtime ? await getVersion(runtime, ['-version']) : null;

  let status = 'ready';
  if (!runtime && !compiler) status = 'not installed';
  else if (!runtime) status = 'missing java';
  else if (!compiler) status = 'missing javac';

  return {
    available,
    status,
    runtime,
    compiler,
    version,
    installHint: available ? null : installHint('java'),
  };
}

function cppFlavor(commandInfo) {
  if (!commandInfo) return null;
  const base = path.basename(commandInfo.command).toLowerCase();
  if (base === 'clang++' || base === 'clang++.exe') return 'clang';
  if (base === 'cl' || base === 'cl.exe') return 'msvc';
  return 'gcc';
}

async function detectCpp(settings = {}) {
  const allowAuto = settings.autoPickBestBundle !== false;
  const manual = await resolveCommand(settings.cppCompiler || '', 'settings');
  const autoCandidates = await Promise.all(defaultCppCandidates().map((cmd) => resolveCommand(cmd, 'auto')));
  const auto = dedupeCommands(autoCandidates)[0] || null;
  const compiler = manual || (allowAuto ? auto : null);
  const flavor = cppFlavor(compiler);
  const versionArgs = flavor === 'msvc' ? ['/?'] : ['--version'];
  const version = compiler ? await getVersion(compiler, versionArgs) : null;

  return {
    available: !!compiler,
    status: compiler ? 'ready' : 'not installed',
    compiler,
    flavor,
    version,
    installHint: compiler ? null : installHint('cpp'),
  };
}

async function detectPython(settings = {}) {
  const allowAuto = settings.autoPickBestBundle !== false;
  const manual = await resolveCommand(settings.pythonPath || '', 'settings');
  const defaults = process.platform === 'win32'
    ? ['python3', 'py -3', 'python']
    : ['python3', 'python'];

  const autoCandidates = await Promise.all(defaults.map((cmd) => resolveCommand(cmd, 'auto')));
  const auto = dedupeCommands(autoCandidates)[0] || null;
  const runtime = manual || (allowAuto ? auto : null);
  const version = runtime ? await getVersion(runtime, ['--version']) : null;

  return {
    available: !!runtime,
    status: runtime ? 'ready' : 'not installed',
    runtime,
    version,
    installHint: runtime ? null : installHint('python'),
  };
}

async function detectBundles(settings = {}) {
  const [java, cpp, python] = await Promise.all([
    detectJava(settings),
    detectCpp(settings),
    detectPython(settings),
  ]);

  return {
    java,
    cpp,
    python,
    best: {
      java: java.available ? { javaCmd: java.runtime, javacCmd: java.compiler } : null,
      cpp: cpp.available ? { cppCmd: cpp.compiler, flavor: cpp.flavor } : null,
      python: python.available ? { pythonCmd: python.runtime } : null,
    },
    platform: process.platform,
    arch: os.arch(),
  };
}

async function resolveToolchain(settings = {}) {
  const bundles = await detectBundles(settings);
  return {
    bundles,
    best: bundles.best,
    ready: {
      java: bundles.java.available,
      cpp: bundles.cpp.available,
      python: bundles.python.available,
    },
  };
}

module.exports = { detectBundles, resolveToolchain };
