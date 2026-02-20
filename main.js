'use strict';

const { app, BrowserWindow, ipcMain, dialog, Menu, shell } = require('electron');
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
        cppCompiler: 'g++',
        pythonPath: 'python3',
        autoDetectLanguage: true,
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
    icon: path.join(__dirname, 'assets', 'icons', 'icon.png'),
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

// ─── Code Execution ──────────────────────────────────────────────────────────
const { runCode, killProcess } = require('./src/main/runner');

ipcMain.handle('run:code', async (_e, opts) => {
  return runCode(opts);
});

ipcMain.handle('run:kill', () => killProcess());

ipcMain.handle('run:test-cases', async (_e, opts) => {
  const { runTestCases } = require('./src/main/test-runner');
  return runTestCases(opts);
});

// ─── Bundle Manager ──────────────────────────────────────────────────────────
const { detectBundles } = require('./src/main/bundle-manager');

ipcMain.handle('bundle:detect', async () => detectBundles());

// ─── App Lifecycle ────────────────────────────────────────────────────────────
app.whenReady().then(createWindow);

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) createWindow();
});
