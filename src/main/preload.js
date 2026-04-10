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
    getUserEmail: () => ipcRenderer.invoke('settings:getUserEmail'),
    setUserEmail: (email) => ipcRenderer.invoke('settings:setUserEmail', email),
    getCseId: () => ipcRenderer.invoke('settings:getCseId'),
    setCseId: (id) => ipcRenderer.invoke('settings:setCseId', id),
    getAccentColor: () => ipcRenderer.invoke('settings:getAccentColor'),
    setAccentColor: (color) => ipcRenderer.invoke('settings:setAccentColor', color),
  },
  scraper: {
    fetchUrl: (url) => ipcRenderer.invoke('scraper:fetchUrl', url),
  },
  ai: {
    analyze: (caseDescription, options) => ipcRenderer.invoke('ai:analyze', caseDescription, options),
    generateEmail: (context, options) => ipcRenderer.invoke('ai:generateEmail', context, options),
  },
  updater: {
    check: () => ipcRenderer.invoke('updater:check'),
    download: () => ipcRenderer.invoke('updater:download'),
    install: () => ipcRenderer.invoke('updater:install'),
    onUpdateAvailable: (callback) => {
      const handler = (_e, info) => callback(info);
      ipcRenderer.on('update-available', handler);
      return () => ipcRenderer.removeListener('update-available', handler);
    },
    onUpdateNotAvailable: (callback) => {
      const handler = () => callback();
      ipcRenderer.on('update-not-available', handler);
      return () => ipcRenderer.removeListener('update-not-available', handler);
    },
    onUpdateDownloaded: (callback) => {
      const handler = (_e, info) => callback(info);
      ipcRenderer.on('update-downloaded', handler);
      return () => ipcRenderer.removeListener('update-downloaded', handler);
    },
    onDownloadProgress: (callback) => {
      const handler = (_e, info) => callback(info);
      ipcRenderer.on('download-progress', handler);
      return () => ipcRenderer.removeListener('download-progress', handler);
    },
    onUpdateError: (callback) => {
      const handler = (_e, err) => callback(err);
      ipcRenderer.on('update-error', handler);
      return () => ipcRenderer.removeListener('update-error', handler);
    },
  },
  app: {
    getVersion: () => ipcRenderer.invoke('app:getVersion'),
    quit: () => ipcRenderer.invoke('app:quit'),
  },
});
