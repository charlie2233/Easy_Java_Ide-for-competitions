'use strict';

const { app, BrowserWindow, ipcMain, dialog, Menu, shell, clipboard } = require('electron');
const { execFile, spawn } = require('child_process');
const path = require('path');
const fs = require('fs');
const os = require('os');
const { pathToFileURL } = require('url');

// Settings store (lazy-loaded to avoid ES module issues)
let store;
async function getStore() {
  if (!store) {
    const { default: Store } = await import('electron-store');
    store = new Store({
      defaults: {
        theme: 'dark',
        fontSize: 14,
        tabSize: 4,
        language: 'java',
        lastFile: null,
        windowBounds: { width: 1400, height: 900 },
        recentFiles: [],
        javaPath: '',
        javacPath: '',
        cppCompiler: '',
        pythonPath: '',
        autoPickBestBundle: true,
        autoDetectLanguage: true,
        usacoMode: false,
        usacoProblem: 'problem',
        usacoUseFileInput: true,
        workspaceRoot: '',
        javaFormatterPath: '',
        clangFormatPath: '',
        submitPlatform: 'codeforces',
        submitCodeforcesContest: '',
        submitCodeforcesProblem: 'A',
        submitUsacoCpid: '',
        setupComplete: false,
        vscodeImports: [],
        showLineNumbers: true,
        wordWrap: false,
        minimap: false,
        formatOnSave: false,
        timeLimitMs: 5000,
        memoryLimitMb: 256,
        sidebarCollapsed: false,
      },
    });
  }
  return store;
}

let mainWindow;
const activeToolchainInstalls = new Map();

function emitToolchainInstallEvent(payload) {
  if (!mainWindow || mainWindow.isDestroyed()) return;
  mainWindow.webContents.send('toolchain:install-event', {
    ts: Date.now(),
    ...payload,
  });
}

function getInstallGuideUrl(language) {
  const lang = String(language || '').toLowerCase();
  const perPlatform = {
    darwin: {
      java: 'https://adoptium.net/',
      cpp: 'https://developer.apple.com/xcode/resources/',
      python: 'https://www.python.org/downloads/macos/',
    },
    win32: {
      java: 'https://adoptium.net/',
      cpp: 'https://code.visualstudio.com/docs/cpp/config-mingw',
      python: 'https://www.python.org/downloads/windows/',
    },
    linux: {
      java: 'https://adoptium.net/',
      cpp: 'https://gcc.gnu.org/install/',
      python: 'https://www.python.org/downloads/source/',
    },
  };
  const platformKey = process.platform === 'darwin'
    ? 'darwin'
    : process.platform === 'win32'
    ? 'win32'
    : 'linux';
  return perPlatform[platformKey]?.[lang] || null;
}

function commandExists(command) {
  const whichCmd = process.platform === 'win32' ? 'where' : 'which';
  return new Promise((resolve) => {
    execFile(whichCmd, [command], (err) => resolve(!err));
  });
}

function runStreamingToolchainInstall({ language, command, args = [], cwd = process.cwd(), shell: useShell = false }) {
  const lang = String(language || '').toLowerCase();
  if (!lang) return Promise.resolve({ ok: false, error: 'Missing language.' });
  if (activeToolchainInstalls.has(lang)) {
    return Promise.resolve({ ok: false, error: `An install is already running for ${lang}.` });
  }

  return new Promise((resolve) => {
    let child;
    try {
      child = spawn(command, args, { cwd, shell: useShell, stdio: ['ignore', 'pipe', 'pipe'] });
    } catch (err) {
      resolve({ ok: false, error: err.message || String(err) });
      return;
    }

    activeToolchainInstalls.set(lang, child);
    emitToolchainInstallEvent({
      language: lang,
      phase: 'start',
      command: [command, ...args].join(' '),
      message: `Started installer: ${command}`,
    });

    child.stdout.on('data', (buf) => {
      emitToolchainInstallEvent({
        language: lang,
        phase: 'stdout',
        text: buf.toString(),
      });
    });

    child.stderr.on('data', (buf) => {
      emitToolchainInstallEvent({
        language: lang,
        phase: 'stderr',
        text: buf.toString(),
      });
    });

    child.on('error', (err) => {
      activeToolchainInstalls.delete(lang);
      emitToolchainInstallEvent({
        language: lang,
        phase: 'error',
        message: err.message || String(err),
      });
      resolve({ ok: false, error: err.message || String(err) });
    });

    child.on('close', (code) => {
      activeToolchainInstalls.delete(lang);
      emitToolchainInstallEvent({
        language: lang,
        phase: 'exit',
        code: Number(code ?? 1),
        ok: Number(code ?? 1) === 0,
        message: Number(code ?? 1) === 0 ? 'Installer finished.' : `Installer exited with code ${code ?? 1}.`,
      });
      resolve({
        ok: Number(code ?? 1) === 0,
        code: Number(code ?? 1),
      });
    });
  });
}

