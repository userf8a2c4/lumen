const { app, BrowserWindow, ipcMain, safeStorage, Menu } = require('electron');
const path = require('path');
const fs = require('fs');
const db = require('./database');
const { scrapeUrl } = require('./scraper');
const { initUpdater, checkForUpdates, downloadUpdate, installUpdate } = require('./updater');
const { GoogleGenerativeAI } = require('@google/generative-ai');

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

// --- Local-first analysis (no API needed) ---

function buildLocalAnalysis(policies, contacts, notes, examples, caseDescription) {
  const parts = [];

  if (policies.length > 0) {
    parts.push('## Politica aplicable\n' +
      policies.map((p) =>
        `**${p.name}** (${p.department})\n${p.description || ''}\n\n${p.content ? p.content.slice(0, 400) + (p.content.length > 400 ? '...' : '') : ''}`
      ).join('\n\n---\n\n')
    );
  } else {
    parts.push('## Politica aplicable\nNo cuento con esa informacion en la base de datos de LUMEN.');
  }

  const steps = [];
  if (policies.length > 0) {
    steps.push(`Aplica la politica **${policies[0].name}** del departamento ${policies[0].department}.`);
  }
  if (contacts.length > 0) {
    steps.push('Contactos disponibles para escalacion:');
    contacts.forEach((c) => steps.push(`- **${c.name} ${c.last_name || ''}** (${c.department}) — ${c.contact_method}. Contactar cuando: ${c.when_to_contact}`));
  }
  if (notes.length > 0) {
    steps.push('\nNotas relevantes del agente:');
    notes.forEach((n) => steps.push(`- ${n.title}`));
  }
  if (examples.length > 0) {
    steps.push('\nCasos similares previamente resueltos:');
    examples.forEach((e) => steps.push(`- **${e.policy_name}**: ${e.response_used.slice(0, 150)}`));
  }

  parts.push('## Analisis y pasos a seguir\n' + (steps.length > 0 ? steps.join('\n') : 'Revisa las politicas identificadas para determinar los pasos correctos.'));

  if (policies.length > 0) {
    const p = policies[0];
    parts.push(`## Borrador de respuesta para el cliente\nEstimado/a cliente,\n\nGracias por comunicarse. He revisado su solicitud relacionada con "${caseDescription.slice(0, 80)}..." y me complace informarle que contamos con una politica especifica para este caso.\n\n[Personalizar respuesta con base en: ${p.name}]\n\nQuedo atento/a ante cualquier consulta adicional.\n\nSaludos cordiales.`);
  } else {
    parts.push('## Borrador de respuesta para el cliente\nEstimado/a cliente,\n\nGracias por su contacto. Hemos recibido su solicitud y la estamos revisando para brindarle la mejor solucion posible. En breve nos pondremos en contacto con usted.\n\nSaludos cordiales.');
  }

  return parts.join('\n\n');
}

// --- AI Analysis (Gemini — Arquitectura Biblica de dos capas) ---

