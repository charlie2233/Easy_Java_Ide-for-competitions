'use strict';

const fs = require('fs');
const path = require('path');

const DEFAULT_IGNORED_DIRS = new Set([
  '.git',
  '.idea',
  '.vscode',
  'node_modules',
  'dist',
  'build',
  '.next',
  '.turbo',
  'out',
  'target',
  '.DS_Store',
]);

function isHidden(name) {
  return name.startsWith('.');
}

function shouldIgnoreName(name, options = {}) {
  const ignoreHidden = options.ignoreHidden !== false;
  if (DEFAULT_IGNORED_DIRS.has(name)) return true;
  if (ignoreHidden && isHidden(name)) return true;
  return false;
}

function safeReadDir(dirPath) {
  try {
    return fs.readdirSync(dirPath, { withFileTypes: true });
  } catch (_) {
    return [];
  }
}

function sortEntries(entries) {
  return entries.sort((a, b) => {
    if (a.isDirectory() !== b.isDirectory()) return a.isDirectory() ? -1 : 1;
    return a.name.localeCompare(b.name);
  });
}

function listWorkspaceTree(rootPath, options = {}) {
  if (!rootPath || typeof rootPath !== 'string') {
    return { ok: false, error: 'workspace root is required' };
  }

  const resolvedRoot = path.resolve(rootPath);
  if (!fs.existsSync(resolvedRoot)) {
    return { ok: false, error: `Workspace root not found: ${resolvedRoot}` };
  }

  const rootStats = fs.statSync(resolvedRoot);
  if (!rootStats.isDirectory()) {
    return { ok: false, error: `Workspace root is not a directory: ${resolvedRoot}` };
  }

  const maxDepth = Math.max(1, Number(options.maxDepth || 6));
  const maxNodes = Math.max(100, Number(options.maxNodes || 2500));
  const includeFiles = options.includeFiles !== false;

  let totalNodes = 0;
  let truncated = false;

  function walk(currentPath, depth) {
    if (totalNodes >= maxNodes) {
      truncated = true;
      return null;
    }

    let stat;
    try {
      stat = fs.lstatSync(currentPath);
    } catch (_) {
      return null;
    }

    if (stat.isSymbolicLink()) return null;

    const name = path.basename(currentPath);

    if (stat.isDirectory()) {
      const node = {
        type: 'dir',
        name,
        path: currentPath,
        children: [],
      };
      totalNodes++;

      if (depth >= maxDepth) return node;

      const entries = sortEntries(safeReadDir(currentPath));
      for (const entry of entries) {
        if (shouldIgnoreName(entry.name, options)) continue;
        const childPath = path.join(currentPath, entry.name);

        if (entry.isDirectory()) {
          const child = walk(childPath, depth + 1);
          if (child) node.children.push(child);
        } else if (includeFiles && entry.isFile()) {
          if (totalNodes >= maxNodes) {
            truncated = true;
            break;
          }
          node.children.push({
            type: 'file',
            name: entry.name,
            path: childPath,
          });
          totalNodes++;
        }

        if (truncated) break;
      }

      return node;
    }

    if (!includeFiles || !stat.isFile()) return null;
    totalNodes++;
    return {
      type: 'file',
      name,
      path: currentPath,
    };
  }

  const tree = walk(resolvedRoot, 0);
  return {
    ok: true,
    rootPath: resolvedRoot,
    tree,
    totalNodes,
    truncated,
  };
}

module.exports = { listWorkspaceTree };
