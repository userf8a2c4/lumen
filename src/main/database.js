const path = require('path');
const fs = require('fs');
const { app } = require('electron');

let db = null;
let dbPath = '';

function getDbPath() {
  if (app.isPackaged) {
    return path.join(app.getPath('userData'), 'lumen.db');
  }
  return path.join(__dirname, '../../lumen.db');
}

function getWasmPath() {
  if (app.isPackaged) {
    return path.join(process.resourcesPath, 'app.asar.unpacked', 'node_modules', 'sql.js', 'dist', 'sql-wasm.wasm');
  }
  return path.join(__dirname, '../../node_modules/sql.js/dist/sql-wasm.wasm');
}

async function initDatabase() {
  const initSqlJs = require('sql.js');

  const wasmBinary = fs.readFileSync(getWasmPath());
  const SQL = await initSqlJs({ wasmBinary });

  dbPath = getDbPath();

  if (fs.existsSync(dbPath)) {
    const buffer = fs.readFileSync(dbPath);
    db = new SQL.Database(buffer);
  } else {
    db = new SQL.Database();
  }

  db.run('PRAGMA journal_mode = WAL');
  db.run('PRAGMA foreign_keys = ON');

  db.run(`
    CREATE TABLE IF NOT EXISTS policies (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      department TEXT NOT NULL,
      description TEXT NOT NULL DEFAULT '',
      content TEXT NOT NULL,
      source_url TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS contacts (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      last_name TEXT NOT NULL DEFAULT '',
      company TEXT NOT NULL DEFAULT '',
      department TEXT NOT NULL DEFAULT '',
      phones TEXT NOT NULL DEFAULT '[]',
      emails TEXT NOT NULL DEFAULT '[]',
      urls TEXT NOT NULL DEFAULT '[]',
      addresses TEXT NOT NULL DEFAULT '[]',
      birthday TEXT,
      relationship TEXT NOT NULL DEFAULT '',
      social_facebook TEXT NOT NULL DEFAULT '',
      social_x TEXT NOT NULL DEFAULT '',
      social_instagram TEXT NOT NULL DEFAULT '',
      social_slack TEXT NOT NULL DEFAULT '',
      social_linkedin TEXT NOT NULL DEFAULT '',
      contact_method TEXT NOT NULL DEFAULT '',
      when_to_contact TEXT NOT NULL DEFAULT '',
      notes TEXT NOT NULL DEFAULT '',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS example_cases (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      policy_id INTEGER NOT NULL,
      problem_description TEXT NOT NULL,
      response_used TEXT NOT NULL,
      result TEXT NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (policy_id) REFERENCES policies(id) ON DELETE CASCADE
    )
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS notes (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT NOT NULL,
      content TEXT NOT NULL DEFAULT '',
      tags TEXT NOT NULL DEFAULT '[]',
      attachments TEXT NOT NULL DEFAULT '[]',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS settings (
      key TEXT PRIMARY KEY,
      value TEXT NOT NULL
    )
  `);

  // Migrate old contacts table if needed (add new columns)
  try {
    db.run('ALTER TABLE contacts ADD COLUMN last_name TEXT NOT NULL DEFAULT ""');
  } catch {}
  try {
    db.run('ALTER TABLE contacts ADD COLUMN company TEXT NOT NULL DEFAULT ""');
  } catch {}
  try {
    db.run('ALTER TABLE contacts ADD COLUMN phones TEXT NOT NULL DEFAULT "[]"');
  } catch {}
  try {
    db.run('ALTER TABLE contacts ADD COLUMN emails TEXT NOT NULL DEFAULT "[]"');
  } catch {}
  try {
    db.run('ALTER TABLE contacts ADD COLUMN urls TEXT NOT NULL DEFAULT "[]"');
  } catch {}
  try {
    db.run('ALTER TABLE contacts ADD COLUMN addresses TEXT NOT NULL DEFAULT "[]"');
  } catch {}
  try {
    db.run('ALTER TABLE contacts ADD COLUMN birthday TEXT');
  } catch {}
  try {
    db.run('ALTER TABLE contacts ADD COLUMN relationship TEXT NOT NULL DEFAULT ""');
  } catch {}
  try {
    db.run('ALTER TABLE contacts ADD COLUMN social_facebook TEXT NOT NULL DEFAULT ""');
  } catch {}
  try {
    db.run('ALTER TABLE contacts ADD COLUMN social_x TEXT NOT NULL DEFAULT ""');
  } catch {}
  try {
    db.run('ALTER TABLE contacts ADD COLUMN social_instagram TEXT NOT NULL DEFAULT ""');
  } catch {}
  try {
    db.run('ALTER TABLE contacts ADD COLUMN social_slack TEXT NOT NULL DEFAULT ""');
  } catch {}
  try {
    db.run('ALTER TABLE contacts ADD COLUMN social_linkedin TEXT NOT NULL DEFAULT ""');
  } catch {}
  try {
    db.run('ALTER TABLE contacts ADD COLUMN notes TEXT NOT NULL DEFAULT ""');
  } catch {}

  // Default settings
  const existing = queryOne('SELECT key FROM settings WHERE key = ?', ['model']);
  if (!existing) {
    db.run('INSERT INTO settings (key, value) VALUES (?, ?)', ['model', 'claude-sonnet-4-20250514']);
  }

  save();
  return db;
}