async function analyzeCase(caseDescription, options = {}) {
  const searchMode = options.searchMode || 'local'; // 'local' | 'expanded'

  const policies = db.searchPoliciesForAI(caseDescription);
  const policyIds = policies.map((p) => p.id);
  const examples = db.getExamplesForPolicies(policyIds);
  const notes = db.searchNotesForAI(caseDescription);
  const departments = [...new Set(policies.map((p) => p.department))];
  const contacts = db.getContactsByDepartments(departments);

  // ── LOCAL-FIRST: skip Gemini entirely in local mode ──────────────
  if (searchMode === 'local') {
    return {
      analysis: buildLocalAnalysis(policies, contacts, notes, examples, caseDescription),
      policiesUsed: policies.map((p) => ({ id: p.id, name: p.name, department: p.department, description: p.description })),
      contactsRelevant: contacts,
      examplesRelevant: examples,
      notesRelevant: notes.map((n) => ({ id: n.id, title: n.title })),
      model: 'local',
      searchMode: 'local',
    };
  }

  // ── EXPANDED MODE: call Gemini ───────────────────────────────────
  const apiKey = getApiKey();
  if (!apiKey) {
    throw new Error('No se ha configurado la API Key de Google AI. Ve a Configuracion para agregarla.');
  }
  const modelId = options.model || db.getSetting('model') || 'gemini-1.5-flash';

  let policiesContext = '';
  if (policies.length > 0) {
    policiesContext = policies
      .map((p, i) => `### Politica ${i + 1}: ${p.name}\n**Departamento:** ${p.department}\n**Descripcion:** ${p.description}\n**Contenido:**\n${p.content}`)
      .join('\n\n---\n\n');
  } else {
    policiesContext = '[SIN POLITICAS RELACIONADAS EN LA BASE DE DATOS DE LUMEN]';
  }

  let examplesContext = '';
  if (examples.length > 0) {
    examplesContext = '\n\n## Casos de ejemplo previos en LUMEN:\n' + examples
      .map((e) => `- **Politica:** ${e.policy_name}\n  **Problema:** ${e.problem_description}\n  **Respuesta usada:** ${e.response_used}\n  **Resultado:** ${e.result}`)
      .join('\n\n');
  }

  let contactsContext = '';
  if (contacts.length > 0) {
    contactsContext = '\n\n## Contactos de escalacion en LUMEN:\n' + contacts
      .map((c) => `- **${c.name} ${c.last_name || ''}** (${c.department}) — ${c.contact_method} — Contactar cuando: ${c.when_to_contact}`)
      .join('\n');
  }

  let notesContext = '';
  if (notes.length > 0) {
    notesContext = '\n\n## Notas relevantes del agente en LUMEN:\n' + notes
      .map((n) => `- **${n.title}:** ${n.content.slice(0, 500)}`)
      .join('\n\n');
  }

  const searchContext = searchMode === 'expanded'
    ? 'MODO EXPANDIDO ACTIVO: Puedes consultar informacion externa de internet SOLO para datos publicos (tendencias, noticias, normativas). NUNCA uses fuentes externas para inventar o contradecir datos internos de LUMEN.'
    : 'MODO LOCAL ACTIVO: Usa exclusivamente los datos de la base de datos de LUMEN. No uses informacion externa.';

  const systemPrompt = `Eres el asistente experto de LUMEN para agentes de atencion al cliente.

## ARQUITECTURA DE RESPUESTA — DOS CAPAS OBLIGATORIAS

### CAPA 1 — BIBLIA DE LUMEN (PRIORIDAD ABSOLUTA E INAMOVIBLE):
Los documentos, politicas, notas y contactos proporcionados en este contexto son la UNICA fuente autorizada para informacion interna de la organizacion.

REGLAS ESTRICTAS (no negociables):
- Si la informacion solicitada ESTA en los documentos de LUMEN: respondela con precision total y cita la politica
- Si la informacion NO ESTA en los documentos de LUMEN: responde EXACTAMENTE: "No cuento con esa informacion en la base de datos de LUMEN."
- JAMAS inventes, estimes ni generes datos internos que no esten explicita y textualmente en los documentos proporcionados
- El modelo NO tiene permitido alucinar datos internos bajo ninguna circunstancia

### CAPA 2 — CONTEXTO EXTERNO:
${searchContext}

## FORMATO DE RESPUESTA
Siempre responde en espanol. Estructura tu respuesta en exactamente estas tres secciones:

1. **Politica aplicable**: Indica que politica(s) de LUMEN aplican y por que (si no hay politica, indica exactamente "No cuento con esa informacion en la base de datos de LUMEN.")
2. **Analisis y pasos a seguir**: Explica que debe hacer la agente paso a paso basandose en las politicas encontradas
3. **Borrador de respuesta para el cliente**: Redacta una respuesta profesional y empatica lista para enviar al cliente

Si hay contactos de escalacion relevantes en LUMEN, menciona cuando y a quien escalar.
Si hay notas relevantes del agente en LUMEN, usalas como contexto adicional.`;

  const userMessage = `## Caso del cliente:\n${caseDescription}\n\n## BASE DE DATOS LUMEN — POLITICAS INDEXADAS:\n${policiesContext}${examplesContext}${contactsContext}${notesContext}\n\nAnaliza este caso basandote EXCLUSIVAMENTE en las politicas de LUMEN proporcionadas.`;

  const genAI = new GoogleGenerativeAI(apiKey);
  const modelConfig = { model: modelId, systemInstruction: systemPrompt };
  if (searchMode === 'expanded') {
    modelConfig.tools = [{ googleSearch: {} }];
  }

  const geminiModel = genAI.getGenerativeModel(modelConfig);

  // Build content parts — prepend image/PDF if provided
  const contentParts = [];
  if (options.attachment && options.attachment.data) {
    contentParts.push({
      inlineData: {
        data: options.attachment.data,
        mimeType: options.attachment.mimeType || 'image/png',
      },
    });
    contentParts.push({ text: `[Archivo adjunto: ${options.attachment.name}]\n\n${userMessage}` });
  } else {
    contentParts.push({ text: userMessage });
  }

  const result = await geminiModel.generateContent(contentParts);
  const text = result.response.text();

  return {
    analysis: text,
    policiesUsed: policies.map((p) => ({
      id: p.id, name: p.name, department: p.department, description: p.description,
    })),
    contactsRelevant: contacts,
    examplesRelevant: examples,
    notesRelevant: notes.map((n) => ({ id: n.id, title: n.title })),
    model: modelId,
    searchMode,
  };
}

