// ─────────────────────────────────────────────────────────────
//  LUMEN auto-updater  (electron-updater + GitHub releases)
//
//  Behaviour:
//   • On startup, check GitHub for a newer release.
//   • If found → download AUTOMATICALLY in background (differential
//     via .blockmap when possible → typically 3–10 MB instead of 80 MB).
//   • When download finishes → notify renderer; user clicks "Reiniciar"
//     to apply. NSIS runs silently, relaunches LUMEN. User data at
//     %APPDATA%\Roaming\lumen-app\ is preserved.
//
//  IPC surface is kept identical to the previous hand-rolled updater
//  so preload.js / renderer do not need changes.
// ─────────────────────────────────────────────────────────────

const { app } = require('electron');
const { autoUpdater } = require('electron-updater');

let mainWindow = null;
let updateInfo = null;          // last update-available payload
let isDownloaded = false;

// ─── Config ────────────────────────────────────────────────
autoUpdater.autoDownload = true;          // background download w/o asking
autoUpdater.autoInstallOnAppQuit = false; // we install on explicit user action
autoUpdater.allowPrerelease = false;
autoUpdater.allowDowngrade = false;

// Silence verbose default logger; rely on renderer events for UX.
autoUpdater.logger = null;

// ─── Helpers ───────────────────────────────────────────────
function sendToRenderer(channel, data) {
  if (mainWindow && !mainWindow.isDestroyed()) {
    mainWindow.webContents.send(channel, data);
  }
}

// ─── Event wiring ─────────────────────────────────────────
function wireEvents() {
  autoUpdater.on('checking-for-update', () => {
    // noisy, skip
  });

  autoUpdater.on('update-available', (info) => {
    updateInfo = info;
    isDownloaded = false;
    sendToRenderer('update-available', {
      version: info.version,
      releaseDate: info.releaseDate,
      releaseNotes: typeof info.releaseNotes === 'string' ? info.releaseNotes : '',
    });
  });

  autoUpdater.on('update-not-available', () => {
    sendToRenderer('update-not-available');
  });

  autoUpdater.on('download-progress', (p) => {
    sendToRenderer('download-progress', {
      percent: Math.round(p.percent || 0),
      transferred: p.transferred || 0,
      total: p.total || 0,
      bytesPerSecond: p.bytesPerSecond || 0,
    });
  });

  autoUpdater.on('update-downloaded', (info) => {
    isDownloaded = true;
    sendToRenderer('update-downloaded', { version: info.version });
  });

  autoUpdater.on('error', (err) => {
    sendToRenderer('update-error', (err && err.message) || 'Error desconocido');
  });
}

// ─── Public API (same names as before) ────────────────────
function initUpdater(win) {
  mainWindow = win;
  wireEvents();

  // Small delay so renderer has subscribed to events.
  setTimeout(() => {
    autoUpdater.checkForUpdates().catch(() => {});
  }, 5000);
}

function checkForUpdates() {
  return autoUpdater.checkForUpdates().catch((err) => {
    sendToRenderer('update-error', err.message);
    throw err;
  });
}

// Kept for IPC compatibility. With autoDownload=true this is a no-op
// most of the time; if called before an update was detected, trigger
// a check first, then let autoDownload handle it.
function downloadUpdate() {
  if (isDownloaded) {
    sendToRenderer('update-downloaded', { version: updateInfo?.version });
    return Promise.resolve();
  }
  return autoUpdater.downloadUpdate().catch((err) => {
    sendToRenderer('update-error', err.message);
    throw err;
  });
}

function installUpdate() {
  if (!isDownloaded) {
    sendToRenderer('update-error', 'La actualización aún no ha terminado de descargarse.');
    return;
  }
  // Give renderer a moment to show "installing…" state, then quit.
  // isSilent=true  → oneClick NSIS runs with /S (no wizard, no freeze).
  // isForceRunAfter=true → relaunch LUMEN automatically after install.
  setTimeout(() => {
    autoUpdater.quitAndInstall(true, true);
  }, 500);
}

module.exports = { initUpdater, checkForUpdates, downloadUpdate, installUpdate };
