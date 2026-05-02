const { app, BrowserWindow, ipcMain, safeStorage, Menu, protocol } = require('electron');
const path = require('path');
const fs = require('fs');
const db = require('./database');
const { scrapeUrl } = require('./scraper');
const { initUpdater, checkForUpdates, downloadUpdate, installUpdate } = require('./updater');
const { GoogleGenerativeAI } = require('@google/generative-ai');
const cal = require('./calendar');

// Embedded API key (injected at build time via CI secrets, gitignored)
let _geminiCfg = {};
try { _geminiCfg = require('./gemini-config'); } catch { /* no local config */ }

// Register lumen:// scheme BEFORE app is ready (required by Electron)
protocol.registerSchemesAsPrivileged([
  { scheme: 'lumen', privileges: { standard: true, secure: true, supportFetchAPI: true, bypassCSP: true } },
]);

let mainWindow;

const API_KEY_PATH    = path.join(app.getPath('userData'), '.api-key');
const ATTACHMENTS_DIR = path.join(app.getPath('userData'), 'attachments');
const EVIDENCES_DIR   = path.join(app.getPath('userData'), 'evidences');

// Ensure storage directories exist
[ATTACHMENTS_DIR, EVIDENCES_DIR].forEach((dir) => {
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
});

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
  // 1. User-configured key (takes priority — allows developer override)
  if (fs.existsSync(API_KEY_PATH)) {
    try {
      const encrypted = fs.readFileSync(API_KEY_PATH);
      const key = safeStorage.decryptString(encrypted);
      if (key && key.length > 10) return key;
    } catch { /* fall through */ }
  }
  // 2. Embedded key (injected at build time — works out of the box for end users)
  const embedded = process.env.GEMINI_API_KEY || _geminiCfg.GEMINI_API_KEY || '';
  return embedded || null;
}

// --- Gemini error humanizer ---
// Translates cryptic Gemini SDK errors into actionable Spanish messages
function humanizeGeminiError(err) {
  const msg = (err && err.message) ? err.message : String(err);
  const lower = msg.toLowerCase();

  // 429 — Quota exhausted / rate limit
  if (/429|too many requests|quota/i.test(msg)) {
    // Detect "limit: 0" which means the project has no free tier allocated
    if (/limit:\s*0/i.test(msg)) {
      return 'La API Key de Google AI tiene cuota agotada (limit: 0). El proyecto de Google Cloud asociado no tiene free tier disponible o la facturación no está activa. Genera una nueva API Key en https://aistudio.google.com/apikey con un proyecto nuevo, o habilita facturación en el actual.';
    }
    const retryMatch = msg.match(/retry in ([\d.]+)s/i);
    const retry = retryMatch ? ` Reintenta en ~${Math.ceil(parseFloat(retryMatch[1]))}s.` : '';
    return `Límite de peticiones excedido (429).${retry} Espera unos segundos o usa una API Key con cuota disponible.`;
  }

  // 400 — Bad request
  if (/400|invalid argument|bad request/i.test(msg)) {
    if (/api key not valid|api_key_invalid/i.test(msg)) {
      return 'La API Key de Google AI no es válida. Verifica que esté correctamente copiada desde https://aistudio.google.com/apikey';
    }
    if (/model.*not found|not supported/i.test(msg)) {
      return 'El modelo seleccionado no está disponible. Cambia a Gemini 2.0 Flash en Configuración.';
    }
    return `Petición inválida a Gemini: ${msg.slice(0, 200)}`;
  }

  // 403 — Forbidden / API not enabled
  if (/403|permission denied|api.*not.*enabled|forbidden/i.test(msg)) {
    return 'Acceso denegado. Habilita la "Generative Language API" en https://console.cloud.google.com/ para el proyecto de tu API Key.';
  }

  // 401 — Unauthorized
  if (/401|unauthenticated|unauthorized/i.test(msg)) {
    return 'API Key inválida o revocada. Genera una nueva en https://aistudio.google.com/apikey';
  }

  // 5xx — Server errors
  if (/5\d\d|internal|unavailable|service.*error/i.test(msg)) {
    return 'El servicio de Gemini está temporalmente no disponible. Reintenta en unos minutos.';
  }

  // Network
  if (/fetch failed|network|enotfound|etimedout|econnreset/i.test(lower)) {
    return 'Error de red al contactar con Gemini. Verifica tu conexión a internet.';
  }

  return `Error de Gemini: ${msg.slice(0, 250)}`;
}

