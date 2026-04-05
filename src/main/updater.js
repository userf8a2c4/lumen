const { app, shell } = require('electron');
const http = require('http');
const https = require('https');
const fs = require('fs');
const path = require('path');
const { spawn } = require('child_process');

const REPO_OWNER = 'userf8a2c4';
const REPO_NAME = 'lumen';
const MAX_REDIRECTS = 10;
const MAX_RETRIES = 3;
const STALL_TIMEOUT = 30000; // 30s without data = stalled

let mainWindow = null;
let latestRelease = null;
let downloadedFilePath = null;
let isDownloading = false;

// ─── Init ───────────────────────────────────────────────

function initUpdater(win) {
  mainWindow = win;
  setTimeout(() => {
    checkForUpdates().catch(() => {});
  }, 5000);
}

// ─── Check for updates ─────────────────────────────────

function checkForUpdates() {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'api.github.com',
      path: `/repos/${REPO_OWNER}/${REPO_NAME}/releases/latest`,
      headers: { 'User-Agent': 'LUMEN-App', Accept: 'application/vnd.github.v3+json' },
    };

    https
      .get(options, (res) => {
        let data = '';
        res.on('data', (chunk) => (data += chunk));
        res.on('end', () => {
          try {
            if (res.statusCode !== 200) {
              sendToRenderer('update-error', `GitHub API: ${res.statusCode}`);
              reject(new Error(`GitHub API ${res.statusCode}`));
              return;
            }

            const release = JSON.parse(data);
            const latestVersion = (release.tag_name || '').replace(/^v/, '');
            const currentVersion = app.getVersion();

            if (isNewerVersion(latestVersion, currentVersion)) {
              const exeAsset = release.assets?.find(
                (a) => a.name.endsWith('.exe') && !a.name.endsWith('.blockmap')
              );

              latestRelease = {
                version: latestVersion,
                downloadUrl: exeAsset?.browser_download_url || null,
                fileName: exeAsset?.name || 'LUMEN-Setup.exe',
                fileSize: exeAsset?.size || 0,
                releaseNotes: release.body || '',
                releaseDate: release.published_at,
              };

              sendToRenderer('update-available', {
                version: latestVersion,
                releaseDate: release.published_at,
                releaseNotes: release.body || '',
              });
              resolve(latestRelease);
            } else {
              sendToRenderer('update-not-available');
              resolve(null);
            }
          } catch (e) {
            sendToRenderer('update-error', e.message);
            reject(e);
          }
        });
      })
      .on('error', (err) => {
        sendToRenderer('update-error', err.message);
        reject(err);
      });
  });
}

// ─── HTTP(S) GET with redirect following ───────────────

function httpGet(url, redirectCount) {
  if (redirectCount === undefined) redirectCount = 0;
  return new Promise((resolve, reject) => {
    if (redirectCount > MAX_REDIRECTS) {
      reject(new Error('Too many redirects'));
      return;
    }
    const parsed = new URL(url);
    const mod = parsed.protocol === 'https:' ? https : http;
    const req = mod.get(url, { headers: { 'User-Agent': 'LUMEN-App' } }, (res) => {
      if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
        res.resume();
        resolve(httpGet(res.headers.location, redirectCount + 1));
        return;
      }
      resolve(res);
    });
    req.on('error', reject);
    req.setTimeout(30000, () => {
      req.destroy(new Error('Connection timeout'));
    });
  });
}

// ─── Download update using Node.js https ───────────────

function downloadUpdate() {
  if (!latestRelease || !latestRelease.downloadUrl) {
    sendToRenderer('update-error', 'No hay URL de descarga disponible.');
    return Promise.reject(new Error('No download URL'));
  }

  if (isDownloading) {
    return Promise.reject(new Error('Download already in progress'));
  }
  isDownloading = true;

  const tempDir = app.getPath('temp');
  const filePath = path.join(tempDir, latestRelease.fileName);

  // Clean up any previous partial download
  try { if (fs.existsSync(filePath)) fs.unlinkSync(filePath); } catch {}

  return attemptDownload(filePath, 0);
}