// --- Email Generator (Gemini) ---

async function generateEmail(context, options = {}) {
  const apiKey = getApiKey();
  if (!apiKey) {
    throw new Error('No se ha configurado la API Key de Google AI. Ve a Configuracion para agregarla.');
  }

  const modelId = options.model || db.getSetting('model') || 'gemini-1.5-flash';

  const genAI = new GoogleGenerativeAI(apiKey);
  const geminiModel = genAI.getGenerativeModel({
    model: modelId,
    systemInstruction: 'Eres un experto en comunicacion profesional. Genera un correo electronico profesional, empatico y claro basado en el contexto proporcionado. El correo debe estar listo para enviar. Responde SOLO con el correo, sin explicaciones adicionales. Escribe en espanol.',
  });

  const result = await geminiModel.generateContent(context);
  return result.response.text();
}

// --- Window creation ---

function createWindow() {
  // SpaceX Stealth: remove native menu bar entirely
  Menu.setApplicationMenu(null);

  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    minWidth: 900,
    minHeight: 600,
    title: 'LUMEN',
    backgroundColor: '#0a0a0f',
    show: false,
    autoHideMenuBar: true,
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
  ipcMain.handle('settings:getModel', () => db.getSetting('model') || 'gemini-1.5-flash');
  ipcMain.handle('settings:setModel', (_e, model) => db.setSetting('model', model));
  ipcMain.handle('settings:getTheme', () => db.getSetting('theme') || 'dark');
  ipcMain.handle('settings:setTheme', (_e, theme) => db.setSetting('theme', theme));
  ipcMain.handle('settings:getUserEmail', () => db.getSetting('user_email') || '');
  ipcMain.handle('settings:setUserEmail', (_e, email) => db.setSetting('user_email', email));
  ipcMain.handle('settings:getCseId', () => db.getSetting('cse_id') || '');
  ipcMain.handle('settings:setCseId', (_e, id) => db.setSetting('cse_id', id));
  ipcMain.handle('settings:getAccentColor', () => db.getSetting('accent_color') || '#7E3FF2');
  ipcMain.handle('settings:setAccentColor', (_e, color) => db.setSetting('accent_color', color));

  // Scraper
  ipcMain.handle('scraper:fetchUrl', async (_e, url) => {
    try {
      return await scrapeUrl(url);
    } catch (err) {
      throw new Error(`Error al obtener contenido: ${err.message}`);
    }
  });

  // AI
  ipcMain.handle('ai:analyze', async (_e, caseDescription, options) => {
    try {
      return await analyzeCase(caseDescription, options || {});
    } catch (err) {
      throw new Error(err.message);
    }
  });
  ipcMain.handle('ai:generateEmail', async (_e, context, options) => {
    try {
      return await generateEmail(context, options || {});
    } catch (err) {
      throw new Error(err.message);
    }
  });

  // Updater
  ipcMain.handle('updater:check', () => checkForUpdates());
  ipcMain.handle('updater:download', () => downloadUpdate());
  ipcMain.handle('updater:install', () => installUpdate());
  // App
  ipcMain.handle('app:getVersion', () => app.getVersion());
  ipcMain.handle('app:quit', () => app.quit());
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