// --- Gemini connection test ---
async function testGeminiConnection() {
  const apiKey = getApiKey();
  if (!apiKey) {
    return { ok: false, stage: 'no-key', message: 'No hay API Key configurada ni embebida.' };
  }

  try {
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });
    const result = await model.generateContent('Responde solo con la palabra "ok".');
    const text = (result.response.text() || '').trim().toLowerCase();
    return {
      ok: true,
      stage: 'ok',
      model: 'gemini-2.5-flash',
      sample: text.slice(0, 40),
      keyPreview: apiKey.slice(0, 7) + '...' + apiKey.slice(-4),
    };
  } catch (err) {
    return {
      ok: false,
      stage: 'api-error',
      message: humanizeGeminiError(err),
      raw: (err && err.message) ? err.message.slice(0, 400) : String(err).slice(0, 400),
      keyPreview: apiKey.slice(0, 7) + '...' + apiKey.slice(-4),
    };
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
    examples.forEach((e) => steps.push(`- **${e.policy_name}**: ${(e.response_used || '').slice(0, 150)}`));
  }

  parts.push('## Analisis y pasos a seguir\n' + (steps.length > 0 ? steps.join('\n') : 'Revisa las politicas identificadas para determinar los pasos correctos.'));

  if (policies.length > 0) {
    const p = policies[0];
    parts.push(`## Borrador de respuesta para el cliente\nEstimado/a cliente,\n\nGracias por comunicarse. He revisado su solicitud relacionada con "${(caseDescription || '').slice(0, 80)}..." y me complace informarle que contamos con una politica especifica para este caso.\n\n[Personalizar respuesta con base en: ${p.name}]\n\nQuedo atento/a ante cualquier consulta adicional.\n\nSaludos cordiales.`);
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
  const modelId = options.model || db.getSetting('model') || 'gemini-2.5-flash';

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
      .map((n) => `- **${n.title}:** ${(n.content || '').slice(0, 500)}`)
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

// ─── AC3 — Motor de Decisiones Amazon-style ──────────────────────────────────

function buildLocalTriage(caseDescription, policies, contacts) {
  const lower = caseDescription.toLowerCase();
  let categoria = 'amenidades';
  let confianza = 60;

  if (/pago|cobr|factur|reembolso|dinero|monto|precio|costo|tarjeta|cargo|devoluci/.test(lower)) {
    categoria = 'finanzas'; confianza = 75;
  } else if (/contrato|legal|ley|normat|incumplimiento|demanda|garantia|litigio|cláusula/.test(lower)) {
    categoria = 'legal'; confianza = 75;
  } else if (/sistema|error|bug|fallo|tecnico|configuraci|servidor|app|software|acceso|contrase/.test(lower)) {
    categoria = 'tecnico'; confianza = 75;
  }

  const policy  = policies[0] || null;
  const contact = contacts[0] || null;

  return {
    categoria,
    confianza,
    tipo_decision:        'T2-reversible',
    urgencia:             'media',
    resumen_ejecutivo:    `Caso clasificado como ${categoria} (análisis local heurístico)`,
    dri:                  policy ? `Supervisor de ${policy.department}` : 'Supervisor de turno',
    plazo_horas:          24,
    politica_aplicable:   policy ? policy.name : null,
    pasos_accion: [
      'Revisar la solicitud completa del cliente',
      policy  ? `Aplicar política: ${policy.name}` : 'Consultar manual de procedimientos',
      contact ? `Coordinar con: ${contact.name} ${contact.last_name || ''}` : 'Coordinar con supervisor de área',
    ],
    criterio_escalacion:  'Si el caso no se resuelve en el plazo o supera el umbral de autoridad',
    contacto_sugerido:    contact ? `${contact.name} ${contact.last_name || ''} — ${contact.department}` : null,
    resultado_deseado:    'Resolución satisfactoria para el cliente dentro del plazo acordado',
    notas_internas:       'Análisis heurístico local. Configura una API Key en Configuración para análisis AC3 completo.',
    _isLocal:             true,
  };
}

async function triageCase(caseDescription, options = {}) {
  const policies    = db.searchPoliciesForAI(caseDescription);
  const departments = [...new Set(policies.map((p) => p.department))];
  const contacts    = db.getContactsByDepartments(departments.length > 0 ? departments : ['General']);
  const notes       = db.searchNotesForAI(caseDescription);
  const modelId     = options.model || db.getSetting('model') || 'gemini-2.5-flash';

  const apiKey = getApiKey();
  if (!apiKey) {
    return buildLocalTriage(caseDescription, policies, contacts);
  }

  const systemPrompt = `Eres AC3 — Motor de Decisiones de LUMEN, diseñado con principios Amazon.

PRINCIPIOS:
- Tipo 1 (T1-irreversible): alto impacto, difícil de revertir → requiere jerarquía completa
- Tipo 2 (T2-reversible): se puede corregir → decidir rápido, ejecutar, ajustar
- DRI: un único responsable por decisión (Directly Responsible Individual)
- Working Backwards: define el resultado deseado para el cliente antes de actuar
- Escalación específica y medible, nunca vaga

CATEGORÍAS:
- finanzas: reembolsos, cobros incorrectos, ajustes monetarios, créditos, compensaciones
- legal: contratos, garantías, cumplimiento normativo, responsabilidad, litigios
- tecnico: fallas de sistema, errores de software, configuración, acceso, SLA, integraciones
- amenidades: experiencia del cliente, instalaciones, calidad de servicio, comodidad, logística

INSTRUCCIÓN CRÍTICA:
Responde ÚNICAMENTE con JSON válido. Sin texto extra, sin markdown, sin bloques de código.
Usa solo datos de las políticas y contactos de LUMEN proporcionados.

{
  "categoria": "finanzas|legal|tecnico|amenidades",
  "confianza": 0-100,
  "tipo_decision": "T1-irreversible|T2-reversible",
  "urgencia": "critica|alta|media|baja",
  "resumen_ejecutivo": "máx 15 palabras que describen el caso",
  "dri": "rol exacto del responsable",
  "plazo_horas": número,
  "politica_aplicable": "nombre de política o null",
  "pasos_accion": ["paso 1", "paso 2", "paso 3"],
  "criterio_escalacion": "condición específica y medible",
  "contacto_sugerido": "Nombre Apellido — Cargo o null",
  "resultado_deseado": "promesa concreta al cliente en una oración",
  "notas_internas": "contexto para el agente, máx 2 oraciones"
}`;

  let context = `CASO DEL CLIENTE:\n${caseDescription}\n\n`;
  if (policies.length > 0) {
    context += `POLÍTICAS LUMEN:\n${policies.map((p) => `- ${p.name} (${p.department}): ${p.description}`).join('\n')}\n\n`;
  } else {
    context += `POLÍTICAS LUMEN: Sin políticas específicas para este caso.\n\n`;
  }
  if (contacts.length > 0) {
    context += `CONTACTOS DISPONIBLES:\n${contacts.map((c) => `- ${c.name} ${c.last_name || ''} (${c.department}): ${c.when_to_contact}`).join('\n')}\n\n`;
  }
  if (notes.length > 0) {
    context += `NOTAS DEL AGENTE:\n${notes.map((n) => `- ${n.title}: ${(n.content || '').slice(0, 200)}`).join('\n')}`;
  }

  const genAI        = new GoogleGenerativeAI(apiKey);
  const geminiModel  = genAI.getGenerativeModel({ model: modelId, systemInstruction: systemPrompt });
  const result       = await geminiModel.generateContent(context);
  const text         = result.response.text().trim();
  const jsonMatch    = text.match(/\{[\s\S]*\}/);
  if (!jsonMatch) throw new Error('AC3: respuesta no es JSON válido');
  return JSON.parse(jsonMatch[0]);
}

// --- Email Generator (Gemini) ---

async function generateEmail(context, options = {}) {
  const apiKey = getApiKey();
  if (!apiKey) {
    throw new Error('No se ha configurado la API Key de Google AI. Ve a Configuracion para agregarla.');
  }

  const modelId = options.model || db.getSetting('model') || 'gemini-2.5-flash';

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
      webSecurity: false, // allow loading OSM tiles and external resources
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
  ipcMain.handle('settings:getModel', () => db.getSetting('model') || 'gemini-2.5-flash');
  ipcMain.handle('settings:setModel', (_e, model) => db.setSetting('model', model));
  ipcMain.handle('settings:getTheme', () => db.getSetting('theme') || 'dark');
  ipcMain.handle('settings:setTheme', (_e, theme) => db.setSetting('theme', theme));
  ipcMain.handle('settings:getUserEmail', () => db.getSetting('user_email') || '');
  ipcMain.handle('settings:setUserEmail', (_e, email) => db.setSetting('user_email', email));
  ipcMain.handle('settings:getCseId', () => db.getSetting('cse_id') || '');
  ipcMain.handle('settings:setCseId', (_e, id) => db.setSetting('cse_id', id));
  ipcMain.handle('settings:getAccentColor',    () => db.getSetting('accent_color') || '#7E3FF2');
  ipcMain.handle('settings:setAccentColor',    (_e, color) => db.setSetting('accent_color', color));
  ipcMain.handle('settings:getSectionLabels',  () => db.getSetting('section_labels') || null);
  ipcMain.handle('settings:setSectionLabels',  (_e, json) => db.setSetting('section_labels', json));
  ipcMain.handle('settings:getThemeCustomization', () => db.getSetting('theme_customization') || null);
  ipcMain.handle('settings:setThemeCustomization', (_e, json) => db.setSetting('theme_customization', json));
  ipcMain.handle('settings:getCaseIdMode', () => db.getSetting('case_id_mode') || 'auto');
  ipcMain.handle('settings:setCaseIdMode', (_e, mode) => db.setSetting('case_id_mode', mode));
  ipcMain.handle('settings:getShowPromos', () => (db.getSetting('show_promos') ?? 'true') === 'true');
  ipcMain.handle('settings:setShowPromos', (_e, val) => db.setSetting('show_promos', val ? 'true' : 'false'));

  // Locations (3 slots: Casa, Trabajo, Otro)
  const DEFAULT_LOCATIONS = [
    { id: 'home',  label: 'Casa',    lat: null, lng: null, address: '', enabled: true },
    { id: 'work',  label: 'Trabajo', lat: null, lng: null, address: '', enabled: true },
    { id: 'other', label: 'Otro',    lat: null, lng: null, address: '', enabled: false },
  ];
  ipcMain.handle('settings:getLocations', () => {
    try {
      const raw = db.getSetting('promo_locations');
      return raw ? JSON.parse(raw) : DEFAULT_LOCATIONS;
    } catch { return DEFAULT_LOCATIONS; }
  });
  ipcMain.handle('settings:setLocations', (_e, locs) => db.setSetting('promo_locations', JSON.stringify(locs)));

  // Promos — fetch for a specific location
  async function fetchPromosForLocation(loc) {
    const apiKey = getApiKey();
    if (!apiKey) throw new Error('Sin API Key');
    const modelId = db.getSetting('model') || 'gemini-2.5-flash';
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: modelId, tools: [{ googleSearch: {} }] });
    const today = new Date().toLocaleDateString('es-MX', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
    const locationDesc = loc.address
      ? `${loc.address}`
      : 'Toluca de Lerdo, Estado de México, México';
    const prompt =
      `Hoy es ${today}. Busca promociones de comida, restaurantes y negocios de alimentos cerca de: "${locationDesc}". ` +
      `Incluye combos, descuentos, 2x1, menú del día, ofertas especiales, etc. ` +
      `Responde ÚNICAMENTE con un JSON válido, sin texto extra, sin markdown, con este formato exacto: ` +
      `[{"name":"Nombre negocio","category":"Tipo","promo":"Descripción promo","details":"Condiciones/detalles","address":"Dirección"}]. ` +
      `Máximo 8 resultados. Si no encuentras info real, devuelve [].`;
    const result = await model.generateContent(prompt);
    const text = result.response.text().trim();
    const jsonMatch = text.match(/\[[\s\S]*\]/);
    if (!jsonMatch) return [];
    return JSON.parse(jsonMatch[0]);
  }

  ipcMain.handle('promos:fetchForLocation', async (_e, loc) => {
    try { return await fetchPromosForLocation(loc); }
    catch (e) { console.error('promos:fetchForLocation error', e); return []; }
  });

  // Legacy fetch (backward compat — uses first enabled location or default)
  ipcMain.handle('promos:fetch', async () => {
    try {
      const raw = db.getSetting('promo_locations');
      const locs = raw ? JSON.parse(raw) : DEFAULT_LOCATIONS;
      const enabled = locs.filter((l) => l.enabled);
      const loc = enabled[0] || { address: 'Toluca de Lerdo, Estado de México, México' };
      return await fetchPromosForLocation(loc);
    } catch (e) { console.error('promos:fetch error', e); return []; }
  });

  // Logic Flows
  ipcMain.handle('logic:getAll',    () => db.getAllFlows());
  ipcMain.handle('logic:getById',   (_e, id) => db.getFlowById(id));
  ipcMain.handle('logic:create',    (_e, data) => db.createFlow(data));
  ipcMain.handle('logic:save',      (_e, id, data) => db.saveFlow(id, data));
  ipcMain.handle('logic:delete',    (_e, id) => db.deleteFlow(id));
  ipcMain.handle('logic:getPublished', () => db.getPublishedFlows());

  // Evidence Vault
  ipcMain.handle('evidence:getAll',    () => db.getAllEvidences());
  ipcMain.handle('evidence:getById',   (_e, id) => db.getEvidenceById(id));
  ipcMain.handle('evidence:search',    (_e, q)  => db.searchEvidences(q));
  ipcMain.handle('evidence:update',    (_e, id, data) => db.updateEvidence(id, data));
  ipcMain.handle('evidence:delete',    (_e, id) => {
    const ev = db.getEvidenceById(id);
    if (ev) {
      const full = path.join(EVIDENCES_DIR, ev.file_path);
      if (fs.existsSync(full)) fs.unlinkSync(full);
    }
    db.deleteEvidence(id);
  });
  ipcMain.handle('evidence:save', (_e, fileName, mimeType, buffer) => {
    const safeName = `${Date.now()}-${fileName.replace(/[^a-zA-Z0-9._-]/g, '_')}`;
    const filePath = path.join(EVIDENCES_DIR, safeName);
    fs.writeFileSync(filePath, Buffer.from(buffer));
    const stats = fs.statSync(filePath);
    return { safeName, fileSize: stats.size };
  });
  ipcMain.handle('evidence:create', (_e, data) => db.createEvidence(data));

  // Google Calendar — credenciales embebidas en calendar.js, usuario solo autoriza con su cuenta
  ipcMain.handle('calendar:isAuthenticated', () => cal.isAuthenticated());
  ipcMain.handle('calendar:connect', async () => {
    try {
      await cal.startOAuth();
      return { ok: true };
    } catch (e) { throw new Error(e.message); }
  });
  ipcMain.handle('calendar:disconnect', () => cal.disconnect());
  ipcMain.handle('calendar:getEvents', async (_e, daysAhead) => {
    try { return await cal.getEvents(daysAhead || 14); }
    catch (e) { throw new Error(e.message); }
  });
  ipcMain.handle('calendar:createEvent', async (_e, eventData) => {
    try { return await cal.createEvent(eventData); }
    catch (e) { throw new Error(e.message); }
  });
  ipcMain.handle('calendar:updateEvent', async (_e, eventId, eventData) => {
    try { return await cal.updateEvent(eventId, eventData); }
    catch (e) { throw new Error(e.message); }
  });
  ipcMain.handle('calendar:deleteEvent', async (_e, eventId) => {
    try { await cal.deleteEvent(eventId); return { ok: true }; }
    catch (e) { throw new Error(e.message); }
  });

  // Scraper
  ipcMain.handle('scraper:fetchUrl', async (_e, url) => {
    try {
      return await scrapeUrl(url);
    } catch (err) {
      throw new Error(`Error al obtener contenido: ${err.message}`);
    }
  });

  // AI
  ipcMain.handle('ai:testConnection', async () => testGeminiConnection());
  ipcMain.handle('ai:analyze', async (_e, caseDescription, options) => {
    try {
      return await analyzeCase(caseDescription, options || {});
    } catch (err) {
      throw new Error(humanizeGeminiError(err));
    }
  });
  ipcMain.handle('ai:generateEmail', async (_e, context, options) => {
    try {
      return await generateEmail(context, options || {});
    } catch (err) {
      throw new Error(humanizeGeminiError(err));
    }
  });
  ipcMain.handle('ai:chat', async (_e, message, history, fileData) => {
    try {
      const apiKey = getApiKey();
      if (!apiKey) throw new Error('No se ha configurado la API Key de Google AI. Ve a Configuracion para agregarla.');
      const stored = db.getSetting('model') || '';
      const modelId = stored.startsWith('gemini-') ? stored : 'gemini-2.5-flash';

      // Build LUMEN knowledge context from local DB
      let lumenContext = '';
      try {
        const policies = db.searchPoliciesForAI(message);
        const notes    = db.searchNotesForAI(message);
        const depts    = [...new Set(policies.map((p) => p.department))];
        const contacts = depts.length > 0 ? db.getContactsByDepartments(depts) : [];
        if (policies.length > 0) {
          lumenContext += '\n\n--- BASE DE CONOCIMIENTO LUMEN (politicas relevantes) ---\n';
          lumenContext += policies.slice(0, 5).map((p) =>
            `[${p.name}] ${p.description}\n${(p.content || '').slice(0, 600)}`
          ).join('\n\n');
        }
        if (notes.length > 0) {
          lumenContext += '\n\n--- NOTAS INTERNAS RELEVANTES ---\n';
          lumenContext += notes.slice(0, 3).map((n) =>
            `${n.title}: ${(n.content || '').slice(0, 300)}`
          ).join('\n');
        }
        if (contacts.length > 0) {
          lumenContext += '\n\n--- CONTACTOS RELEVANTES ---\n';
          lumenContext += contacts.slice(0, 5).map((c) =>
            `${c.name} (${c.department || ''})${c.email ? ' — ' + c.email : ''}`
          ).join('\n');
        }
      } catch { /* DB may be empty — continue without context */ }

      const systemInstruction =
        'Eres LU, el asistente inteligente de LUMEN. Tu nombre es LU (tambien puedes ser llamado Lu o lu).\n' +
        'Reglas:\n' +
        '1. Si hay informacion relevante en la BASE DE CONOCIMIENTO LUMEN, usala como fuente primaria y priorizala.\n' +
        '2. Complementa con busqueda en internet cuando sea necesario o cuando LUMEN no tenga el dato.\n' +
        '3. Nunca inventes datos. Si no lo sabes, dilo.\n' +
        '4. Responde siempre en espanol a menos que el usuario hable otro idioma.\n' +
        '5. Se conciso y claro.' +
        lumenContext;

      const genAI = new GoogleGenerativeAI(apiKey);
      const model = genAI.getGenerativeModel({
        model: modelId,
        systemInstruction,
        tools: [{ googleSearch: {} }],
      });
      const chat = model.startChat({ history: history || [] });

      // Build message parts — text + optional inline file (multimodal)
      let messageParts;
      if (fileData && fileData.base64 && fileData.mimeType) {
        messageParts = [
          { inlineData: { mimeType: fileData.mimeType, data: fileData.base64 } },
          { text: message || 'Describe o analiza este archivo.' },
        ];
      } else {
        messageParts = message;
      }

      const result = await chat.sendMessage(messageParts);
      return result.response.text();
    } catch (err) {
      throw new Error(humanizeGeminiError(err));
    }
  });

  // ─── /RAMAS — AI-driven decision-tree edits ─────────────────────────────
  //   Input:  natural-language instruction from Lu (the "/RAMAS" prefix is
  //           stripped by the renderer before calling this).
  //   Output: { intent, summary, branchId?, branch? } preview object that the
  //           renderer shows to the user; if the user accepts, the renderer
  //           applies it via the regular ac3:branches:* handlers.
  ipcMain.handle('ai:proposeBranchEdit', async (_e, instruction) => {
    try {
      const apiKey = getApiKey();
      if (!apiKey) throw new Error('No se ha configurado la API Key de Google AI. Ve a Configuración para agregarla.');
      const stored = db.getSetting('model') || '';
      const modelId = stored.startsWith('gemini-') ? stored : 'gemini-2.5-flash';

      const currentBranches = db.getAllAC3Branches();

      // ─── Local context — políticas, notas, contactos relevantes a la instrucción
      let localContext = '';
      try {
        const policies = db.searchPoliciesForAI(instruction) || [];
        const notes    = db.searchNotesForAI(instruction)    || [];
        const depts    = [...new Set(policies.map((p) => p.department).filter(Boolean))];
        const contacts = depts.length > 0
          ? (db.getContactsByDepartments(depts) || [])
          : (db.getAllContacts() || []).slice(0, 8);

        if (policies.length > 0) {
          localContext += '\n\n--- POLÍTICAS RELEVANTES (Biblioteca) ---\n';
          localContext += policies.slice(0, 5).map((p) =>
            `[${p.name}${p.department ? ' · ' + p.department : ''}] ${p.description || ''}\n${(p.content || '').slice(0, 700)}`
          ).join('\n\n');
        }
        if (notes.length > 0) {
          localContext += '\n\n--- NOTAS INTERNAS RELEVANTES ---\n';
          localContext += notes.slice(0, 4).map((n) =>
            `[${n.title || 'sin título'}] ${(n.content || '').slice(0, 400)}`
          ).join('\n');
        }
        if (contacts.length > 0) {
          localContext += '\n\n--- DIRECTORIO (contactos disponibles para escalación) ---\n';
          localContext += contacts.slice(0, 12).map((c) =>
            `${c.name}${c.department ? ' (' + c.department + ')' : ''}${c.role ? ' — ' + c.role : ''}${c.email ? ' · ' + c.email : ''}${c.phone ? ' · ' + c.phone : ''}`
          ).join('\n');
        }
      } catch { /* DB puede estar vacía — continuar sin contexto */ }

      const systemInstruction =
`Eres LU, el arquitecto del árbol de decisiones de LUMEN. Lucila te da una instrucción en lenguaje natural sobre cómo modificar las ramas. Debes devolver EXCLUSIVAMENTE un objeto JSON válido que describa el cambio propuesto. No añadas texto fuera del JSON. No uses bloques markdown.

Tu trabajo es diseñar la lógica del árbol BASÁNDOTE en el contexto local que recibes (políticas, notas y directorio) y en las reglas que Lucila te dé en su instrucción. Si una política dice cómo se debe manejar un escenario, refléjalo fielmente en los pasos. Si el directorio tiene un contacto especializado, menciónalo en el speech del paso correspondiente. Nunca inventes datos que no aparezcan en el contexto local; si falta información, deja un placeholder claro como "[CONFIRMAR CON LUCILA]".

Esquema del nodo:
  { "id": "string (si existe, reutilízalo; si es nuevo, inventa uno corto tipo 'nX')",
    "title": "pregunta/título visible",
    "instructions": "nota interna para Lu",
    "speech": "qué decir literalmente al cliente",
    "outcome": "resultado final (solo si es nodo hoja), ej '$120.000'",
    "options": [ { "id": "oX", "label": "texto del botón", "next_node_id": "id del nodo destino o null" } ]
  }

Formato de salida (OBLIGATORIO — devuelve solo esto):
{
  "intent": "CREATE" | "UPDATE" | "DELETE" | "NONE",
  "summary": "descripción breve en español de lo que cambiarás",
  "branchId": "id de la rama existente (solo para UPDATE o DELETE)",
  "branch": {
    "name": "nombre de la rama",
    "color": "#hex (#7E3FF2 por defecto)",
    "nodes": [ /* array de nodos según el esquema */ ]
  }
}

Reglas:
- Si la instrucción NO tiene que ver con ramas de decisiones, devuelve { "intent": "NONE", "summary": "..." } explicando por qué.
- Para CREATE: no incluyas branchId.
- Para DELETE: solo incluye intent, summary y branchId.
- Para UPDATE: devuelve el árbol completo resultante (no diffs).
- Los IDs de nodos y opciones deben ser únicos dentro de su ámbito.
- next_node_id solo puede apuntar a nodos que existen en la misma rama (o null).`;

      const userPrompt =
`INSTRUCCIÓN DE LUCILA:
${instruction}
${localContext ? `\n=== CONTEXTO LOCAL DE LUMEN ===${localContext}\n=== FIN DEL CONTEXTO LOCAL ===\n` : '\n(No se encontró contexto local relevante en políticas, notas o directorio.)\n'}
RAMAS ACTUALES (JSON):
${JSON.stringify(currentBranches, null, 2)}

Devuelve el JSON de la propuesta.`;

      const genAI = new GoogleGenerativeAI(apiKey);
      const model = genAI.getGenerativeModel({
        model: modelId,
        systemInstruction,
        generationConfig: {
          responseMimeType: 'application/json',
          temperature: 0.2,
        },
      });
      const result = await model.generateContent(userPrompt);
      const raw = result.response.text().trim();

      let parsed;
      try {
        parsed = JSON.parse(raw);
      } catch {
        // fallback: strip code-fences if Gemini ignored responseMimeType
        const cleaned = raw.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/, '').trim();
        parsed = JSON.parse(cleaned);
      }
      return parsed;
    } catch (err) {
      throw new Error(humanizeGeminiError(err));
    }
  });

  // AC3 — Motor de Decisiones
  ipcMain.handle('ac3:triage', async (_e, caseDesc, options) => {
    try {
      return await triageCase(caseDesc, options || {});
    } catch (err) {
      throw new Error(humanizeGeminiError(err));
    }
  });
  ipcMain.handle('ac3:saveCase', (_e, caseDesc, decision) => {
    return db.createAC3Case({ case_description: caseDesc, ...decision });
  });
  ipcMain.handle('ac3:getCases',        ()            => db.getAllAC3Cases());
  ipcMain.handle('ac3:updateStatus',    (_e, id, st)  => db.updateAC3CaseStatus(id, st));
  ipcMain.handle('ac3:deleteCase',      (_e, id)      => db.deleteAC3Case(id));

  // AC3: image + calendar
  ipcMain.handle('ac3:saveImage', (_e, fileName, base64Data) => {
    const ext      = path.extname(fileName) || '.jpg';
    const safeName = `ac3_${Date.now()}${ext}`;
    const filePath = path.join(ATTACHMENTS_DIR, safeName);
    fs.writeFileSync(filePath, Buffer.from(base64Data, 'base64'));
    return `attachments/${safeName}`;
  });
  ipcMain.handle('ac3:updateImagePath',   (_e, id, p)    => db.updateAC3ImagePath(id, p));
  ipcMain.handle('ac3:updateCalendarId',  (_e, id, calId)=> db.updateAC3CalendarId(id, calId));
  ipcMain.handle('ac3:pushToCalendar', async (_e, decision, caseDesc, imagePath) => {
    const URGENCY_COLOR = { critica: '11', alta: '6', media: '9', baja: '2' };
    const CAT_LABEL     = { finanzas: 'FINANZAS', legal: 'LEGAL', tecnico: 'TÉCNICO', amenidades: 'AMENIDADES' };
    const now      = new Date();
    const deadline = new Date(now.getTime() + (decision.plazo_horas || 24) * 3_600_000);
    const description = [
      `CATEGORÍA: ${CAT_LABEL[decision.categoria] || decision.categoria} | ${decision.tipo_decision}`,
      `URGENCIA: ${(decision.urgencia || '').toUpperCase()} | PLAZO: ${decision.plazo_horas}h`,
      `DRI: ${decision.dri}`,
      '',
      `RESUMEN\n${decision.resumen_ejecutivo}`,
      '',
      `PASOS DE ACCIÓN\n${(decision.pasos_accion || []).map((s, i) => `${i + 1}. ${s}`).join('\n')}`,
      '',
      decision.politica_aplicable  ? `POLÍTICA: ${decision.politica_aplicable}`       : null,
      decision.criterio_escalacion ? `ESCALAR SI: ${decision.criterio_escalacion}`    : null,
      decision.resultado_deseado   ? `RESULTADO: ${decision.resultado_deseado}`        : null,
      decision.contacto_sugerido   ? `CONTACTO: ${decision.contacto_sugerido}`         : null,
      decision.notas_internas      ? `\nNOTAS\n${decision.notas_internas}`             : null,
      imagePath                    ? `[IMAGEN: ${imagePath}]`                          : null,
      '─────────────────',
      'Registrado por LUMEN AC3',
      `Caso: ${(caseDesc || '').slice(0, 180)}${(caseDesc || '').length > 180 ? '…' : ''}`,
    ].filter(Boolean).join('\n');

    const event = {
      summary:     `[AC3] ${CAT_LABEL[decision.categoria] || 'CASO'} — ${decision.resumen_ejecutivo}`,
      description,
      start:       { dateTime: now.toISOString() },
      end:         { dateTime: deadline.toISOString() },
      colorId:     URGENCY_COLOR[decision.urgencia] || '9',
      extendedProperties: {
        private: {
          lumenAC3:       'true',
          lumenCategoria: decision.categoria || '',
          lumenUrgencia:  decision.urgencia  || '',
          lumenImagePath: imagePath          || '',
        },
      },
    };
    return await cal.createEvent(event);
  });

  // AC3 Branches
  ipcMain.handle('ac3:branches:getAll',    ()            => db.getAllAC3Branches());
  ipcMain.handle('ac3:branches:create',    (_e, data)    => db.createAC3Branch(data));
  ipcMain.handle('ac3:branches:update',    (_e, id, data)=> db.updateAC3Branch(id, data));
  ipcMain.handle('ac3:branches:delete',    (_e, id)      => db.deleteAC3Branch(id));

  // AC3 Text Templates
  ipcMain.handle('ac3:textTemplates:getAll',   ()            => db.getAllAC3TextTemplates());
  ipcMain.handle('ac3:textTemplates:create',   (_e, data)    => db.createAC3TextTemplate(data));
  ipcMain.handle('ac3:textTemplates:update',   (_e, id, data)=> db.updateAC3TextTemplate(id, data));
  ipcMain.handle('ac3:textTemplates:delete',   (_e, id)      => db.deleteAC3TextTemplate(id));

  // AC3 Email Templates
  ipcMain.handle('ac3:emailTemplates:getAll',        ()            => db.getAC3EmailTemplates(null));
  ipcMain.handle('ac3:emailTemplates:getByBranch',   (_e, bId)     => db.getAC3EmailTemplates(bId));
  ipcMain.handle('ac3:emailTemplates:create',        (_e, data)    => db.createAC3EmailTemplate(data));
  ipcMain.handle('ac3:emailTemplates:update',        (_e, id, data)=> db.updateAC3EmailTemplate(id, data));
  ipcMain.handle('ac3:emailTemplates:delete',        (_e, id)      => db.deleteAC3EmailTemplate(id));

  // Quick Search
  ipcMain.handle('quick-search', (_e, query) => db.quickSearch(query));

  // Clients
  ipcMain.handle('clients:getAll',    ()            => db.getAllClients());
  ipcMain.handle('clients:search',    (_e, q)       => db.searchClients(q));
  ipcMain.handle('clients:create',    (_e, data)    => db.createClient(data));
  ipcMain.handle('clients:update',    (_e, id, data)=> db.updateClient(id, data));

  // Turns
  ipcMain.handle('turns:getActive',   ()            => db.getActiveTurn());
  ipcMain.handle('turns:create',      ()            => db.createTurn());
  ipcMain.handle('turns:close',       (_e, id, sum) => db.closeTurn(id, sum));
  ipcMain.handle('turns:getHistory',  ()            => db.getTurnHistory());

  // Cases
  ipcMain.handle('cases:create',      (_e, data)    => db.createCase(data));
  ipcMain.handle('cases:getById',     (_e, id)      => db.getCaseById(id));
  ipcMain.handle('cases:update',      (_e, id, data)=> db.updateCase(id, data));
  ipcMain.handle('cases:close',       (_e, id, data)=> db.closeCase(id, data));
  ipcMain.handle('cases:getLastForClient', (_e, clientId, limit) => db.getLastCasesForClient(clientId, limit));
  ipcMain.handle('cases:search',      (_e, filters) => db.searchCases(filters || {}));

  // Speeches
  ipcMain.handle('ac3:speeches:getAll',   ()             => db.getAllSpeeches());
  ipcMain.handle('ac3:speeches:create',   (_e, data)     => db.createSpeech(data));
  ipcMain.handle('ac3:speeches:update',   (_e, id, data) => db.updateSpeech(id, data));
  ipcMain.handle('ac3:speeches:delete',   (_e, id)       => db.deleteSpeech(id));

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
  // Serve local files via lumen:// (evidences, attachments)
  protocol.registerFileProtocol('lumen', (request, callback) => {
    const rawUrl = request.url.replace(/^lumen:\/\//, '');
    const decoded = decodeURIComponent(rawUrl);
    // Security: only allow files inside userData
    const filePath = path.join(app.getPath('userData'), decoded);
    const userData = app.getPath('userData');
    if (!filePath.startsWith(userData)) {
      callback({ error: -10 }); // net::ERR_ACCESS_DENIED
      return;
    }
    callback({ path: filePath });
  });

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
