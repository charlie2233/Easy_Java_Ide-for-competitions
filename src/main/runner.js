'use strict';

const { execFile, spawn } = require('child_process');
const fs = require('fs');
const path = require('path');
const os = require('os');

let currentProcess = null;

const WORK_DIR = path.join(os.tmpdir(), 'comp-ide-run');
fs.mkdirSync(WORK_DIR, { recursive: true });

/**
 * Run code with optional stdin input.
 * @param {object} opts
 * @param {string} opts.language   - 'java' | 'cpp' | 'python'
 * @param {string} opts.code       - source code string
 * @param {string} [opts.input]    - stdin to feed
 * @param {string} [opts.filePath] - original file path (used to infer class name)
 * @param {number} [opts.timeLimitMs] - execution time limit in ms (default 5000)
 * @returns {Promise<{stdout, stderr, exitCode, compileError, timedOut, timeMs}>}
 */
async function runCode({ language, code, input = '', filePath, timeLimitMs = 5000 }) {
  switch (language) {
    case 'java':   return runJava(code, input, filePath, timeLimitMs);
    case 'cpp':    return runCpp(code, input, timeLimitMs);
    case 'python': return runPython(code, input, timeLimitMs);
    default:       return { stdout: '', stderr: `Unsupported language: ${language}`, exitCode: 1 };
  }
}

// ─── Java ─────────────────────────────────────────────────────────────────────

function extractJavaClassName(code) {
  // Match "public class ClassName" or "class ClassName"
  const match = code.match(/public\s+class\s+(\w+)/) || code.match(/\bclass\s+(\w+)/);
  return match ? match[1] : 'Main';
}

async function runJava(code, input, filePath, timeLimitMs) {
  const className = filePath
    ? path.basename(filePath, '.java')
    : extractJavaClassName(code);

  const srcFile = path.join(WORK_DIR, `${className}.java`);
  fs.writeFileSync(srcFile, code, 'utf-8');

  // Compile
  const compile = await execAsync('javac', [srcFile], { cwd: WORK_DIR });
  if (compile.exitCode !== 0) {
    return { stdout: '', stderr: compile.stderr, exitCode: compile.exitCode, compileError: true };
  }

  // Run
  return execWithInput(
    'java',
    ['-cp', WORK_DIR, `-Xmx256m`, `-Xss64m`, className],
    input,
    timeLimitMs,
    WORK_DIR,
  );
}

// ─── C++ ──────────────────────────────────────────────────────────────────────

async function runCpp(code, input, timeLimitMs) {
  const srcFile = path.join(WORK_DIR, 'solution.cpp');
  const outFile = path.join(WORK_DIR, 'solution_out');
  fs.writeFileSync(srcFile, code, 'utf-8');

  const compile = await execAsync(
    'g++',
    ['-O2', '-std=c++17', '-o', outFile, srcFile],
    { cwd: WORK_DIR },
  );
  if (compile.exitCode !== 0) {
    return { stdout: '', stderr: compile.stderr, exitCode: compile.exitCode, compileError: true };
  }

  return execWithInput(outFile, [], input, timeLimitMs, WORK_DIR);
}

// ─── Python ───────────────────────────────────────────────────────────────────

async function runPython(code, input, timeLimitMs) {
  const srcFile = path.join(WORK_DIR, 'solution.py');
  fs.writeFileSync(srcFile, code, 'utf-8');
  return execWithInput('python3', [srcFile], input, timeLimitMs, WORK_DIR);
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function execAsync(cmd, args, opts = {}) {
  return new Promise((resolve) => {
    execFile(cmd, args, { ...opts, maxBuffer: 10 * 1024 * 1024 }, (err, stdout, stderr) => {
      resolve({
        stdout: stdout || '',
        stderr: stderr || '',
        exitCode: err ? (err.code ?? 1) : 0,
      });
    });
  });
}

function execWithInput(cmd, args, input, timeLimitMs, cwd) {
  return new Promise((resolve) => {
    const startTime = Date.now();
    const proc = spawn(cmd, args, { cwd, stdio: ['pipe', 'pipe', 'pipe'] });
    currentProcess = proc;

    let stdout = '';
    let stderr = '';
    let timedOut = false;

    const timer = setTimeout(() => {
      timedOut = true;
      proc.kill('SIGKILL');
    }, timeLimitMs);

    proc.stdout.on('data', (d) => { stdout += d.toString(); });
    proc.stderr.on('data', (d) => { stderr += d.toString(); });

    if (input) {
      proc.stdin.write(input);
    }
    proc.stdin.end();

    proc.on('close', (code) => {
      clearTimeout(timer);
      currentProcess = null;
      resolve({
        stdout,
        stderr,
        exitCode: code ?? (timedOut ? -1 : 1),
        timedOut,
        timeMs: Date.now() - startTime,
      });
    });

    proc.on('error', (err) => {
      clearTimeout(timer);
      currentProcess = null;
      resolve({ stdout: '', stderr: err.message, exitCode: 1, timedOut: false, timeMs: 0 });
    });
  });
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
