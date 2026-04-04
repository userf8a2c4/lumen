const { app, shell } = require('electron');
const https = require('https');
const http = require('http');
const fs = require('fs');
const path = require('path');
const { spawn } = require('child_process');

const REPO_OWNER = 'userf8a2c4';
const REPO_NAME = 'lumen';

let mainWindow = null;
let latestRelease = null;
let downloadedFilePath = null;

function initUpdater(win) {
  mainWindow = win;
  setTimeout(() => {
    checkForUpdates().catch(() => {});
  }, 5000);
}

function checkForUpdates() {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'api.github.com',
      path: `/repos/${REPO_OWNER}/${REPO_NAME}/releases/latest`,
      headers: {
        'User-Agent': 'LUMEN-App',
        Accept: 'application/vnd.github.v3+json',
      },
    };

    https
      .get(options, (res) => {
        let data = '';
        res.on('data', (chunk) => (data += chunk));
        res.on('end', () => {
          try {
            if (res.statusCode !== 200) {
              reject(new Error(`GitHub API ${res.statusCode}`));
              return;
            }

            const release = JSON.parse(data);
            const latestVersion = (release.tag_name || '').replace(/^v/, '');
            const currentVersion = app.getVersion();

            if (isNewerVersion(latestVersion, currentVersion)) {
              const exeAsset =
                release.assets?.find(
                  (a) => a.name.endsWith('.exe') && a.content_type?.includes('executable')
                ) || release.assets?.find((a) => a.name.endsWith('.exe'));

              latestRelease = {
                version: latestVersion,
                releaseDate: release.published_at,
                downloadUrl: exeAsset?.browser_download_url || null,
                releaseNotes: release.body || '',
                fileName: exeAsset?.name || 'LUMEN-Setup.exe',
              };

              if (mainWindow && !mainWindow.isDestroyed()) {
                mainWindow.webContents.send('update-available', {
                  version: latestVersion,
                  releaseDate: release.published_at,
                  releaseNotes: release.body || '',
                });
              }
              resolve(latestRelease);
            } else {
              if (mainWindow && !mainWindow.isDestroyed()) {
                mainWindow.webContents.send('update-not-available');
              }
              resolve(null);
            }
          } catch (e) {
            reject(e);
          }
        });
      })
      .on('error', (err) => {
        if (mainWindow && !mainWindow.isDestroyed()) {
          mainWindow.webContents.send('update-error', err.message);
        }
        reject(err);
      });
  });
}

function isNewerVersion(latest, current) {
  const l = latest.split('.').map(Number);
  const c = current.split('.').map(Number);
  for (let i = 0; i < Math.max(l.length, c.length); i++) {
    if ((l[i] || 0) > (c[i] || 0)) return true;
    if ((l[i] || 0) < (c[i] || 0)) return false;
  }
  return false;
}

function downloadUpdate() {
  if (!latestRelease || !latestRelease.downloadUrl) {
    const msg = 'No hay URL de descarga disponible.';
    if (mainWindow && !mainWindow.isDestroyed()) {
      mainWindow.webContents.send('update-error', msg);
    }
    return Promise.reject(new Error(msg));
  }

  const tempDir = app.getPath('temp');
  const filePath = path.join(tempDir, latestRelease.fileName);

  return new Promise((resolve, reject) => {
    if (fs.existsSync(filePath)) {
      try {
        fs.unlinkSync(filePath);
      } catch {}
    }

    const file = fs.createWriteStream(filePath);

    const followRedirects = (url, redirectCount = 0) => {
      if (redirectCount > 5) {
        file.close();
        reject(new Error('Too many redirects'));
        return;
      }

      const urlObj = new URL(url);
      const mod = urlObj.protocol === 'https:' ? https : http;

      mod
        .get(url, { headers: { 'User-Agent': 'LUMEN-App' } }, (res) => {
          if (res.statusCode === 301 || res.statusCode === 302) {
            const redirectUrl = res.headers.location;
            if (redirectUrl) {
              followRedirects(redirectUrl, redirectCount + 1);
              return;
            }
          }

          if (res.statusCode !== 200) {
            file.close();
            reject(new Error(`Download failed: HTTP ${res.statusCode}`));
            return;
          }

          const totalBytes = parseInt(res.headers['content-length'], 10) || 0;
          let downloadedBytes = 0;

          res.on('data', (chunk) => {
            downloadedBytes += chunk.length;
            file.write(chunk);
            if (mainWindow && !mainWindow.isDestroyed() && totalBytes > 0) {
              mainWindow.webContents.send('download-progress', {
                percent: (downloadedBytes / totalBytes) * 100,
                transferred: downloadedBytes,
                total: totalBytes,
              });
            }
          });

          res.on('end', () => {
            file.end(() => {
              downloadedFilePath = filePath;
              if (mainWindow && !mainWindow.isDestroyed()) {
                mainWindow.webContents.send('update-downloaded', {
                  version: latestRelease.version,
                });
              }
              resolve(filePath);
            });
          });

          res.on('error', (err) => {
            file.close();
            reject(err);
          });
        })
        .on('error', (err) => {
          file.close();
          reject(err);
        });
    };

    followRedirects(latestRelease.downloadUrl);
  });
}

function installUpdate() {
  const filePath =
    downloadedFilePath ||
    path.join(app.getPath('temp'), latestRelease?.fileName || 'LUMEN-Setup.exe');

  if (!fs.existsSync(filePath)) {
    if (mainWindow && !mainWindow.isDestroyed()) {
      mainWindow.webContents.send('update-error', 'Archivo de instalación no encontrado.');
    }
    return;
  }

  try {
    spawn(filePath, ['/S'], { detached: true, stdio: 'ignore' }).unref();
    setTimeout(() => app.quit(), 1000);
  } catch (err) {
    if (mainWindow && !mainWindow.isDestroyed()) {
      mainWindow.webContents.send('update-error', `Error al instalar: ${err.message}`);
    }
  }
}

function reportError(description) {
  const version = app.getVersion();
  const platform = `${process.platform} ${process.arch}`;
  const electronVer = process.versions.electron;
  const title = encodeURIComponent(`[Bug] ${description.slice(0, 60)}`);
  const body = encodeURIComponent(
    `## Descripción del error\n${description}\n\n## Información del sistema\n- **Versión LUMEN:** v${version}\n- **Plataforma:** ${platform}\n- **Electron:** ${electronVer}\n\n---\n*Reporte generado automáticamente desde LUMEN*`
  );
  shell.openExternal(
    `https://github.com/${REPO_OWNER}/${REPO_NAME}/issues/new?title=${title}&body=${body}`
  );
}

module.exports = { initUpdater, checkForUpdates, downloadUpdate, installUpdate, reportError };
