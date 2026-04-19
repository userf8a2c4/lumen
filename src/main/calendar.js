/**
 * LUMEN — Google Calendar Integration
 * OAuth 2.0 loopback flow (Desktop Application type)
 * REST API via Node.js built-in https module
 */

const https = require('https');
const http  = require('http');
const path  = require('path');
const fs    = require('fs');
const { app, shell, safeStorage } = require('electron');

const TOKENS_PATH  = path.join(app.getPath('userData'), '.gcal-tokens');
const OAUTH_SCOPES = 'https://www.googleapis.com/auth/calendar';
const CAL_HOST     = 'www.googleapis.com';
const TOKEN_HOST   = 'oauth2.googleapis.com';

// ─── OAuth App Credentials ────────────────────────────────────────────────────
// Loaded from gcal-config.js (gitignored, injected at build time via CI secrets)
// or from environment variables if set.
let _gcalCfg = {};
try { _gcalCfg = require('./gcal-config'); } catch { /* no local config — use env */ }
const GOOGLE_CLIENT_ID     = process.env.GOOGLE_CLIENT_ID     || _gcalCfg.GOOGLE_CLIENT_ID     || '';
const GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET || _gcalCfg.GOOGLE_CLIENT_SECRET || '';

// ─── Token persistence ───────────────────────────────────────────────────────

function saveTokens(tokens) {
  const encrypted = safeStorage.encryptString(JSON.stringify(tokens));
  fs.writeFileSync(TOKENS_PATH, encrypted);
}

function loadTokens() {
  if (!fs.existsSync(TOKENS_PATH)) return null;
  try {
    const enc = fs.readFileSync(TOKENS_PATH);
    return JSON.parse(safeStorage.decryptString(enc));
  } catch { return null; }
}

// ─── HTTP helpers ─────────────────────────────────────────────────────────────

function postForm(hostname, path, body) {
  return new Promise((resolve, reject) => {
    const payload = new URLSearchParams(body).toString();
    const req = https.request({
      hostname, path, method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Content-Length': Buffer.byteLength(payload),
      },
    }, (res) => {
      let data = '';
      res.on('data', (c) => { data += c; });
      res.on('end', () => {
        try {
          const json = JSON.parse(data);
          if (json.error) reject(new Error(json.error_description || json.error));
          else resolve(json);
        } catch (e) { reject(e); }
      });
    });
    req.on('error', reject);
    req.write(payload);
    req.end();
  });
}

function apiReq(method, apiPath, accessToken, body = null) {
  return new Promise((resolve, reject) => {
    const payload = body ? JSON.stringify(body) : null;
    const headers = {
      Authorization: `Bearer ${accessToken}`,
      Accept: 'application/json',
      'User-Agent': 'LUMEN-App',
    };
    if (payload) {
      headers['Content-Type'] = 'application/json';
      headers['Content-Length'] = Buffer.byteLength(payload);
    }
    const req = https.request({ hostname: CAL_HOST, path: apiPath, method, headers },
      (res) => {
        let data = '';
        res.on('data', (c) => { data += c; });
        res.on('end', () => {
          try { resolve(data ? JSON.parse(data) : {}); }
          catch (e) { reject(e); }
        });
      });
    req.on('error', reject);
    if (payload) req.write(payload);
    req.end();
  });
}

// ─── Token refresh ────────────────────────────────────────────────────────────

async function refreshTokens() {
  const tokens = loadTokens();
  if (!tokens?.refresh_token) throw new Error('Sin refresh_token. Reconecta el calendario.');

  const json = await postForm(TOKEN_HOST, '/token', {
    refresh_token: tokens.refresh_token,
    client_id: GOOGLE_CLIENT_ID,
    client_secret: GOOGLE_CLIENT_SECRET,
    grant_type: 'refresh_token',
  });

  const updated = {
    ...tokens,
    access_token: json.access_token,
    expires_at: Date.now() + json.expires_in * 1000,
  };
  saveTokens(updated);
  return updated;
}

async function getAccessToken() {
  let tokens = loadTokens();
  if (!tokens?.access_token) {
    throw new Error('No autenticado. Conecta Google Calendar en Configuracion.');
  }
  // Refresh if expiring within 5 min
  if (!tokens.expires_at || tokens.expires_at < Date.now() + 300_000) {
    tokens = await refreshTokens();
  }
  return tokens.access_token;
}

