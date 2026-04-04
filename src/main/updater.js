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

// ─── Download update using PowerShell ───────────────────
// PowerShell handles redirects, TLS, large files natively.
// No manual redirect following, no pipe/stream bugs.

function downloadUpdate() {
  if (!latestRelease || !latestRelease.downloadUrl) {
    sendToRenderer('update-error', 'No hay URL de descarga disponible.');
    return Promise.reject(new Error('No download URL'));
  }

  const tempDir = app.getPath('temp');
  const filePath = path.join(tempDir, latestRelease.fileName);

  // Delete old file if exists
  try { if (fs.existsSync(filePath)) fs.unlinkSync(filePath); } catch {}

  return new Promise((resolve, reject) => {
    // PowerShell command to download with progress tracking via file size polling
    const psCommand = [
      `[Net.ServicePointManager]::SecurityProtocol = [Net.SecurityProtocolType]::Tls12;`,
      `$ProgressPreference = 'SilentlyContinue';`,
      `Invoke-WebRequest -Uri '${latestRelease.downloadUrl}' -OutFile '${filePath}' -UseBasicParsing;`,
      `Write-Output 'DONE'`,
    ].join(' ');

    const ps = execFile('powershell.exe', ['-NoProfile', '-Command', psCommand], {
      windowsHide: true,
      timeout: 600000, // 10 minute timeout
    }, (error, stdout) => {
      if (error) {
        sendToRenderer('update-error', `Error de descarga: ${error.message}`);
        try { fs.unlinkSync(filePath); } catch {}
        reject(error);
        return;
      }

      if (stdout.trim().includes('DONE') && fs.existsSync(filePath)) {
        const fileSize = fs.statSync(filePath).size;
        if (fileSize < 1000000) { // Less than 1MB = probably failed
          sendToRenderer('update-error', 'Archivo descargado parece corrupto.');
          try { fs.unlinkSync(filePath); } catch {}
          reject(new Error('Downloaded file too small'));
          return;
        }

        downloadedFilePath = filePath;
        sendToRenderer('download-progress', { percent: 100, transferred: fileSize, total: fileSize });
        sendToRenderer('update-downloaded', { version: latestRelease.version });
        resolve(filePath);
      } else {
        sendToRenderer('update-error', 'La descarga no se completo.');
        reject(new Error('Download did not complete'));
      }
    });

    // Poll file size for progress updates while PowerShell downloads
    let progressInterval = setInterval(() => {
      try {
        if (fs.existsSync(filePath)) {
          const currentSize = fs.statSync(filePath).size;
          // Estimate total size (~165MB based on typical build)
          const estimatedTotal = 170 * 1024 * 1024;
          const percent = Math.min(99, Math.round((currentSize / estimatedTotal) * 100));
          sendToRenderer('download-progress', {
            percent,
            transferred: currentSize,
            total: estimatedTotal,
          });
        }
      } catch {}
    }, 1000);

    ps.on('exit', () => {
      clearInterval(progressInterval);
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

    // Batch script: wait for app to close, run installer, cleanup
    const batPath = path.join(app.getPath('temp'), 'lumen-update.bat');
    const batContent = [
      '@echo off',
      'timeout /t 3 /nobreak > nul',
      `start "" "${filePath}" /S /D="${installDir}"`,
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
