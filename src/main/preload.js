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
    getAccentColor:         () => ipcRenderer.invoke('settings:getAccentColor'),
    setAccentColor:         (color) => ipcRenderer.invoke('settings:setAccentColor', color),
    getSectionLabels:       () => ipcRenderer.invoke('settings:getSectionLabels'),
    setSectionLabels:       (json) => ipcRenderer.invoke('settings:setSectionLabels', json),
    getAppearanceSettings:  () => ipcRenderer.invoke('settings:getAppearanceSettings'),
    setAppearanceSettings:  (json) => ipcRenderer.invoke('settings:setAppearanceSettings', json),
  },
  logic: {
    getAll:       ()         => ipcRenderer.invoke('logic:getAll'),
    getById:      (id)       => ipcRenderer.invoke('logic:getById', id),
    create:       (data)     => ipcRenderer.invoke('logic:create', data),
    save:         (id, data) => ipcRenderer.invoke('logic:save', id, data),
    delete:       (id)       => ipcRenderer.invoke('logic:delete', id),
    getPublished: ()         => ipcRenderer.invoke('logic:getPublished'),
  },
  evidence: {
    getAll:    ()             => ipcRenderer.invoke('evidence:getAll'),
    getById:   (id)           => ipcRenderer.invoke('evidence:getById', id),
    search:    (q)            => ipcRenderer.invoke('evidence:search', q),
    save:      (name, mime, buf) => ipcRenderer.invoke('evidence:save', name, mime, buf),
    create:    (data)         => ipcRenderer.invoke('evidence:create', data),
    update:    (id, data)     => ipcRenderer.invoke('evidence:update', id, data),
    delete:    (id)           => ipcRenderer.invoke('evidence:delete', id),
  },
  calendar: {
    isAuthenticated:      ()                  => ipcRenderer.invoke('calendar:isAuthenticated'),
    connect:              ()                  => ipcRenderer.invoke('calendar:connect'),
    disconnect:           ()                  => ipcRenderer.invoke('calendar:disconnect'),
    getEvents:            (days)              => ipcRenderer.invoke('calendar:getEvents', days),
    createEvent:          (data)              => ipcRenderer.invoke('calendar:createEvent', data),
    updateEvent:          (id, data)          => ipcRenderer.invoke('calendar:updateEvent', id, data),
    deleteEvent:          (id)                => ipcRenderer.invoke('calendar:deleteEvent', id),
    getCredentialsStatus: ()                  => ipcRenderer.invoke('calendar:getCredentialsStatus'),
    saveCredentials:      (clientId, secret)  => ipcRenderer.invoke('calendar:saveCredentials', clientId, secret),
  },
  scraper: {
    fetchUrl: (url) => ipcRenderer.invoke('scraper:fetchUrl', url),
  },
  ai: {
    analyze:        (caseDescription, options) => ipcRenderer.invoke('ai:analyze', caseDescription, options),
    generateEmail:  (context, options)         => ipcRenderer.invoke('ai:generateEmail', context, options),
    chat:           (message, history, attachments) => ipcRenderer.invoke('ai:chat', message, history, attachments),
    adminEdit:      (instruction)              => ipcRenderer.invoke('ai:adminEdit', instruction),
    testConnection: ()                          => ipcRenderer.invoke('ai:testConnection'),
  },
  ac3: {
    triage:           (caseDesc, options)          => ipcRenderer.invoke('ac3:triage', caseDesc, options),
    saveCase:         (caseDesc, decision)          => ipcRenderer.invoke('ac3:saveCase', caseDesc, decision),
    getCases:         ()                            => ipcRenderer.invoke('ac3:getCases'),
    updateStatus:     (id, status)                  => ipcRenderer.invoke('ac3:updateStatus', id, status),
    deleteCase:       (id)                          => ipcRenderer.invoke('ac3:deleteCase', id),
    saveImage:        (fileName, base64)            => ipcRenderer.invoke('ac3:saveImage', fileName, base64),
    updateImagePath:  (id, path)                    => ipcRenderer.invoke('ac3:updateImagePath', id, path),
    pushToCalendar:   (decision, caseDesc, imgPath) => ipcRenderer.invoke('ac3:pushToCalendar', decision, caseDesc, imgPath),
    updateCalendarId: (id, calId)                   => ipcRenderer.invoke('ac3:updateCalendarId', id, calId),
    branches: {
      getAll:  ()            => ipcRenderer.invoke('ac3:branches:getAll'),
      create:  (data)        => ipcRenderer.invoke('ac3:branches:create', data),
      update:  (id, data)    => ipcRenderer.invoke('ac3:branches:update', id, data),
      delete:  (id)          => ipcRenderer.invoke('ac3:branches:delete', id),
    },
    textTemplates: {
      getAll:  ()            => ipcRenderer.invoke('ac3:textTemplates:getAll'),
      create:  (data)        => ipcRenderer.invoke('ac3:textTemplates:create', data),
      update:  (id, data)    => ipcRenderer.invoke('ac3:textTemplates:update', id, data),
      delete:  (id)          => ipcRenderer.invoke('ac3:textTemplates:delete', id),
    },
    emailTemplates: {
      getAll:        ()         => ipcRenderer.invoke('ac3:emailTemplates:getAll'),
      getByBranch:   (branchId) => ipcRenderer.invoke('ac3:emailTemplates:getByBranch', branchId),
      create:        (data)     => ipcRenderer.invoke('ac3:emailTemplates:create', data),
      update:        (id, data) => ipcRenderer.invoke('ac3:emailTemplates:update', id, data),
      delete:        (id)       => ipcRenderer.invoke('ac3:emailTemplates:delete', id),
    },
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
