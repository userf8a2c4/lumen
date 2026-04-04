const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('lumen', {
  policies: {
    getAll: () => ipcRenderer.invoke('policies:getAll'),
    getById: (id) => ipcRenderer.invoke('policies:getById', id),
    create: (data) => ipcRenderer.invoke('policies:create', data),
    update: (id, data) => ipcRenderer.invoke('policies:update', id, data),
    delete: (id) => ipcRenderer.invoke('policies:delete', id),
    search: (query, department) => ipcRenderer.invoke('policies:search', query, department),
    getDepartments: () => ipcRenderer.invoke('policies:getDepartments'),
  },
  contacts: {
    getAll: () => ipcRenderer.invoke('contacts:getAll'),
    create: (data) => ipcRenderer.invoke('contacts:create', data),
    update: (id, data) => ipcRenderer.invoke('contacts:update', id, data),
    delete: (id) => ipcRenderer.invoke('contacts:delete', id),
    search: (query) => ipcRenderer.invoke('contacts:search', query),
  },
  examples: {
    getByPolicy: (policyId) => ipcRenderer.invoke('examples:getByPolicy', policyId),
    create: (data) => ipcRenderer.invoke('examples:create', data),
    delete: (id) => ipcRenderer.invoke('examples:delete', id),
  },
  notes: {
    getAll: () => ipcRenderer.invoke('notes:getAll'),
    getById: (id) => ipcRenderer.invoke('notes:getById', id),
    create: (data) => ipcRenderer.invoke('notes:create', data),
    update: (id, data) => ipcRenderer.invoke('notes:update', id, data),
    delete: (id) => ipcRenderer.invoke('notes:delete', id),
    search: (query) => ipcRenderer.invoke('notes:search', query),
    saveAttachment: (fileName, buffer) => ipcRenderer.invoke('notes:saveAttachment', fileName, buffer),
  },
  settings: {
    getApiKey: () => ipcRenderer.invoke('settings:getApiKey'),
    setApiKey: (key) => ipcRenderer.invoke('settings:setApiKey', key),
    getModel: () => ipcRenderer.invoke('settings:getModel'),
    setModel: (model) => ipcRenderer.invoke('settings:setModel', model),
    getTheme: () => ipcRenderer.invoke('settings:getTheme'),
    setTheme: (theme) => ipcRenderer.invoke('settings:setTheme', theme),
  },
  scraper: {
    fetchUrl: (url) => ipcRenderer.invoke('scraper:fetchUrl', url),
  },
  ai: {
    analyze: (caseDescription) => ipcRenderer.invoke('ai:analyze', caseDescription),
    generateEmail: (context) => ipcRenderer.invoke('ai:generateEmail', context),
  },
  updater: {
    check: () => ipcRenderer.invoke('updater:check'),
    download: () => ipcRenderer.invoke('updater:download'),
    install: () => ipcRenderer.invoke('updater:install'),
    reportError: (description) => ipcRenderer.invoke('updater:reportError', description),
    onUpdateAvailable: (callback) => {
      ipcRenderer.on('update-available', (_e, info) => callback(info));
    },
    onUpdateNotAvailable: (callback) => {
      ipcRenderer.on('update-not-available', () => callback());
    },
    onUpdateDownloaded: (callback) => {
      ipcRenderer.on('update-downloaded', (_e, info) => callback(info));
    },
    onDownloadProgress: (callback) => {
      ipcRenderer.on('download-progress', (_e, info) => callback(info));
    },
    onUpdateError: (callback) => {
      ipcRenderer.on('update-error', (_e, err) => callback(err));
    },
  },
  app: {
    getVersion: () => ipcRenderer.invoke('app:getVersion'),
  },
});
