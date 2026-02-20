'use strict';

const { execFile, spawn } = require('child_process');
const fs = require('fs');
const path = require('path');
const os = require('os');
const crypto = require('crypto');

let currentProcess = null;

const WORK_DIR = path.join(os.tmpdir(), 'comp-ide-run');
fs.mkdirSync(WORK_DIR, { recursive: true });

const compileCache = {
  java: new Map(),
  cpp: new Map(),
};

/**
 * Run code with optional stdin input.
 * @param {object} opts
 * @param {string} opts.language   - 'java' | 'cpp' | 'python'
 * @param {string} opts.code       - source code string
 * @param {string} [opts.input]    - stdin to feed
 * @param {string} [opts.filePath] - original file path (used to infer class name and workspace)
 * @param {number} [opts.timeLimitMs] - execution time limit in ms (default 5000)
 * @param {number} [opts.memoryLimitMb] - memory limit for JVM (default 256)
 * @param {object} [opts.toolchain] - resolved command paths from bundle manager
 * @param {boolean} [opts.usacoMode] - enable USACO file-mode helpers
 * @param {string} [opts.usacoProblem] - base name for <problem>.in/.out
 * @param {boolean} [opts.usacoUseFileInput] - if true, fallback to reading <problem>.in when custom input is empty
 * @returns {Promise<object>}
 */
async function runCode({
  language,
  code,
  input = '',
  filePath,
  timeLimitMs = 5000,
  memoryLimitMb = 256,
  toolchain = {},
  usacoMode = false,
  usacoProblem = 'problem',
  usacoUseFileInput = true,
}) {
  const usaco = buildUsacoContext({
    filePath,
    input,
    usacoMode,
    usacoProblem,
    usacoUseFileInput,
  });

  const effectiveInput = usaco.effectiveInput;

  let result;
  switch (language) {
    case 'java':
      result = await runJava({
        code,
        input: effectiveInput,
        filePath,
        timeLimitMs,
        memoryLimitMb,
        javaToolchain: toolchain.java || {},
      });
      break;
    case 'cpp':
      result = await runCpp({
        code,
        input: effectiveInput,
        timeLimitMs,
        cppToolchain: toolchain.cpp || {},
      });
      break;
    case 'python':
      result = await runPython({
        code,
        input: effectiveInput,
        timeLimitMs,
        pythonToolchain: toolchain.python || {},
      });
      break;
    default:
      result = { stdout: '', stderr: `Unsupported language: ${language}`, exitCode: 1 };
  }

  if (usaco.enabled && !result.compileError && !result.timedOut && result.exitCode === 0) {
    try {
      fs.writeFileSync(usaco.outputPath, result.stdout || '', 'utf-8');
      usaco.outputWritten = true;
    } catch (err) {
      usaco.outputWriteError = err.message;
    }
  }

  return {
    ...result,
    usaco: {
      enabled: usaco.enabled,
      problemName: usaco.problemName,
      inputPath: usaco.inputPath,
      outputPath: usaco.outputPath,
      usedInputFile: usaco.usedInputFile,
      outputWritten: usaco.outputWritten,
      outputWriteError: usaco.outputWriteError,
    },
  };
}

// ─── Java ─────────────────────────────────────────────────────────────────────

function extractJavaClassName(code) {
  const publicClass = code.match(/\bpublic\s+class\s+([A-Za-z_]\w*)/);
  if (publicClass) return publicClass[1];
  const anyClass = code.match(/\bclass\s+([A-Za-z_]\w*)/);
  return anyClass ? anyClass[1] : 'Main';
}