async function startToolchainInstall(language) {
  const lang = String(language || '').toLowerCase();
  if (!['java', 'cpp', 'python'].includes(lang)) {
    return { ok: false, error: `Unsupported language: ${language}` };
  }

  if (process.platform === 'darwin') {
    if (lang === 'cpp') {
      emitToolchainInstallEvent({
        language: lang,
        phase: 'start',
        command: 'xcode-select --install',
        message: 'Requesting Apple Command Line Tools installer dialog…',
      });

      const result = await new Promise((resolve) => {
        execFile('xcode-select', ['--install'], (err, stdout, stderr) => {
          const out = String(stdout || stderr || '').trim();
          const lower = `${out}\n${err?.message || ''}`.toLowerCase();
          if (lower.includes('already installed')) {
            resolve({ ok: true, alreadyInstalled: true, message: out || 'Xcode Command Line Tools are already installed.' });
            return;
          }
          if (err) {
            resolve({ ok: false, error: out || err.message || 'Failed to start installer.' });
            return;
          }
          resolve({ ok: true, message: out || 'Apple installer dialog requested.' });
        });
      });

      emitToolchainInstallEvent({
        language: lang,
        phase: result.ok ? 'info' : 'error',
        message: result.message || result.error || '',
      });
      emitToolchainInstallEvent({
        language: lang,
        phase: 'exit',
        code: result.ok ? 0 : 1,
        ok: !!result.ok,
        message: result.ok ? (result.message || 'Installer requested.') : (result.error || 'Installer failed to start.'),
      });
      return result;
    }

    const hasBrew = await commandExists('brew');
    if (hasBrew) {
      const brewPkg = lang === 'java' ? 'openjdk' : 'python';
      return runStreamingToolchainInstall({
        language: lang,
        command: 'brew',
        args: ['install', brewPkg],
      });
    }

    const url = getInstallGuideUrl(lang);
    if (url) {
      await shell.openExternal(url);
      emitToolchainInstallEvent({
        language: lang,
        phase: 'info',
        message: `Homebrew was not found. Opened download page: ${url}`,
      });
      emitToolchainInstallEvent({
        language: lang,
        phase: 'exit',
        code: 0,
        ok: true,
        message: 'External installer page opened.',
      });
      return { ok: true, openedExternal: true, url };
    }
    return { ok: false, error: 'No install method available for this platform.' };
  }

  if (process.platform === 'win32') {
    const hasWinget = await commandExists('winget');
    if (hasWinget) {
      const wingetId = {
        java: 'EclipseAdoptium.Temurin.17.JDK',
        cpp: 'LLVM.LLVM',
        python: 'Python.Python.3.12',
      }[lang];
      if (wingetId) {
        return runStreamingToolchainInstall({
          language: lang,
          command: 'winget',
          args: ['install', '--id', wingetId, '-e'],
        });
      }
    }

    const url = getInstallGuideUrl(lang);
    if (url) {
      await shell.openExternal(url);
      emitToolchainInstallEvent({
        language: lang,
        phase: 'info',
        message: `winget was not available. Opened install guide: ${url}`,
      });
      emitToolchainInstallEvent({
        language: lang,
        phase: 'exit',
        code: 0,
        ok: true,
        message: 'External installer guide opened.',
      });
      return { ok: true, openedExternal: true, url };
    }
    return { ok: false, error: 'No install method available for this platform.' };
  }

  const url = getInstallGuideUrl(lang);
  if (url) {
    await shell.openExternal(url);
    emitToolchainInstallEvent({
      language: lang,
      phase: 'info',
      message: `Opened install guide: ${url}`,
    });
    emitToolchainInstallEvent({
      language: lang,
      phase: 'exit',
      code: 0,
      ok: true,
      message: 'External installer guide opened.',
    });
    return { ok: true, openedExternal: true, url };
  }

  return { ok: false, error: 'No install method available for this platform.' };
}

