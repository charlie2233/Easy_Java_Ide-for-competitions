'use strict';

const fs = require('fs');
const path = require('path');

const SUPPORTED_LANGUAGES = new Set(['java', 'cpp', 'python']);

function readJson(filePath) {
  return JSON.parse(fs.readFileSync(filePath, 'utf-8'));
}

function mapLanguage(language) {
  if (!language) return null;
  const value = language.toString().trim().toLowerCase();
  const alias = {
    c: 'cpp',
    'c++': 'cpp',
    cpp: 'cpp',
    'objective-cpp': 'cpp',
    java: 'java',
    py: 'python',
    python: 'python',
    python3: 'python',
  };
  return alias[value] || null;
}

function resolveLanguageList(value) {
  if (!value) return [];
  const list = Array.isArray(value) ? value : value.toString().split(',');
  return list
    .map((item) => mapLanguage(item))
    .filter((item) => item && SUPPORTED_LANGUAGES.has(item));
}

function normalizeSnippetBody(body) {
  if (Array.isArray(body)) return body.join('\n');
  if (typeof body === 'string') return body;
  return '';
}

function normalizePrefix(prefix, fallbackName) {
  if (Array.isArray(prefix)) return prefix.map((item) => item.toString()).filter(Boolean);
  if (typeof prefix === 'string' && prefix.trim()) return [prefix.trim()];
  if (fallbackName) return [fallbackName];
  return [];
}

function collectSnippetsFromFile(filePath, defaultLanguages = []) {
  if (!fs.existsSync(filePath)) return [];
  const raw = readJson(filePath);
  const snippets = [];

  for (const [name, snippet] of Object.entries(raw || {})) {
    if (!snippet || typeof snippet !== 'object') continue;
    const body = normalizeSnippetBody(snippet.body);
    if (!body) continue;

    const languages = resolveLanguageList(snippet.scope);
    const finalLanguages = languages.length ? languages : defaultLanguages;
    if (!finalLanguages.length) continue;

    snippets.push({
      name,
      description: snippet.description || '',
      prefixes: normalizePrefix(snippet.prefix, name),
      body,
      languages: finalLanguages,
    });
  }

  return snippets;
}

function mergeSnippetBuckets(base, snippets) {
  for (const snippet of snippets) {
    for (const language of snippet.languages) {
      if (!base[language]) continue;
      for (const prefix of snippet.prefixes) {
        base[language].push({
          name: snippet.name,
          prefix,
          body: snippet.body,
          description: snippet.description,
        });
      }
    }
  }
}

function dedupeSnippets(snippets) {
  const seen = new Set();
  return snippets.filter((snippet) => {
    const key = `${snippet.prefix}|${snippet.body}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

function discoverFallbackSnippetFiles(folderPath) {
  const results = [];
  const snippetDir = path.join(folderPath, 'snippets');
  if (fs.existsSync(snippetDir) && fs.statSync(snippetDir).isDirectory()) {
    for (const entry of fs.readdirSync(snippetDir)) {
      if (entry.endsWith('.json') || entry.endsWith('.code-snippets')) {
        results.push(path.join(snippetDir, entry));
      }
    }
  }
  return results;
}

function inferLanguagesFromFilename(filePath) {
  const base = path.basename(filePath).toLowerCase();
  if (base.includes('java')) return ['java'];
  if (base.includes('cpp') || base.includes('c++') || base.includes('cxx')) return ['cpp'];
  if (base.includes('python') || base.includes('py')) return ['python'];
  return [];
}

function importVSCodeExtensionFolder(folderPath) {
  if (!folderPath || !fs.existsSync(folderPath) || !fs.statSync(folderPath).isDirectory()) {
    return { ok: false, error: `Extension folder not found: ${folderPath}` };
  }

  const snippetsByLanguage = { java: [], cpp: [], python: [] };
  const packagePath = path.join(folderPath, 'package.json');
  let pkg = null;

  if (fs.existsSync(packagePath)) {
    try {
      pkg = readJson(packagePath);
    } catch (err) {
      return { ok: false, error: `Failed to parse package.json: ${err.message}` };
    }
  }

  const contributed = pkg?.contributes?.snippets;
  if (Array.isArray(contributed) && contributed.length > 0) {
    for (const entry of contributed) {
      const rel = entry?.path;
      if (!rel || typeof rel !== 'string') continue;
      const snippetPath = path.resolve(folderPath, rel);
      const defaultLanguages = resolveLanguageList(entry.language);
      const snippets = collectSnippetsFromFile(snippetPath, defaultLanguages);
      mergeSnippetBuckets(snippetsByLanguage, snippets);
    }
  } else {
    // Fallback for unpacked snippet collections without contributes.snippets metadata.
    const fallbackFiles = discoverFallbackSnippetFiles(folderPath);
    for (const snippetPath of fallbackFiles) {
      const snippets = collectSnippetsFromFile(snippetPath, inferLanguagesFromFilename(snippetPath));
      mergeSnippetBuckets(snippetsByLanguage, snippets);
    }
  }

  for (const lang of Object.keys(snippetsByLanguage)) {
    snippetsByLanguage[lang] = dedupeSnippets(snippetsByLanguage[lang]);
  }

  const snippetCount = Object.values(snippetsByLanguage).reduce((sum, list) => sum + list.length, 0);
  if (!snippetCount) {
    return {
      ok: false,
      error: 'No Java/C++/Python snippets found in this extension folder.',
    };
  }

  return {
    ok: true,
    extension: {
      name: pkg?.name || path.basename(folderPath),
      displayName: pkg?.displayName || pkg?.name || path.basename(folderPath),
      version: pkg?.version || 'unknown',
      publisher: pkg?.publisher || '',
      sourcePath: folderPath,
    },
    snippetsByLanguage,
    snippetCount,
  };
}

module.exports = { importVSCodeExtensionFolder };
