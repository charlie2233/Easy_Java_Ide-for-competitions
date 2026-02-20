'use strict';

const { app, BrowserWindow, ipcMain, dialog, Menu, shell } = require('electron');
const { execFile } = require('child_process');
const path = require('path');
const fs = require('fs');
const os = require('os');

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
        vscodeImports: [],
        showLineNumbers: true,
        wordWrap: false,
        minimap: false,
        formatOnSave: false,
        timeLimitMs: 5000,
        memoryLimitMb: 256,
      },
    });
  }
  return store;
}

let mainWindow;

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

ipcMain.handle('shell:open-path', (_e, p) => shell.openPath(p));
ipcMain.handle('shell:open-external', (_e, url) => shell.openExternal(url));

// ─── Code Execution ──────────────────────────────────────────────────────────
const { runCode, killProcess } = require('./src/main/runner');
const { detectBundles, resolveToolchain } = require('./src/main/bundle-manager');
const { importVSCodeExtensionFolder } = require('./src/main/vscode-importer');

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

ipcMain.handle('extension:import-folder', async (_e, folderPath) => {
  const result = importVSCodeExtensionFolder(folderPath);
  if (!result.ok) return result;

  const s = await getStore();
  const current = s.get('vscodeImports') || [];
  const withoutDupes = current.filter((item) => item.sourcePath !== result.extension.sourcePath);
  s.set('vscodeImports', [result.extension, ...withoutDupes].slice(0, 20));
  return result;
});

// ─── App Lifecycle ────────────────────────────────────────────────────────────
app.whenReady().then(createWindow);

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) createWindow();
});
