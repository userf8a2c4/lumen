const { app, BrowserWindow, ipcMain, safeStorage } = require('electron');
const path = require('path');
const fs = require('fs');
const db = require('./database');
const { scrapeUrl } = require('./scraper');
const { initUpdater, checkForUpdates, downloadUpdate, installUpdate, reportError } = require('./updater');

let mainWindow;

const API_KEY_PATH = path.join(app.getPath('userData'), '.api-key');
const ATTACHMENTS_DIR = path.join(app.getPath('userData'), 'attachments');

// Ensure attachments directory exists
if (!fs.existsSync(ATTACHMENTS_DIR)) {
  fs.mkdirSync(ATTACHMENTS_DIR, { recursive: true });
}

// --- API Key encryption ---

function saveApiKey(key) {
  if (!key) {
    if (fs.existsSync(API_KEY_PATH)) fs.unlinkSync(API_KEY_PATH);
    return;
  }
  const encrypted = safeStorage.encryptString(key);
  fs.writeFileSync(API_KEY_PATH, encrypted);
}

function getApiKey() {
  if (!fs.existsSync(API_KEY_PATH)) return null;
  try {
    const encrypted = fs.readFileSync(API_KEY_PATH);
    return safeStorage.decryptString(encrypted);
  } catch {
    return null;
  }
}

// --- AI Analysis ---

async function analyzeCase(caseDescription) {
  const apiKey = getApiKey();
  if (!apiKey) {
    throw new Error('No se ha configurado la API Key de Anthropic. Ve a Configuracion para agregarla.');
  }

  const model = db.getSetting('model') || 'claude-sonnet-4-20250514';
  const policies = db.searchPoliciesForAI(caseDescription);
  const policyIds = policies.map((p) => p.id);
  const examples = db.getExamplesForPolicies(policyIds);
  const notes = db.searchNotesForAI(caseDescription);

  // Get relevant contacts by matching departments
  const departments = [...new Set(policies.map((p) => p.department))];
  const contacts = db.getContactsByDepartments(departments);

  let policiesContext = '';
  if (policies.length > 0) {
    policiesContext = policies
      .map((p, i) => `### Politica ${i + 1}: ${p.name}\n**Departamento:** ${p.department}\n**Descripcion:** ${p.description}\n**Contenido:**\n${p.content}`)
      .join('\n\n---\n\n');
  } else {
    policiesContext = 'No se encontraron politicas directamente relacionadas en la base de conocimiento.';
  }

  let examplesContext = '';
  if (examples.length > 0) {
    examplesContext = '\n\n## Casos de ejemplo previos:\n' + examples
      .map((e) => `- **Politica:** ${e.policy_name}\n  **Problema:** ${e.problem_description}\n  **Respuesta usada:** ${e.response_used}\n  **Resultado:** ${e.result}`)
      .join('\n\n');
  }

  let contactsContext = '';
  if (contacts.length > 0) {
    contactsContext = '\n\n## Contactos de escalacion disponibles:\n' + contacts
      .map((c) => `- **${c.name} ${c.last_name || ''}** (${c.department}) — ${c.contact_method} — Contactar cuando: ${c.when_to_contact}`)
      .join('\n');
  }

  let notesContext = '';
  if (notes.length > 0) {
    notesContext = '\n\n## Notas relevantes del agente:\n' + notes
      .map((n) => `- **${n.title}:** ${n.content.slice(0, 500)}`)
      .join('\n\n');
  }

  const systemPrompt = `Eres un asistente experto para agentes de atencion al cliente. Tu trabajo es analizar casos y proporcionar respuestas claras y profesionales basandote en las politicas de la empresa.

Siempre responde en espanol. Se conciso pero completo. Estructura tu respuesta exactamente en estas tres secciones:

1. **Politica aplicable**: Indica que politica(s) aplican y por que
2. **Analisis y pasos a seguir**: Explica que debe hacer la agente paso a paso
3. **Borrador de respuesta para el cliente**: Redacta una respuesta profesional y empatica lista para enviar al cliente

Si hay contactos de escalacion relevantes, menciona cuando y a quien escalar.
Si hay notas relevantes del agente, usalas como contexto adicional.
Si no hay politicas relevantes en el contexto proporcionado, indica que no se encontro una politica especifica y ofrece una respuesta general basada en buenas practicas de servicio al cliente.`;

  const userMessage = `## Caso del cliente:\n${caseDescription}\n\n## Politicas disponibles:\n${policiesContext}${examplesContext}${contactsContext}${notesContext}\n\nPor favor analiza este caso y proporciona tu recomendacion estructurada.`;

  const Anthropic = require('@anthropic-ai/sdk');
  const client = new Anthropic({ apiKey });

  const response = await client.messages.create({
    model,
    max_tokens: 2048,
    system: systemPrompt,
    messages: [{ role: 'user', content: userMessage }],
  });

  return {
    analysis: response.content[0].text,
    policiesUsed: policies.map((p) => ({
      id: p.id, name: p.name, department: p.department, description: p.description,
    })),
    contactsRelevant: contacts,
    examplesRelevant: examples,
    notesRelevant: notes.map((n) => ({ id: n.id, title: n.title })),
    model,
  };
}

// --- Email Generator ---