// --- Helpers ---

function save() {
  if (!db) return;
  const data = db.export();
  fs.writeFileSync(dbPath, Buffer.from(data));
}

function queryAll(sql, params = []) {
  const stmt = db.prepare(sql);
  if (params.length) stmt.bind(params);
  const rows = [];
  while (stmt.step()) {
    rows.push(stmt.getAsObject());
  }
  stmt.free();
  return rows;
}

function queryOne(sql, params = []) {
  const rows = queryAll(sql, params);
  return rows[0] || null;
}

function runAndSave(sql, params = []) {
  db.run(sql, params);
  save();
}

function getLastId() {
  const result = db.exec('SELECT last_insert_rowid()');
  return result[0].values[0][0];
}

// --- Policies ---

function getAllPolicies() {
  return queryAll('SELECT * FROM policies ORDER BY updated_at DESC');
}

function getPolicyById(id) {
  return queryOne('SELECT * FROM policies WHERE id = ?', [id]);
}

function createPolicy({ name, department, description, content, source_url }) {
  runAndSave(
    'INSERT INTO policies (name, department, description, content, source_url) VALUES (?, ?, ?, ?, ?)',
    [name, department, description || '', content, source_url || null]
  );
  return getPolicyById(getLastId());
}

function updatePolicy(id, { name, department, description, content, source_url }) {
  runAndSave(
    'UPDATE policies SET name=?, department=?, description=?, content=?, source_url=?, updated_at=CURRENT_TIMESTAMP WHERE id=?',
    [name, department, description || '', content, source_url || null, id]
  );
  return getPolicyById(id);
}

function deletePolicy(id) {
  runAndSave('DELETE FROM policies WHERE id = ?', [id]);
}

function searchPolicies(query, department) {
  if (!query || query.trim().length === 0) {
    if (department) {
      return queryAll('SELECT * FROM policies WHERE department = ? ORDER BY updated_at DESC', [department]);
    }
    return getAllPolicies();
  }

  const words = query.trim().split(/\s+/).filter((w) => w.length > 1);
  if (words.length === 0) return getAllPolicies();

  const conditions = words.map(() => '(name LIKE ? OR description LIKE ? OR content LIKE ?)');
  const params = [];
  words.forEach((w) => {
    const like = `%${w}%`;
    params.push(like, like, like);
  });

  let sql = `SELECT * FROM policies WHERE (${conditions.join(' AND ')})`;
  if (department) {
    sql += ' AND department = ?';
    params.push(department);
  }
  sql += ' ORDER BY updated_at DESC LIMIT 50';

  const results = queryAll(sql, params);

  return results.map((r) => {
    const content = r.content || '';
    let snippet = '';
    for (const w of words) {
      const idx = content.toLowerCase().indexOf(w.toLowerCase());
      if (idx !== -1) {
        const start = Math.max(0, idx - 60);
        const end = Math.min(content.length, idx + w.length + 60);
        snippet = (start > 0 ? '...' : '') +
          content.slice(start, idx) +
          '{{HL}}' + content.slice(idx, idx + w.length) + '{{/HL}}' +
          content.slice(idx + w.length, end) +
          (end < content.length ? '...' : '');
        break;
      }
    }
    return { ...r, snippet };
  });
}