async function createWindow() {
  const s = await getStore();
  const bounds = s.get('windowBounds');
  const iconPath = path.join(__dirname, 'assets', 'icons', 'icon.png');

  mainWindow = new BrowserWindow({
    width: bounds.width,
    height: bounds.height,
    minWidth: 900,
    minHeight: 600,
    titleBarStyle: process.platform === 'darwin' ? 'hiddenInset' : 'default',
    backgroundColor: '#1e1e1e',
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: false,
    },
    icon: fs.existsSync(iconPath) ? iconPath : undefined,
    show: false,
  });

  mainWindow.loadFile(path.join(__dirname, 'src', 'renderer', 'index.html'));

  mainWindow.once('ready-to-show', () => {
    mainWindow.show();
  });

  mainWindow.on('resize', async () => {
    const [width, height] = mainWindow.getSize();
    (await getStore()).set('windowBounds', { width, height });
  });

  buildMenu();
}

function buildMenu() {
  const isMac = process.platform === 'darwin';
  const template = [
    ...(isMac ? [{ role: 'appMenu' }] : []),
    {
      label: 'File',
      submenu: [
        { label: 'New File', accelerator: 'CmdOrCtrl+N', click: () => mainWindow.webContents.send('menu:new-file') },
        { label: 'Open File…', accelerator: 'CmdOrCtrl+O', click: openFile },
        { label: 'Save', accelerator: 'CmdOrCtrl+S', click: () => mainWindow.webContents.send('menu:save') },
        { label: 'Save As…', accelerator: 'CmdOrCtrl+Shift+S', click: saveAs },
        { type: 'separator' },
        isMac ? { role: 'close' } : { role: 'quit' },
      ],
    },
    {
      label: 'Edit',
      submenu: [
        { role: 'undo' }, { role: 'redo' }, { type: 'separator' },
        { role: 'cut' }, { role: 'copy' }, { role: 'paste' }, { role: 'selectAll' },
      ],
    },
    {
      label: 'Run',
      submenu: [
        { label: 'Run Code', accelerator: 'CmdOrCtrl+Return', click: () => mainWindow.webContents.send('menu:run') },
        { label: 'Run with Custom Input', accelerator: 'CmdOrCtrl+Shift+Return', click: () => mainWindow.webContents.send('menu:run-input') },
        { label: 'Run All Tests', accelerator: 'CmdOrCtrl+T', click: () => mainWindow.webContents.send('menu:run-tests') },
        { type: 'separator' },
        { label: 'Stop', accelerator: 'CmdOrCtrl+.', click: () => mainWindow.webContents.send('menu:stop') },
      ],
    },
    {
      label: 'View',
      submenu: [
        { label: 'Toggle Theme', click: () => mainWindow.webContents.send('menu:toggle-theme') },
        { label: 'Toggle Sidebar', accelerator: 'CmdOrCtrl+B', click: () => mainWindow.webContents.send('menu:toggle-sidebar') },
        { label: 'Toggle Terminal', accelerator: 'CmdOrCtrl+`', click: () => mainWindow.webContents.send('menu:toggle-terminal') },
        { label: 'Toggle Test Panel', accelerator: 'CmdOrCtrl+Shift+T', click: () => mainWindow.webContents.send('menu:toggle-tests') },
        { type: 'separator' },
        { role: 'toggleDevTools' },
        { role: 'reload' },
      ],
    },
    {
      label: 'Tools',
      submenu: [
        { label: 'Settings', accelerator: 'CmdOrCtrl+,', click: () => mainWindow.webContents.send('menu:settings') },
        { label: 'Language Bundle Status', click: () => mainWindow.webContents.send('menu:bundle-status') },
        { label: 'Import VSCode Extension Folder…', click: () => mainWindow.webContents.send('menu:import-vscode-ext') },
        { label: 'Import VSIX…', click: () => mainWindow.webContents.send('menu:import-vscode-vsix') },
        { type: 'separator' },
        { label: 'Open Project Folder…', click: () => mainWindow.webContents.send('menu:open-project-folder') },
        { label: 'Insert Template…', click: () => mainWindow.webContents.send('menu:template') },
      ],
    },
    { role: 'windowMenu' },
    {
      role: 'help',
      submenu: [
        { label: 'GitHub Repository', click: () => shell.openExternal('https://github.com/charlie2233/Easy_Java_Ide-for-competitions') },
        { label: 'USACO Guide', click: () => shell.openExternal('https://usaco.guide') },
      ],
    },
  ];

  Menu.setApplicationMenu(Menu.buildFromTemplate(template));
}

