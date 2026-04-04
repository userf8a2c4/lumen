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
      department TEXT NOT NULL,
      contact_method TEXT NOT NULL,
      when_to_contact TEXT NOT NULL,
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
    CREATE TABLE IF NOT EXISTS settings (
      key TEXT PRIMARY KEY,
      value TEXT NOT NULL
    )
  `);

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

  // Build LIKE conditions for each word (match in name, description, or content)
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

  // Add snippet with highlights
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

function createContact({ name, department, contact_method, when_to_contact }) {
  runAndSave(
    'INSERT INTO contacts (name, department, contact_method, when_to_contact) VALUES (?, ?, ?, ?)',
    [name, department, contact_method, when_to_contact]
  );
  return queryOne('SELECT * FROM contacts WHERE id = ?', [getLastId()]);
}

function updateContact(id, { name, department, contact_method, when_to_contact }) {
  runAndSave(
    'UPDATE contacts SET name=?, department=?, contact_method=?, when_to_contact=?, updated_at=CURRENT_TIMESTAMP WHERE id=?',
    [name, department, contact_method, when_to_contact, id]
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
    'SELECT * FROM contacts WHERE name LIKE ? OR department LIKE ? OR when_to_contact LIKE ? ORDER BY name ASC',
    [like, like, like]
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
  getSetting,
  setSetting,
};
