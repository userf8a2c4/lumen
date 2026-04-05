const { app } = require('electron');
const https = require('https');
const fs = require('fs');
const path = require('path');
const { spawn } = require('child_process');

const REPO_OWNER = 'userf8a2c4';
const REPO_NAME = 'lumen';

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
              // Find .exe that is NOT .blockmap
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

// ─── Download update using curl.exe (resilient) ────────

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
  const totalSize = latestRelease.fileSize || (86 * 1024 * 1024);

  // Don't delete existing partial file — curl will resume it
  // Only delete if it's clearly a completed but corrupt file
  try {
    if (fs.existsSync(filePath)) {
      const existingSize = fs.statSync(filePath).size;
      // If file exists and is close to expected size, it might be complete already
      if (existingSize >= totalSize * 0.99) {
        // Verify it's a valid exe (check PE header)
        const header = Buffer.alloc(2);
        const fd = fs.openSync(filePath, 'r');
        fs.readSync(fd, header, 0, 2, 0);
        fs.closeSync(fd);
        if (header[0] === 0x4D && header[1] === 0x5A) {
          // Valid PE file, already downloaded
          downloadedFilePath = filePath;
          isDownloading = false;
          sendToRenderer('download-progress', { percent: 100, transferred: existingSize, total: totalSize });
          sendToRenderer('update-downloaded', { version: latestRelease.version });
          return Promise.resolve(filePath);
        }
      }
      // Partial or corrupt — delete and start fresh
      fs.unlinkSync(filePath);
    }
  } catch {}

  return new Promise((resolve, reject) => {
    const finish = (err) => {
      isDownloading = false;
      if (err) reject(err);
    };

    // curl.exe with maximum resilience:
    // -L            : follow redirects (GitHub uses redirects)
    // -o            : output file
    // -C -          : RESUME interrupted downloads automatically
    // --retry 5     : retry up to 5 times
    // --retry-delay 3: wait 3 seconds between retries
    // --retry-all-errors: retry on ANY error (not just specific ones)
    // --connect-timeout 30: max 30s to establish connection
    // --speed-limit 1000: if speed drops below 1KB/s...
    // --speed-time 30: ...for 30 seconds, abort and retry
    // NO --max-time: let it take as long as needed
    const curl = spawn('curl.exe', [
      '-L',
      '-o', filePath,
      '-C', '-',
      '--connect-timeout', '30',
      '--speed-limit', '1000',
      '--speed-time', '30',
      '--retry', '5',
      '--retry-delay', '3',
      '--retry-all-errors',
      latestRelease.downloadUrl,
    ], { windowsHide: true });

    let lastPercent = 0;
    const progressInterval = setInterval(() => {
      try {
        if (fs.existsSync(filePath)) {
          const currentSize = fs.statSync(filePath).size;
          const percent = Math.min(99, Math.round((currentSize / totalSize) * 100));
          if (percent !== lastPercent) {
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
        sendToRenderer('update-error', `Descarga fallo (codigo ${code}). Reintentando...`);
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
        sendToRenderer('update-error', 'Archivo descargado parece corrupto (muy pequeno).');
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