async function openFile() {
  const result = await dialog.showOpenDialog(mainWindow, {
    properties: ['openFile'],
    filters: [
      { name: 'Code Files', extensions: ['java', 'cpp', 'cc', 'c', 'py'] },
      { name: 'All Files', extensions: ['*'] },
    ],
  });
  if (!result.canceled && result.filePaths.length > 0) {
    const filePath = result.filePaths[0];
    const content = fs.readFileSync(filePath, 'utf-8');
    mainWindow.webContents.send('file:opened', { filePath, content });
    addRecentFile(filePath);
  }
}

async function saveAs() {
  const result = await dialog.showSaveDialog(mainWindow, {
    filters: [
      { name: 'Java', extensions: ['java'] },
      { name: 'C++', extensions: ['cpp', 'cc'] },
      { name: 'Python', extensions: ['py'] },
      { name: 'All Files', extensions: ['*'] },
    ],
  });
  if (!result.canceled) {
    mainWindow.webContents.send('file:save-as', { filePath: result.filePath });
  }
}

async function addRecentFile(filePath) {
  const s = await getStore();
  let recents = s.get('recentFiles') || [];
  recents = [filePath, ...recents.filter(f => f !== filePath)].slice(0, 10);
  s.set('recentFiles', recents);
}

// ─── IPC Handlers ────────────────────────────────────────────────────────────

ipcMain.handle('settings:get', async () => (await getStore()).store);
ipcMain.handle('settings:set', async (_e, key, value) => (await getStore()).set(key, value));
ipcMain.handle('settings:get-key', async (_e, key) => (await getStore()).get(key));

ipcMain.handle('file:read', (_e, filePath) => {
  try { return { ok: true, content: fs.readFileSync(filePath, 'utf-8') }; }
  catch (err) { return { ok: false, error: err.message }; }
});

ipcMain.handle('file:write', (_e, filePath, content) => {
  try {
    fs.mkdirSync(path.dirname(filePath), { recursive: true });
    fs.writeFileSync(filePath, content, 'utf-8');
    return { ok: true };
  } catch (err) { return { ok: false, error: err.message }; }
});

ipcMain.handle('file:open-dialog', async () => {
  const result = await dialog.showOpenDialog(mainWindow, {
    properties: ['openFile'],
    filters: [
      { name: 'Code Files', extensions: ['java', 'cpp', 'cc', 'c', 'py'] },
      { name: 'All Files', extensions: ['*'] },
    ],
  });
  return result;
});

ipcMain.handle('file:open-folder-dialog', async () => {
  const result = await dialog.showOpenDialog(mainWindow, {
    properties: ['openDirectory'],
  });
  return result;
});

ipcMain.handle('file:open-sample-files-dialog', async () => {
  const result = await dialog.showOpenDialog(mainWindow, {
    properties: ['openFile', 'multiSelections'],
    filters: [
      { name: 'Sample Files', extensions: ['in', 'out', 'txt', 'ans', 'input', 'output'] },
      { name: 'All Files', extensions: ['*'] },
    ],
  });
  return result;
});

