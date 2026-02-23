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
  openFolderDialog: () => ipcRenderer.invoke('file:open-folder-dialog'),
  openSampleFilesDialog: () => ipcRenderer.invoke('file:open-sample-files-dialog'),
  openVsixDialog: () => ipcRenderer.invoke('file:open-vsix-dialog'),
  saveFileDialog: (defaultName) => ipcRenderer.invoke('file:save-dialog', defaultName),
  getRecentFiles: () => ipcRenderer.invoke('file:recent'),
  addRecentFile: (filePath) => ipcRenderer.invoke('file:add-recent', filePath),

  // Environment
  getEnvInfo: () => ipcRenderer.invoke('env:info'),
  getAssetUrl: (relativePath) => ipcRenderer.invoke('app:get-asset-url', relativePath),
  openPath: (p) => ipcRenderer.invoke('shell:open-path', p),
  openExternal: (url) => ipcRenderer.invoke('shell:open-external', url),
  openTerminal: (targetPath) => ipcRenderer.invoke('shell:open-terminal', targetPath),

  // Code execution
  runCode: (opts) => ipcRenderer.invoke('run:code', opts),
  killProcess: () => ipcRenderer.invoke('run:kill'),
  runTestCases: (opts) => ipcRenderer.invoke('run:test-cases', opts),

  // Bundle management
  detectBundles: (overrides) => ipcRenderer.invoke('bundle:detect', overrides),
  resolveBundles: (overrides) => ipcRenderer.invoke('bundle:resolve', overrides),

  // Workspace / Git
  getGitStatus: (targetPath) => ipcRenderer.invoke('git:status', targetPath),
  listWorkspaceTree: (rootPath, options) => ipcRenderer.invoke('workspace:list-tree', rootPath, options),

  // VSCode extension import
  importVSCodeExtensionFolder: (folderPath) => ipcRenderer.invoke('extension:import-folder', folderPath),
  importVSIXFile: (filePath) => ipcRenderer.invoke('extension:import-vsix', filePath),
  getImportedExtensions: () => ipcRenderer.invoke('extension:list-imports'),

  // Formatting + problem fetch + submit
  formatCode: (opts) => ipcRenderer.invoke('format:code', opts),
  fetchProblemSamples: (url) => ipcRenderer.invoke('problem:fetch-samples', url),
  getSubmissionTargets: (opts) => ipcRenderer.invoke('submission:targets', opts),

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
