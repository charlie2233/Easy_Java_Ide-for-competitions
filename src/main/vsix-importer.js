'use strict';

const fs = require('fs');
const path = require('path');
const os = require('os');
const AdmZip = require('adm-zip');

const { importVSCodeExtensionFolder } = require('./vscode-importer');

function findExtensionRoot(baseDir) {
  const preferred = path.join(baseDir, 'extension');
  if (fs.existsSync(path.join(preferred, 'package.json'))) {
    return preferred;
  }

  const queue = [{ dir: baseDir, depth: 0 }];
  const maxDepth = 4;

  while (queue.length) {
    const { dir, depth } = queue.shift();
    if (fs.existsSync(path.join(dir, 'package.json'))) return dir;
    if (depth >= maxDepth) continue;

    let entries = [];
    try {
      entries = fs.readdirSync(dir, { withFileTypes: true });
    } catch (_) {
      continue;
    }

    for (const entry of entries) {
      if (!entry.isDirectory()) continue;
      queue.push({ dir: path.join(dir, entry.name), depth: depth + 1 });
    }
  }

  return null;
}

function importVSIXFile(vsixPath) {
  if (!vsixPath || typeof vsixPath !== 'string') {
    return { ok: false, error: 'VSIX path is required.' };
  }
  const absolutePath = path.resolve(vsixPath);
  if (!fs.existsSync(absolutePath)) {
    return { ok: false, error: `VSIX file not found: ${absolutePath}` };
  }
  if (!fs.statSync(absolutePath).isFile()) {
    return { ok: false, error: `Not a VSIX file: ${absolutePath}` };
  }
  if (!absolutePath.toLowerCase().endsWith('.vsix')) {
    return { ok: false, error: 'Expected a .vsix file.' };
  }

  const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'compide-vsix-'));
  try {
    const zip = new AdmZip(absolutePath);
    zip.extractAllTo(tempDir, true);

    const extensionRoot = findExtensionRoot(tempDir);
    if (!extensionRoot) {
      return {
        ok: false,
        error: 'Unable to locate extension package inside VSIX archive.',
      };
    }

    const result = importVSCodeExtensionFolder(extensionRoot);
    if (!result.ok) return result;

    return {
      ...result,
      extension: {
        ...result.extension,
        sourcePath: absolutePath,
        sourceType: 'vsix',
      },
    };
  } catch (err) {
    return {
      ok: false,
      error: `Failed to import VSIX: ${err.message}`,
    };
  } finally {
    fs.rmSync(tempDir, { recursive: true, force: true });
  }
}

module.exports = { importVSIXFile, findExtensionRoot };