ipcMain.handle('file:open-vsix-dialog', async () => {
  const result = await dialog.showOpenDialog(mainWindow, {
    properties: ['openFile'],
    filters: [
      { name: 'VSCode Extension', extensions: ['vsix'] },
      { name: 'All Files', extensions: ['*'] },
    ],
  });
  return result;
});

ipcMain.handle('file:save-dialog', async (_e, defaultName) => {
  const result = await dialog.showSaveDialog(mainWindow, {
    defaultPath: defaultName,
    filters: [
      { name: 'Java', extensions: ['java'] },
      { name: 'C++', extensions: ['cpp', 'cc'] },
      { name: 'Python', extensions: ['py'] },
      { name: 'All Files', extensions: ['*'] },
    ],
  });
  return result;
});

ipcMain.handle('file:recent', async () => (await getStore()).get('recentFiles') || []);
ipcMain.handle('file:add-recent', async (_e, filePath) => addRecentFile(filePath));

ipcMain.handle('env:info', () => ({
  platform: process.platform,
  arch: process.arch,
  homedir: os.homedir(),
  tmpdir: os.tmpdir(),
}));

ipcMain.handle('app:get-asset-url', (_e, relativePath) => {
  try {
    if (typeof relativePath !== 'string' || !relativePath) return null;
    const appRoot = path.resolve(__dirname);
    const target = path.resolve(appRoot, relativePath);
    if (target !== appRoot && !target.startsWith(`${appRoot}${path.sep}`)) return null;
    if (!fs.existsSync(target)) return null;
    return pathToFileURL(target).toString();
  } catch (_) {
    return null;
  }
});

ipcMain.handle('clipboard:write-text', (_e, text) => {
  try {
    clipboard.writeText(String(text ?? ''));
    return { ok: true };
  } catch (err) {
    return { ok: false, error: err.message };
  }
});

ipcMain.handle('toolchain:install-xcode-clt', async () => {
  if (process.platform !== 'darwin') {
    return { ok: false, error: 'Xcode Command Line Tools installer is only available on macOS.' };
  }
  return startToolchainInstall('cpp');
});

ipcMain.handle('toolchain:install-bundle', async (_e, opts = {}) => {
  return startToolchainInstall(opts.language);
});

ipcMain.handle('toolchain:get-install-guide-url', async (_e, language) => {
  return getInstallGuideUrl(language);
});

ipcMain.handle('shell:open-path', (_e, p) => shell.openPath(p));
ipcMain.handle('shell:open-external', (_e, url) => shell.openExternal(url));

function spawnDetached(command, args, options = {}) {
  try {
    const child = spawn(command, args, { detached: true, stdio: 'ignore', ...options });
    child.unref();
    return { ok: true };
  } catch (err) {
    return { ok: false, error: err.message };
  }
}

async function openSystemTerminal(targetPath) {
  const cwd = getWorkspaceDir(targetPath);

  if (process.platform === 'darwin') {
    return new Promise((resolve) => {
      execFile('open', ['-a', 'Terminal', cwd], (err) => {
        if (err) {
          resolve({ ok: false, error: err.message, cwd });
          return;
        }
        resolve({ ok: true, cwd });
      });
    });
  }

  if (process.platform === 'win32') {
    const result = spawnDetached('cmd.exe', ['/c', 'start', 'CompIDE Terminal', 'cmd.exe', '/K', `cd /d "${cwd}"`], {
      cwd,
      shell: true,
    });
    return { ...result, cwd };
  }

  const linuxCandidates = [
    ['x-terminal-emulator', ['--working-directory', cwd]],
    ['gnome-terminal', ['--working-directory', cwd]],
    ['konsole', ['--workdir', cwd]],
    ['xfce4-terminal', ['--working-directory', cwd]],
    ['alacritty', ['--working-directory', cwd]],
    ['kitty', ['--directory', cwd]],
  ];

  for (const [cmd, args] of linuxCandidates) {
    const result = spawnDetached(cmd, args, { cwd });
    if (result.ok) return { ok: true, cwd };
  }

  return {
    ok: false,
    cwd,
    error: 'No supported terminal executable found',
  };
}