async function runJava({ code, input, filePath, timeLimitMs, memoryLimitMb, javaToolchain }) {
  const className = extractJavaClassName(code)
    || (filePath ? path.basename(filePath, '.java') : 'Main');

  const javaCmd = normalizeCommand(javaToolchain.javaCmd, 'java');
  const javacCmd = normalizeCommand(javaToolchain.javacCmd, 'javac');
  const signature = `${commandSignature(javaCmd)}|${commandSignature(javacCmd)}|${memoryLimitMb}`;
  const cacheKey = hash(`${code}|${className}|${signature}`);
  const runDir = path.join(WORK_DIR, `java-${cacheKey.slice(0, 16)}`);
  const srcFile = path.join(runDir, `${className}.java`);
  const classFile = path.join(runDir, `${className}.class`);

  fs.mkdirSync(runDir, { recursive: true });

  let compileMs = 0;
  let cacheHit = false;
  if (!compileCache.java.has(cacheKey) || !fs.existsSync(classFile)) {
    fs.writeFileSync(srcFile, code, 'utf-8');
    const compileStart = Date.now();
    const compile = await execAsyncCommand(javacCmd, [srcFile], { cwd: runDir });
    compileMs = Date.now() - compileStart;
    if (compile.exitCode !== 0) {
      return {
        stdout: '',
        stderr: compile.stderr || compile.stdout || 'Java compilation failed.',
        exitCode: compile.exitCode,
        compileError: true,
        compileMs,
        cacheHit: false,
      };
    }
    touchCache(compileCache.java, cacheKey, { classFile, runDir });
  } else {
    cacheHit = true;
  }

  const execResult = await execWithInputCommand(
    javaCmd,
    ['-cp', runDir, `-Xmx${memoryLimitMb}m`, '-Xss64m', className],
    input,
    timeLimitMs,
    runDir,
  );
  return { ...execResult, compileMs, cacheHit };
}

// ─── C++ ──────────────────────────────────────────────────────────────────────

async function runCpp({ code, input, timeLimitMs, cppToolchain }) {
  const compiler = normalizeCommand(cppToolchain.cppCmd, 'g++');
  const flavor = cppToolchain.flavor || 'gcc';
  const signature = `${commandSignature(compiler)}|${flavor}`;
  const cacheKey = hash(`${code}|${signature}`);
  const runDir = path.join(WORK_DIR, `cpp-${cacheKey.slice(0, 16)}`);
  const srcFile = path.join(runDir, 'solution.cpp');
  const outFile = path.join(runDir, process.platform === 'win32' ? 'solution_out.exe' : 'solution_out');

  fs.mkdirSync(runDir, { recursive: true });

  let compileMs = 0;
  let cacheHit = false;
  if (!compileCache.cpp.has(cacheKey) || !fs.existsSync(outFile)) {
    fs.writeFileSync(srcFile, code, 'utf-8');
    const compileArgs = flavor === 'msvc'
      ? ['/nologo', '/O2', '/EHsc', '/std:c++17', srcFile, `/Fe:${outFile}`]
      : ['-O2', '-std=c++17', '-o', outFile, srcFile];

    const compileStart = Date.now();
    const compile = await execAsyncCommand(compiler, compileArgs, { cwd: runDir });
    compileMs = Date.now() - compileStart;
    if (compile.exitCode !== 0) {
      return {
        stdout: '',
        stderr: compile.stderr || compile.stdout || 'C++ compilation failed.',
        exitCode: compile.exitCode,
        compileError: true,
        compileMs,
        cacheHit: false,
      };
    }
    touchCache(compileCache.cpp, cacheKey, { outFile, runDir });
  } else {
    cacheHit = true;
  }

  const execResult = await execWithInputCommand(
    { command: outFile, args: [] },
    [],
    input,
    timeLimitMs,
    runDir,
  );
  return { ...execResult, compileMs, cacheHit };
}

// ─── Python ───────────────────────────────────────────────────────────────────

