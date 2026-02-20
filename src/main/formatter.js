'use strict';

const { execFile } = require('child_process');
const fs = require('fs');
const path = require('path');
const os = require('os');

function tokenizeCommand(spec) {
  if (!spec || typeof spec !== 'string') return [];
  const parts = spec.match(/(?:[^\s"]+|"[^"]*")+/g) || [];
  return parts.map((part) => part.replace(/^"(.*)"$/, '$1'));
}

function parseCommandSpec(spec) {
  const tokens = tokenizeCommand(spec);
  if (!tokens.length) return null;
  return {
    command: tokens[0],
    args: tokens.slice(1),
  };
}

function runExec(command, args = [], opts = {}) {
  return new Promise((resolve) => {
    execFile(command, args, opts, (err, stdout, stderr) => {
      resolve({
        ok: !err,
        stdout: stdout || '',
        stderr: stderr || '',
        code: err ? (err.code ?? 1) : 0,
        error: err || null,
      });
    });
  });
}

async function commandExists(command) {
  const whichCmd = process.platform === 'win32' ? 'where' : 'which';
  const result = await runExec(whichCmd, [command]);
  return result.ok;
}

function injectFileArg(args, filePath) {
  let usedPlaceholder = false;
  const nextArgs = args.map((arg) => {
    if (arg.includes('{file}')) {
      usedPlaceholder = true;
      return arg.replace(/\{file\}/g, filePath);
    }
    return arg;
  });
  if (!usedPlaceholder) nextArgs.push(filePath);
  return nextArgs;
}

async function resolveJavaFormatter(javaFormatterPath = '') {
  if (javaFormatterPath) {
    const parsed = parseCommandSpec(javaFormatterPath);
    if (!parsed) return null;

    if (parsed.command.toLowerCase().endsWith('.jar')) {
      return {
        tool: path.basename(parsed.command),
        command: 'java',
        args: ['-jar', parsed.command, ...parsed.args],
      };
    }
    return {
      tool: parsed.command,
      command: parsed.command,
      args: parsed.args,
    };
  }

  if (await commandExists('google-java-format')) {
    return {
      tool: 'google-java-format',
      command: 'google-java-format',
      args: [],
    };
  }
  return null;
}

async function resolveClangFormatter(clangFormatPath = '') {
  if (clangFormatPath) {
    const parsed = parseCommandSpec(clangFormatPath);
    if (!parsed) return null;
    return {
      tool: parsed.command,
      command: parsed.command,
      args: parsed.args,
    };
  }

  if (await commandExists('clang-format')) {
    return {
      tool: 'clang-format',
      command: 'clang-format',
      args: [],
    };
  }
  return null;
}

async function formatJava({ code, javaFormatterPath }) {
  const formatter = await resolveJavaFormatter(javaFormatterPath);
  if (!formatter) {
    return {
      ok: false,
      error: 'google-java-format is not available. Install it or configure Java Formatter Path.',
    };
  }

  const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'compide-javafmt-'));
  const filePath = path.join(tempDir, 'Main.java');
  fs.writeFileSync(filePath, code, 'utf-8');

  try {
    let args = formatter.args.slice();
    if (!args.includes('--replace')) args.push('--replace');
    args = injectFileArg(args, filePath);

    const run = await runExec(formatter.command, args, { cwd: tempDir });
    if (!run.ok) {
      return {
        ok: false,
        error: run.stderr || run.stdout || 'Java formatter failed.',
      };
    }

    const formattedCode = fs.readFileSync(filePath, 'utf-8');
    return {
      ok: true,
      formattedCode,
      changed: formattedCode !== code,
      tool: formatter.tool,
    };
  } finally {
    fs.rmSync(tempDir, { recursive: true, force: true });
  }
}

async function formatCpp({ code, clangFormatPath }) {
  const formatter = await resolveClangFormatter(clangFormatPath);
  if (!formatter) {
    return {
      ok: false,
      error: 'clang-format is not available. Install it or configure C++ Formatter Path.',
    };
  }

  const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'compide-cppfmt-'));
  const filePath = path.join(tempDir, 'solution.cpp');
  fs.writeFileSync(filePath, code, 'utf-8');

  try {
    let args = formatter.args.slice();
    if (!args.some((arg) => arg === '-i' || arg === '--assume-filename')) {
      args.unshift('-i');
    }
    if (!args.some((arg) => arg.startsWith('--style='))) {
      args.push('--style=Google');
    }
    args = injectFileArg(args, filePath);

    const run = await runExec(formatter.command, args, { cwd: tempDir });
    if (!run.ok) {
      return {
        ok: false,
        error: run.stderr || run.stdout || 'C++ formatter failed.',
      };
    }

    const formattedCode = fs.readFileSync(filePath, 'utf-8');
    return {
      ok: true,
      formattedCode,
      changed: formattedCode !== code,
      tool: formatter.tool,
    };
  } finally {
    fs.rmSync(tempDir, { recursive: true, force: true });
  }
}

async function formatCode({
  language,
  code,
  javaFormatterPath = '',
  clangFormatPath = '',
}) {
  if (typeof code !== 'string') {
    return { ok: false, error: 'No source code provided for formatting.' };
  }

  if (language === 'java') {
    return formatJava({ code, javaFormatterPath });
  }
  if (language === 'cpp') {
    return formatCpp({ code, clangFormatPath });
  }

  return {
    ok: false,
    error: `No external formatter configured for language: ${language}`,
  };
}

module.exports = { formatCode, parseCommandSpec, injectFileArg };