ipcMain.handle('shell:open-terminal', async (_e, targetPath) => {
  return openSystemTerminal(targetPath);
});

// ─── Code Execution ──────────────────────────────────────────────────────────
const { runCode, killProcess } = require('./src/main/runner');
const { detectBundles, resolveToolchain } = require('./src/main/bundle-manager');
const { importVSCodeExtensionFolder } = require('./src/main/vscode-importer');
const { importVSIXFile } = require('./src/main/vsix-importer');
const { listWorkspaceTree } = require('./src/main/workspace-manager');
const { formatCode } = require('./src/main/formatter');
const { fetchProblemSamples } = require('./src/main/problem-fetcher');
const { buildSubmissionTargets } = require('./src/main/submission-helper');

function execInCwd(cmd, args, cwd) {
  return new Promise((resolve) => {
    execFile(cmd, args, { cwd }, (err, stdout, stderr) => {
      resolve({
        ok: !err,
        stdout: stdout || '',
        stderr: stderr || '',
        code: err ? (err.code ?? 1) : 0,
      });
    });
  });
}

function getWorkspaceDir(targetPath) {
  if (!targetPath) return process.cwd();
  try {
    const stats = fs.statSync(targetPath);
    return stats.isDirectory() ? targetPath : path.dirname(targetPath);
  } catch (_) {
    return process.cwd();
  }
}

async function getGitStatus(targetPath) {
  const workspace = getWorkspaceDir(targetPath);
  const rootRes = await execInCwd('git', ['rev-parse', '--show-toplevel'], workspace);
  if (!rootRes.ok) {
    return { inRepo: false, workspace };
  }

  const root = rootRes.stdout.trim();
  const [branchRes, statusRes, remoteRes] = await Promise.all([
    execInCwd('git', ['rev-parse', '--abbrev-ref', 'HEAD'], root),
    execInCwd('git', ['status', '--porcelain'], root),
    execInCwd('git', ['remote', 'get-url', 'origin'], root),
  ]);

  const dirtyCount = statusRes.stdout.trim()
    ? statusRes.stdout.trim().split(/\r?\n/).length
    : 0;

  return {
    inRepo: true,
    workspace,
    root,
    branch: branchRes.ok ? branchRes.stdout.trim() : '(unknown)',
    dirtyCount,
    remoteUrl: remoteRes.ok ? remoteRes.stdout.trim() : null,
  };
}

async function currentRuntimeSettings(overrides = {}) {
  const s = await getStore();
  return {
    javaPath: s.get('javaPath') || '',
    javacPath: s.get('javacPath') || '',
    cppCompiler: s.get('cppCompiler') || '',
    pythonPath: s.get('pythonPath') || '',
    autoPickBestBundle: s.get('autoPickBestBundle') !== false,
    ...overrides,
  };
}

async function saveImportedExtensionMeta(extension, snippetCount) {
  const s = await getStore();
  const current = s.get('vscodeImports') || [];
  const normalized = {
    name: extension.name || '',
    displayName: extension.displayName || extension.name || '',
    version: extension.version || 'unknown',
    publisher: extension.publisher || '',
    sourcePath: extension.sourcePath || '',
    sourceType: extension.sourceType || 'folder',
    snippetCount: Number(snippetCount || 0),
    importedAt: Date.now(),
  };
  const withoutDupes = current.filter((item) => item.sourcePath !== normalized.sourcePath);
  s.set('vscodeImports', [normalized, ...withoutDupes].slice(0, 30));
}

function missingBundleResult(language, bundle) {
  return {
    stdout: '',
    stderr: `${language.toUpperCase()} toolchain is not ready (${bundle?.status || 'unknown'}). ${bundle?.installHint || ''}`.trim(),
    exitCode: 1,
    compileError: true,
    timedOut: false,
    timeMs: 0,
  };
}