function searchPoliciesForAI(query) {
  const words = query.trim().split(/\s+/).filter((w) => w.length > 2);
  if (words.length === 0) return [];

  const conditions = words.map(() => '(name LIKE ? OR content LIKE ? OR description LIKE ?)');
  const params = [];
  words.forEach((w) => {
    const like = `%${w}%`;
    params.push(like, like, like);
  });

  return queryAll(
    `SELECT * FROM policies WHERE (${conditions.join(' OR ')}) LIMIT 5`,
    params
  );
}

function getDepartments() {
  return queryAll('SELECT DISTINCT department FROM policies ORDER BY department').map((r) => r.department);
}

// --- Contacts ---

function getAllContacts() {
  return queryAll('SELECT * FROM contacts ORDER BY name ASC');
}

function createContact(data) {
  runAndSave(
    `INSERT INTO contacts (name, last_name, company, department, phones, emails, urls, addresses, birthday, relationship,
     social_facebook, social_x, social_instagram, social_slack, social_linkedin, contact_method, when_to_contact, notes)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      data.name, data.last_name || '', data.company || '', data.department || '',
      JSON.stringify(data.phones || []), JSON.stringify(data.emails || []),
      JSON.stringify(data.urls || []), JSON.stringify(data.addresses || []),
      data.birthday || null, data.relationship || '',
      data.social_facebook || '', data.social_x || '', data.social_instagram || '',
      data.social_slack || '', data.social_linkedin || '',
      data.contact_method || '', data.when_to_contact || '', data.notes || '',
    ]
  );
  return queryOne('SELECT * FROM contacts WHERE id = ?', [getLastId()]);
}

function updateContact(id, data) {
  runAndSave(
    `UPDATE contacts SET name=?, last_name=?, company=?, department=?, phones=?, emails=?, urls=?, addresses=?,
     birthday=?, relationship=?, social_facebook=?, social_x=?, social_instagram=?, social_slack=?, social_linkedin=?,
     contact_method=?, when_to_contact=?, notes=?, updated_at=CURRENT_TIMESTAMP WHERE id=?`,
    [
      data.name, data.last_name || '', data.company || '', data.department || '',
      JSON.stringify(data.phones || []), JSON.stringify(data.emails || []),
      JSON.stringify(data.urls || []), JSON.stringify(data.addresses || []),
      data.birthday || null, data.relationship || '',
      data.social_facebook || '', data.social_x || '', data.social_instagram || '',
      data.social_slack || '', data.social_linkedin || '',
      data.contact_method || '', data.when_to_contact || '', data.notes || '', id,
    ]
  );
  return queryOne('SELECT * FROM contacts WHERE id = ?', [id]);
}

function deleteContact(id) {
  runAndSave('DELETE FROM contacts WHERE id = ?', [id]);
}

function searchContacts(query) {
  if (!query || query.trim().length === 0) return getAllContacts();
  const like = `%${query}%`;
  return queryAll(
    'SELECT * FROM contacts WHERE name LIKE ? OR last_name LIKE ? OR department LIKE ? OR company LIKE ? OR when_to_contact LIKE ? OR notes LIKE ? ORDER BY name ASC',
    [like, like, like, like, like, like]
  );
}

function getContactsByDepartments(departments) {
  if (!departments || departments.length === 0) return [];
  const placeholders = departments.map(() => '?').join(',');
  return queryAll(
    `SELECT * FROM contacts WHERE department IN (${placeholders}) ORDER BY name ASC`,
    departments
  );
}

// --- Example Cases ---

function getExamplesByPolicy(policyId) {
  return queryAll('SELECT * FROM example_cases WHERE policy_id = ? ORDER BY created_at DESC', [policyId]);
}

function getExamplesForPolicies(policyIds) {
  if (!policyIds || policyIds.length === 0) return [];
  const placeholders = policyIds.map(() => '?').join(',');
  return queryAll(
    `SELECT ec.*, p.name as policy_name FROM example_cases ec
     JOIN policies p ON p.id = ec.policy_id
     WHERE ec.policy_id IN (${placeholders})
     ORDER BY ec.created_at DESC`,
    policyIds
  );
}

function createExample({ policy_id, problem_description, response_used, result }) {
  runAndSave(
    'INSERT INTO example_cases (policy_id, problem_description, response_used, result) VALUES (?, ?, ?, ?)',
    [policy_id, problem_description, response_used, result]
  );
  return queryOne('SELECT * FROM example_cases WHERE id = ?', [getLastId()]);
}

function deleteExample(id) {
  runAndSave('DELETE FROM example_cases WHERE id = ?', [id]);
}

// --- Notes ---

function getAllNotes() {
  return queryAll('SELECT * FROM notes ORDER BY updated_at DESC');
}

function getNoteById(id) {
  return queryOne('SELECT * FROM notes WHERE id = ?', [id]);
}

function createNote({ title, content, tags, attachments }) {
  runAndSave(
    'INSERT INTO notes (title, content, tags, attachments) VALUES (?, ?, ?, ?)',
    [title, content || '', JSON.stringify(tags || []), JSON.stringify(attachments || [])]
  );
  return getNoteById(getLastId());
}

function updateNote(id, { title, content, tags, attachments }) {
  runAndSave(
    'UPDATE notes SET title=?, content=?, tags=?, attachments=?, updated_at=CURRENT_TIMESTAMP WHERE id=?',
    [title, content || '', JSON.stringify(tags || []), JSON.stringify(attachments || []), id]
  );
  return getNoteById(id);
}

function deleteNote(id) {
  runAndSave('DELETE FROM notes WHERE id = ?', [id]);
}

function searchNotes(query) {
  if (!query || query.trim().length === 0) return getAllNotes();
  const like = `%${query}%`;
  return queryAll(
    'SELECT * FROM notes WHERE title LIKE ? OR content LIKE ? OR tags LIKE ? ORDER BY updated_at DESC',
    [like, like, like]
  );
}

function searchNotesForAI(query) {
  const words = query.trim().split(/\s+/).filter((w) => w.length > 2);
  if (words.length === 0) return [];
  const conditions = words.map(() => '(title LIKE ? OR content LIKE ?)');
  const params = [];
  words.forEach((w) => {
    const like = `%${w}%`;
    params.push(like, like);
  });
  return queryAll(
    `SELECT * FROM notes WHERE (${conditions.join(' OR ')}) LIMIT 5`,
    params
  );
}

// --- Settings ---

function getSetting(key) {
  const row = queryOne('SELECT value FROM settings WHERE key = ?', [key]);
  return row ? row.value : null;
}

function setSetting(key, value) {
  runAndSave('INSERT OR REPLACE INTO settings (key, value) VALUES (?, ?)', [key, value]);
}

function closeDatabase() {
  if (db) {
    save();
    db.close();
    db = null;
  }
}

module.exports = {
  initDatabase,
  closeDatabase,
  getAllPolicies,
  getPolicyById,
  createPolicy,
  updatePolicy,
  deletePolicy,
  searchPolicies,
  searchPoliciesForAI,
  getDepartments,
  getAllContacts,
  createContact,
  updateContact,
  deleteContact,
  searchContacts,
  getContactsByDepartments,
  getExamplesByPolicy,
  getExamplesForPolicies,
  createExample,
  deleteExample,
  getAllNotes,
  getNoteById,
  createNote,
  updateNote,
  deleteNote,
  searchNotes,
  searchNotesForAI,
  getSetting,
  setSetting,
};