async function generateEmail(context) {
  const apiKey = getApiKey();
  if (!apiKey) {
    throw new Error('No se ha configurado la API Key de Anthropic.');
  }

  const model = db.getSetting('model') || 'claude-sonnet-4-20250514';

  const systemPrompt = `Eres un experto en comunicacion profesional. Genera un correo electronico profesional, empatico y claro basado en el contexto proporcionado. El correo debe estar listo para enviar. Responde SOLO con el correo, sin explicaciones adicionales. Escribe en espanol.`;

  const Anthropic = require('@anthropic-ai/sdk');
  const client = new Anthropic({ apiKey });

  const response = await client.messages.create({
    model,
    max_tokens: 1024,
    system: systemPrompt,
    messages: [{ role: 'user', content: context }],
  });

  return response.content[0].text;
}

// --- Window creation ---

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    minWidth: 900,
    minHeight: 600,
    title: 'LUMEN',
    backgroundColor: '#0a0a0f',
    show: false,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
    },
  });

  mainWindow.once('ready-to-show', () => {
    mainWindow.show();
  });

  const isDev = !app.isPackaged;

  if (isDev) {
    mainWindow.loadURL('http://localhost:5173');
  } else {
    mainWindow.loadFile(path.join(__dirname, '../../dist/renderer/index.html'));
    initUpdater(mainWindow);
  }
}

// --- IPC Handlers ---

function registerHandlers() {
  // Policies
  ipcMain.handle('policies:getAll', () => db.getAllPolicies());
  ipcMain.handle('policies:getById', (_e, id) => db.getPolicyById(id));
  ipcMain.handle('policies:create', (_e, data) => db.createPolicy(data));
  ipcMain.handle('policies:update', (_e, id, data) => db.updatePolicy(id, data));
  ipcMain.handle('policies:delete', (_e, id) => db.deletePolicy(id));
  ipcMain.handle('policies:search', (_e, query, dept) => db.searchPolicies(query, dept));
  ipcMain.handle('policies:getDepartments', () => db.getDepartments());

  // Contacts
  ipcMain.handle('contacts:getAll', () => db.getAllContacts());
  ipcMain.handle('contacts:create', (_e, data) => db.createContact(data));
  ipcMain.handle('contacts:update', (_e, id, data) => db.updateContact(id, data));
  ipcMain.handle('contacts:delete', (_e, id) => db.deleteContact(id));
  ipcMain.handle('contacts:search', (_e, query) => db.searchContacts(query));

  // Examples
  ipcMain.handle('examples:getByPolicy', (_e, policyId) => db.getExamplesByPolicy(policyId));
  ipcMain.handle('examples:create', (_e, data) => db.createExample(data));
  ipcMain.handle('examples:delete', (_e, id) => db.deleteExample(id));

  // Notes
  ipcMain.handle('notes:getAll', () => db.getAllNotes());
  ipcMain.handle('notes:getById', (_e, id) => db.getNoteById(id));
  ipcMain.handle('notes:create', (_e, data) => db.createNote(data));
  ipcMain.handle('notes:update', (_e, id, data) => db.updateNote(id, data));
  ipcMain.handle('notes:delete', (_e, id) => db.deleteNote(id));
  ipcMain.handle('notes:search', (_e, query) => db.searchNotes(query));
  ipcMain.handle('notes:saveAttachment', (_e, fileName, buffer) => {
    const safeName = `${Date.now()}-${fileName.replace(/[^a-zA-Z0-9._-]/g, '_')}`;
    const filePath = path.join(ATTACHMENTS_DIR, safeName);
    fs.writeFileSync(filePath, Buffer.from(buffer));
    return { name: fileName, path: safeName, savedAt: new Date().toISOString() };
  });

  // Settings
  ipcMain.handle('settings:getApiKey', () => {
    const key = getApiKey();
    if (!key) return '';
    return key.slice(0, 7) + '...' + key.slice(-4);
  });
  ipcMain.handle('settings:setApiKey', (_e, key) => saveApiKey(key));
  ipcMain.handle('settings:getModel', () => db.getSetting('model') || 'claude-sonnet-4-20250514');
  ipcMain.handle('settings:setModel', (_e, model) => db.setSetting('model', model));
  ipcMain.handle('settings:getTheme', () => db.getSetting('theme') || 'dark');
  ipcMain.handle('settings:setTheme', (_e, theme) => db.setSetting('theme', theme));

  // Scraper
  ipcMain.handle('scraper:fetchUrl', async (_e, url) => {
    try {
      return await scrapeUrl(url);
    } catch (err) {
      throw new Error(`Error al obtener contenido: ${err.message}`);
    }
  });

  // AI
  ipcMain.handle('ai:analyze', async (_e, caseDescription) => {
    try {
      return await analyzeCase(caseDescription);
    } catch (err) {
      throw new Error(err.message);
    }
  });
  ipcMain.handle('ai:generateEmail', async (_e, context) => {
    try {
      return await generateEmail(context);
    } catch (err) {
      throw new Error(err.message);
    }
  });

  // Updater
  ipcMain.handle('updater:check', () => checkForUpdates());
  ipcMain.handle('updater:download', () => downloadUpdate());
  ipcMain.handle('updater:install', () => installUpdate());
  ipcMain.handle('updater:reportError', (_e, desc) => reportError(desc));

  // App
  ipcMain.handle('app:getVersion', () => app.getVersion());
}

// --- App lifecycle ---

app.whenReady().then(async () => {
  await db.initDatabase();
  registerHandlers();
  createWindow();
});

app.on('window-all-closed', () => {
  db.closeDatabase();
  app.quit();
});

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});
