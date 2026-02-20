'use strict';

const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  // Settings
  getSettings: () => ipcRenderer.invoke('settings:get'),
  setSetting: (key, value) => ipcRenderer.invoke('settings:set', key, value),
  getSetting: (key) => ipcRenderer.invoke('settings:get-key', key),

  // File operations
  readFile: (filePath) => ipcRenderer.invoke('file:read', filePath),
  writeFile: (filePath, content) => ipcRenderer.invoke('file:write', filePath, content),
  openFileDialog: () => ipcRenderer.invoke('file:open-dialog'),
  saveFileDialog: (defaultName) => ipcRenderer.invoke('file:save-dialog', defaultName),
  getRecentFiles: () => ipcRenderer.invoke('file:recent'),
  addRecentFile: (filePath) => ipcRenderer.invoke('file:add-recent', filePath),

  // Environment
  getEnvInfo: () => ipcRenderer.invoke('env:info'),
  openPath: (p) => ipcRenderer.invoke('shell:open-path', p),

  // Code execution
  runCode: (opts) => ipcRenderer.invoke('run:code', opts),
  killProcess: () => ipcRenderer.invoke('run:kill'),
  runTestCases: (opts) => ipcRenderer.invoke('run:test-cases', opts),

  // Bundle management
  detectBundles: () => ipcRenderer.invoke('bundle:detect'),

  // Menu events (main → renderer)
  onMenuEvent: (event, callback) => {
    ipcRenderer.on(`menu:${event}`, callback);
    return () => ipcRenderer.removeListener(`menu:${event}`, callback);
  },

  // File events (main → renderer)
  onFileOpened: (callback) => {
    ipcRenderer.on('file:opened', (_e, data) => callback(data));
    return () => ipcRenderer.removeListener('file:opened', callback);
  },
  onFileSaveAs: (callback) => {
    ipcRenderer.on('file:save-as', (_e, data) => callback(data));
    return () => ipcRenderer.removeListener('file:save-as', callback);
  },
});