// ─── OAuth flow (loopback) ────────────────────────────────────────────────────

function startOAuth() {
  if (!GOOGLE_CLIENT_ID || !GOOGLE_CLIENT_SECRET) {
    return Promise.reject(new Error('Credenciales OAuth no configuradas. Contacta al administrador de LUMEN.'));
  }
  return new Promise((resolve, reject) => {
    const server = http.createServer();
    server.listen(0, '127.0.0.1', () => {
      const port = server.address().port;
      const redirectUri = `http://127.0.0.1:${port}/callback`;

      const authUrl =
        'https://accounts.google.com/o/oauth2/v2/auth?' +
        new URLSearchParams({
          client_id: GOOGLE_CLIENT_ID,
          redirect_uri: redirectUri,
          response_type: 'code',
          scope: OAUTH_SCOPES,
          access_type: 'offline',
          prompt: 'consent',
        }).toString();

      shell.openExternal(authUrl);

      const timeout = setTimeout(() => {
        server.close();
        reject(new Error('Tiempo de espera agotado. Intenta nuevamente.'));
      }, 120_000); // 2 min

      server.on('request', async (req, res) => {
        const url = new URL(req.url, `http://127.0.0.1:${port}`);
        if (url.pathname !== '/callback') { res.end(); return; }

        clearTimeout(timeout);
        const code  = url.searchParams.get('code');
        const error = url.searchParams.get('error');

        res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
        if (error) {
          res.end(`<html><body style="font-family:sans-serif;text-align:center;padding:60px;background:#0a0a0f;color:#e8e8ed">
            <h2 style="color:#ef4444">Error al conectar</h2>
            <p>${error}</p><p>Puedes cerrar esta ventana.</p>
          </body></html>`);
          server.close();
          reject(new Error(error));
          return;
        }

        res.end(`<html><body style="font-family:sans-serif;text-align:center;padding:60px;background:#0a0a0f;color:#e8e8ed">
          <h2 style="color:#7E3FF2">✓ Google Calendar conectado</h2>
          <p>Puedes cerrar esta ventana y regresar a LUMEN.</p>
          <script>setTimeout(()=>window.close(),2000)</script>
        </body></html>`);
        server.close();

        try {
          const json = await postForm(TOKEN_HOST, '/token', {
            code,
            client_id: GOOGLE_CLIENT_ID,
            client_secret: GOOGLE_CLIENT_SECRET,
            redirect_uri: redirectUri,
            grant_type: 'authorization_code',
          });
          const tokens = {
            access_token: json.access_token,
            refresh_token: json.refresh_token,
            expires_at: Date.now() + json.expires_in * 1000,
          };
          saveTokens(tokens);
          resolve(tokens);
        } catch (e) { reject(e); }
      });
    });
    server.on('error', reject);
  });
}

// ─── Calendar API ─────────────────────────────────────────────────────────────

async function getEvents(daysAhead = 14) {
  const token  = await getAccessToken();
  const tMin   = new Date().toISOString();
  const tMax   = new Date(Date.now() + daysAhead * 86_400_000).toISOString();
  const params = new URLSearchParams({
    timeMin: tMin, timeMax: tMax,
    singleEvents: 'true', orderBy: 'startTime', maxResults: '100',
  }).toString();
  return apiReq('GET', `/calendar/v3/calendars/primary/events?${params}`, token);
}

async function createEvent(eventData) {
  const token = await getAccessToken();
  return apiReq('POST', '/calendar/v3/calendars/primary/events', token, eventData);
}

async function updateEvent(eventId, eventData) {
  const token = await getAccessToken();
  return apiReq('PATCH', `/calendar/v3/calendars/primary/events/${encodeURIComponent(eventId)}`, token, eventData);
}

async function deleteEvent(eventId) {
  const token = await getAccessToken();
  return apiReq('DELETE', `/calendar/v3/calendars/primary/events/${encodeURIComponent(eventId)}`, token);
}

function isAuthenticated() {
  const t = loadTokens();
  return !!(t?.access_token);
}

function disconnect() {
  if (fs.existsSync(TOKENS_PATH)) fs.unlinkSync(TOKENS_PATH);
}

module.exports = { startOAuth, getEvents, createEvent, updateEvent, deleteEvent, isAuthenticated, disconnect };