async function runPython({ code, input, timeLimitMs, pythonToolchain }) {
  const pythonCmd = normalizeCommand(pythonToolchain.pythonCmd, 'python3');
  const runDir = path.join(WORK_DIR, 'python');
  fs.mkdirSync(runDir, { recursive: true });

  const srcFile = path.join(runDir, 'solution.py');
  fs.writeFileSync(srcFile, code, 'utf-8');

  const execResult = await execWithInputCommand(
    pythonCmd,
    [srcFile],
    input,
    timeLimitMs,
    runDir,
  );
  return { ...execResult, compileMs: 0, cacheHit: false };
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function parseCommandString(spec) {
  const tokens = (spec || '').match(/(?:[^\s"]+|"[^"]*")+/g) || [];
  if (!tokens.length) return null;
  const cleaned = tokens.map((part) => part.replace(/^"(.*)"$/, '$1'));
  return { command: cleaned[0], args: cleaned.slice(1) };
}

function normalizeCommand(commandInfo, fallbackCommand) {
  if (commandInfo && typeof commandInfo === 'object' && commandInfo.command) {
    return {
      command: commandInfo.command,
      args: Array.isArray(commandInfo.args) ? commandInfo.args : [],
    };
  }
  if (typeof commandInfo === 'string' && commandInfo.trim()) {
    const parsed = parseCommandString(commandInfo.trim());
    if (parsed) return parsed;
  }
  return { command: fallbackCommand, args: [] };
}

function commandSignature(commandInfo) {
  return `${commandInfo.command} ${commandInfo.args.join(' ')}`.trim();
}

function hash(input) {
  return crypto.createHash('sha1').update(input).digest('hex');
}

function touchCache(cacheMap, key, value) {
  if (cacheMap.has(key)) {
    cacheMap.delete(key);
  }
  cacheMap.set(key, value);
  while (cacheMap.size > 12) {
    const firstKey = cacheMap.keys().next().value;
    cacheMap.delete(firstKey);
  }
}

function execAsyncCommand(commandInfo, args, opts = {}) {
  return new Promise((resolve) => {
    const allArgs = [...commandInfo.args, ...args];
    execFile(
      commandInfo.command,
      allArgs,
      { ...opts, maxBuffer: 20 * 1024 * 1024 },
      (err, stdout, stderr) => {
        let finalStderr = stderr || '';
        if (err && err.code === 'ENOENT') {
          finalStderr = `Command not found: ${commandInfo.command}`;
        }
        resolve({
          stdout: stdout || '',
          stderr: finalStderr,
          exitCode: err ? (typeof err.code === 'number' ? err.code : 1) : 0,
        });
      },
    );
  });
}

function execWithInputCommand(commandInfo, args, input, timeLimitMs, cwd) {
  return new Promise((resolve) => {
    const startTime = Date.now();
    const allArgs = [...commandInfo.args, ...args];
    const proc = spawn(commandInfo.command, allArgs, { cwd, stdio: ['pipe', 'pipe', 'pipe'] });
    currentProcess = proc;

    let stdout = '';
    let stderr = '';
    let timedOut = false;
    let spawnError = null;

    const timer = setTimeout(() => {
      timedOut = true;
      proc.kill('SIGKILL');
    }, timeLimitMs);

    proc.stdout.on('data', (d) => { stdout += d.toString(); });
    proc.stderr.on('data', (d) => { stderr += d.toString(); });

    proc.on('error', (err) => {
      spawnError = err;
    });

    if (input) {
      proc.stdin.write(input);
    }
    proc.stdin.end();

    proc.on('close', (code) => {
      clearTimeout(timer);
      currentProcess = null;

      if (spawnError && spawnError.code === 'ENOENT') {
        stderr = `Command not found: ${commandInfo.command}`;
      } else if (spawnError && !stderr) {
        stderr = spawnError.message;
      }

      resolve({
        stdout,
        stderr,
        exitCode: code ?? (timedOut ? -1 : 1),
        timedOut,
        timeMs: Date.now() - startTime,
      });
    });
  });
}

function sanitizeProblemName(name) {
  const safe = (name || 'problem').replace(/[^A-Za-z0-9_-]/g, '');
  return safe || 'problem';
}

function buildUsacoContext({ filePath, input, usacoMode, usacoProblem, usacoUseFileInput }) {
  if (!usacoMode) {
    return {
      enabled: false,
      problemName: sanitizeProblemName(usacoProblem),
      inputPath: null,
      outputPath: null,
      effectiveInput: input || '',
      usedInputFile: false,
      outputWritten: false,
      outputWriteError: null,
    };
  }

  const problemName = sanitizeProblemName(usacoProblem);
  const workspaceDir = filePath ? path.dirname(filePath) : process.cwd();
  const inputPath = path.join(workspaceDir, `${problemName}.in`);
  const outputPath = path.join(workspaceDir, `${problemName}.out`);

  let effectiveInput = input || '';
  let usedInputFile = false;

  if (!effectiveInput && usacoUseFileInput && fs.existsSync(inputPath)) {
    try {
      effectiveInput = fs.readFileSync(inputPath, 'utf-8');
      usedInputFile = true;
    } catch (_) {
      // Ignore input file read errors and continue with empty stdin.
    }
  }

  return {
    enabled: true,
    problemName,
    inputPath,
    outputPath,
    effectiveInput,
    usedInputFile,
    outputWritten: false,
    outputWriteError: null,
  };
}

function killProcess() {
  if (currentProcess) {
    try { currentProcess.kill('SIGKILL'); } catch (_) {}
    currentProcess = null;
    return true;
  }
  return false;
}

module.exports = { runCode, killProcess };
