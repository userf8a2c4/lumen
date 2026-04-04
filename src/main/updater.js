const { app, shell } = require('electron');
const https = require('https');
const fs = require('fs');
const path = require('path');
const { execFile, spawn } = require('child_process');

const REPO_OWNER = 'userf8a2c4';
const REPO_NAME = 'lumen';

let mainWindow = null;
let latestRelease = null;
let downloadedFilePath = null;
let isDownloading = false; // Guard against concurrent downloads

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
              const exeAsset = release.assets?.find((a) => a.name.endsWith('.exe'));

              latestRelease = {
                version: latestVersion,
                downloadUrl: exeAsset?.browser_download_url || null,
                fileName: exeAsset?.name || 'LUMEN-Setup.exe',
                fileSize: exeAsset?.size || 0, // Actual size from GitHub API
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

// ─── Download update using curl.exe ─────────────────────

function downloadUpdate() {
  if (!latestRelease || !latestRelease.downloadUrl) {
    sendToRenderer('update-error', 'No hay URL de descarga disponible.');
    return Promise.reject(new Error('No download URL'));
  }

  // Prevent concurrent downloads
  if (isDownloading) {
    return Promise.reject(new Error('Download already in progress'));
  }
  isDownloading = true;

  const tempDir = app.getPath('temp');
  const filePath = path.join(tempDir, latestRelease.fileName);

  // Delete old file if exists
  try { if (fs.existsSync(filePath)) fs.unlinkSync(filePath); } catch {}

  // Use actual file size from GitHub API, fallback to estimate
  const totalSize = latestRelease.fileSize || (170 * 1024 * 1024);

  return new Promise((resolve, reject) => {
    const finish = (err) => {
      isDownloading = false;
      if (err) reject(err);
    };

    // curl.exe: -L follow redirects, -o output file
    const curl = spawn('curl.exe', [
      '-L',
      '-o', filePath,
      '--connect-timeout', '30',
      '--max-time', '600',
      '--retry', '3',
      '--retry-delay', '5',
      latestRelease.downloadUrl,
    ], { windowsHide: true });

    // Poll file size every second for smooth progress
    let lastPercent = 0;
    const progressInterval = setInterval(() => {
      try {
        if (fs.existsSync(filePath)) {
          const currentSize = fs.statSync(filePath).size;
          const percent = Math.min(99, Math.round((currentSize / totalSize) * 100));
          if (percent > lastPercent) {
            lastPercent = percent;
            sendToRenderer('download-progress', {
              percent,
              transferred: currentSize,
              total: totalSize,
            });
          }
        }
      } catch {}
    }, 1000);

    curl.on('close', (code) => {
      clearInterval(progressInterval);

      if (code !== 0) {
        sendToRenderer('update-error', `Descarga fallo (codigo ${code}).`);
        try { fs.unlinkSync(filePath); } catch {}
        finish(new Error(`curl exit code ${code}`));
        return;
      }

      if (!fs.existsSync(filePath)) {
        sendToRenderer('update-error', 'Archivo no encontrado tras descarga.');
        finish(new Error('File not found after download'));
        return;
      }

      const fileSize = fs.statSync(filePath).size;
      if (fileSize < 1000000) {
        sendToRenderer('update-error', 'Archivo descargado parece corrupto.');
        try { fs.unlinkSync(filePath); } catch {}
        finish(new Error('Downloaded file too small'));
        return;
      }

      downloadedFilePath = filePath;
      isDownloading = false;
      sendToRenderer('download-progress', { percent: 100, transferred: fileSize, total: fileSize });
      sendToRenderer('update-downloaded', { version: latestRelease.version });
      resolve(filePath);
    });

    curl.on('error', (err) => {
      clearInterval(progressInterval);
      // curl.exe not found — fallback message
      if (err.code === 'ENOENT') {
        sendToRenderer('update-error', 'curl.exe no encontrado. Descarga manual desde GitHub.');
      } else {
        sendToRenderer('update-error', `Error de descarga: ${err.message}`);
      }
      try { fs.unlinkSync(filePath); } catch {}
      finish(err);
    });
  });
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

    // Batch script that:
    // 1. Waits for LUMEN.exe to fully exit (polls every 2s, up to 30s)
    // 2. Runs installer silently in the same directory
    // 3. Cleans up
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

// ─── Report error ───────────────────────────────────────

function reportError(description) {
  const version = app.getVersion();
  const platform = `${process.platform} ${process.arch}`;
  const electronVer = process.versions.electron;
  const title = encodeURIComponent(`[Bug] ${description.slice(0, 60)}`);
  const body = encodeURIComponent(
    `## Descripcion del error\n${description}\n\n## Informacion del sistema\n- **Version LUMEN:** v${version}\n- **Plataforma:** ${platform}\n- **Electron:** ${electronVer}\n\n---\n*Reporte generado automaticamente desde LUMEN*`
  );
  shell.openExternal(
    `https://github.com/${REPO_OWNER}/${REPO_NAME}/issues/new?title=${title}&body=${body}`
  );
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

module.exports = { initUpdater, checkForUpdates, downloadUpdate, installUpdate, reportError };