function attemptDownload(filePath, attempt) {
  const url = latestRelease.downloadUrl;

  return new Promise((resolve, reject) => {
    httpGet(url)
      .then((res) => {
        if (res.statusCode !== 200) {
          res.resume();
          throw new Error(`HTTP ${res.statusCode}`);
        }

        const totalSize = parseInt(res.headers['content-length'], 10) || latestRelease.fileSize || 0;
        let downloaded = 0;
        let lastPercent = 0;

        const fileStream = fs.createWriteStream(filePath);

        // Stall detection: if no data arrives for STALL_TIMEOUT, abort
        let stallTimer = null;
        const resetStallTimer = () => {
          if (stallTimer) clearTimeout(stallTimer);
          stallTimer = setTimeout(() => {
            res.destroy(new Error('Download stalled'));
          }, STALL_TIMEOUT);
        };

        resetStallTimer();

        res.on('data', (chunk) => {
          downloaded += chunk.length;
          resetStallTimer();

          if (totalSize > 0) {
            const percent = Math.min(99, Math.round((downloaded / totalSize) * 100));
            if (percent !== lastPercent) {
              lastPercent = percent;
              sendToRenderer('download-progress', {
                percent,
                transferred: downloaded,
                total: totalSize,
              });
            }
          }
        });

        res.pipe(fileStream);

        fileStream.on('finish', () => {
          if (stallTimer) clearTimeout(stallTimer);

          const fileSize = fs.statSync(filePath).size;
          if (fileSize < 1000000) {
            try { fs.unlinkSync(filePath); } catch {}
            handleRetry(filePath, attempt, 'Archivo descargado muy pequeno', resolve, reject);
            return;
          }

          downloadedFilePath = filePath;
          isDownloading = false;
          sendToRenderer('download-progress', { percent: 100, transferred: fileSize, total: fileSize });
          sendToRenderer('update-downloaded', { version: latestRelease.version });
          resolve(filePath);
        });

        fileStream.on('error', (err) => {
          if (stallTimer) clearTimeout(stallTimer);
          res.destroy();
          try { fs.unlinkSync(filePath); } catch {}
          handleRetry(filePath, attempt, err.message, resolve, reject);
        });

        res.on('error', (err) => {
          if (stallTimer) clearTimeout(stallTimer);
          fileStream.destroy();
          try { fs.unlinkSync(filePath); } catch {}
          handleRetry(filePath, attempt, err.message, resolve, reject);
        });
      })
      .catch((err) => {
        handleRetry(filePath, attempt, err.message, resolve, reject);
      });
  });
}

function handleRetry(filePath, attempt, errorMsg, resolve, reject) {
  if (attempt < MAX_RETRIES - 1) {
    const delay = (attempt + 1) * 3000;
    sendToRenderer('download-progress', { percent: 0, transferred: 0, total: 0, retrying: true });
    setTimeout(() => {
      try { if (fs.existsSync(filePath)) fs.unlinkSync(filePath); } catch {}
      attemptDownload(filePath, attempt + 1).then(resolve).catch(reject);
    }, delay);
  } else {
    isDownloading = false;
    // All retries failed — open browser as fallback
    const releaseUrl = `https://github.com/${REPO_OWNER}/${REPO_NAME}/releases/latest`;
    shell.openExternal(releaseUrl).catch(() => {});
    sendToRenderer('update-error', `Descarga fallida. Se abrio el navegador para descarga manual.`);
    reject(new Error(`Download failed after ${MAX_RETRIES} attempts: ${errorMsg}`));
  }
}

// ─── Install update ─────────────────────────────────────

function installUpdate() {
  const filePath =
    downloadedFilePath ||
    path.join(app.getPath('temp'), latestRelease?.fileName || 'LUMEN-Setup.exe');

  if (!fs.existsSync(filePath)) {
    sendToRenderer('update-error', 'Archivo de instalacion no encontrado.');
    return;
  }

  try {
    const exePath = app.getPath('exe');
    const installDir = path.dirname(exePath);

    // Batch script:
    // 1. Wait for LUMEN.exe to exit (poll every 2s)
    // 2. Run NSIS installer silently in same directory
    // 3. Clean up batch file
    // NOTE: /D= must be LAST arg and must NOT be quoted (NSIS requirement)
    const batPath = path.join(app.getPath('temp'), 'lumen-update.bat');
    const batContent = [
      '@echo off',
      ':waitloop',
      'tasklist /FI "IMAGENAME eq LUMEN.exe" 2>NUL | find /I /N "LUMEN.exe">NUL',
      'if "%ERRORLEVEL%"=="0" (',
      '  timeout /t 2 /nobreak > nul',
      '  goto waitloop',
      ')',
      `start /wait "" "${filePath}" /S /D=${installDir}`,
      `del "%~f0"`,
    ].join('\r\n');

    fs.writeFileSync(batPath, batContent, 'utf8');

    spawn('cmd.exe', ['/c', batPath], {
      detached: true,
      stdio: 'ignore',
      windowsHide: true,
    }).unref();

    app.quit();
  } catch (err) {
    sendToRenderer('update-error', `Error al instalar: ${err.message}`);
  }
}

// ─── Helpers ────────────────────────────────────────────

function isNewerVersion(latest, current) {
  const l = latest.split('.').map(Number);
  const c = current.split('.').map(Number);
  for (let i = 0; i < Math.max(l.length, c.length); i++) {
    if ((l[i] || 0) > (c[i] || 0)) return true;
    if ((l[i] || 0) < (c[i] || 0)) return false;
  }
  return false;
}

function sendToRenderer(channel, data) {
  if (mainWindow && !mainWindow.isDestroyed()) {
    mainWindow.webContents.send(channel, data);
  }
}

module.exports = { initUpdater, checkForUpdates, downloadUpdate, installUpdate };