async function buildRunOptions(opts = {}) {
  const s = await getStore();
  const runtimeSettings = await currentRuntimeSettings(opts.runtimeSettings || {});
  const resolved = await resolveToolchain(runtimeSettings);
  return {
    ...opts,
    timeLimitMs: opts.timeLimitMs || s.get('timeLimitMs') || 5000,
    memoryLimitMb: opts.memoryLimitMb || s.get('memoryLimitMb') || 256,
    usacoMode: typeof opts.usacoMode === 'boolean' ? opts.usacoMode : !!s.get('usacoMode'),
    usacoProblem: opts.usacoProblem || s.get('usacoProblem') || 'problem',
    usacoUseFileInput: typeof opts.usacoUseFileInput === 'boolean'
      ? opts.usacoUseFileInput
      : s.get('usacoUseFileInput') !== false,
    toolchain: resolved.best,
    bundleInfo: resolved.bundles,
  };
}

ipcMain.handle('run:code', async (_e, opts) => {
  const runOpts = await buildRunOptions(opts || {});
  const bundle = runOpts.bundleInfo?.[runOpts.language];
  if (!bundle?.available) {
    return missingBundleResult(runOpts.language || 'language', bundle);
  }
  return runCode(runOpts);
});

ipcMain.handle('run:kill', () => killProcess());

ipcMain.handle('run:test-cases', async (_e, opts) => {
  const { runTestCases } = require('./src/main/test-runner');
  const runOpts = await buildRunOptions(opts || {});
  const bundle = runOpts.bundleInfo?.[runOpts.language];
  if (!bundle?.available) {
    const failed = missingBundleResult(runOpts.language || 'language', bundle);
    const testCases = Array.isArray(runOpts.testCases) ? runOpts.testCases : [];
    return testCases.map((tc) => ({
      name: tc.name || 'Test',
      passed: false,
      input: tc.input || '',
      expectedOutput: tc.expectedOutput || '',
      actualOutput: '',
      stderr: failed.stderr,
      timeMs: 0,
      timedOut: false,
      compileError: true,
      exitCode: 1,
    }));
  }
  return runTestCases(runOpts);
});

// ─── Bundle Manager ──────────────────────────────────────────────────────────
ipcMain.handle('bundle:detect', async (_e, overrides = {}) => {
  const runtimeSettings = await currentRuntimeSettings(overrides);
  return detectBundles(runtimeSettings);
});

ipcMain.handle('bundle:resolve', async (_e, overrides = {}) => {
  const runtimeSettings = await currentRuntimeSettings(overrides);
  return resolveToolchain(runtimeSettings);
});

// ─── Workspace + VSCode Import ───────────────────────────────────────────────
ipcMain.handle('git:status', async (_e, targetPath) => getGitStatus(targetPath));

ipcMain.handle('workspace:list-tree', async (_e, rootPath, options = {}) => {
  return listWorkspaceTree(rootPath, options);
});

ipcMain.handle('extension:import-folder', async (_e, folderPath) => {
  const result = importVSCodeExtensionFolder(folderPath);
  if (!result.ok) return result;
  await saveImportedExtensionMeta(result.extension, result.snippetCount);
  return result;
});

ipcMain.handle('extension:import-vsix', async (_e, filePath) => {
  const result = importVSIXFile(filePath);
  if (!result.ok) return result;
  await saveImportedExtensionMeta(result.extension, result.snippetCount);
  return result;
});

ipcMain.handle('extension:list-imports', async () => {
  return (await getStore()).get('vscodeImports') || [];
});

ipcMain.handle('format:code', async (_e, opts = {}) => {
  const s = await getStore();
  return formatCode({
    language: opts.language,
    code: opts.code,
    javaFormatterPath: opts.javaFormatterPath || s.get('javaFormatterPath') || '',
    clangFormatPath: opts.clangFormatPath || s.get('clangFormatPath') || '',
  });
});

ipcMain.handle('problem:fetch-samples', async (_e, url) => {
  return fetchProblemSamples(url);
});

ipcMain.handle('submission:targets', async (_e, opts = {}) => {
  return buildSubmissionTargets(opts);
});

// ─── App Lifecycle ────────────────────────────────────────────────────────────
app.whenReady().then(createWindow);

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) createWindow();
});
