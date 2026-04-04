#!/usr/bin/env node

/**
 * Upload release assets to GitHub
 * Usage: node scripts/upload-release.js <tag_name>
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const tagName = process.argv[2];

if (!tagName) {
  console.error('Usage: node scripts/upload-release.js <tag_name>');
  process.exit(1);
}

// Find the .exe file (installer, not unpacked binaries)
const distDir = path.join(__dirname, '..', 'dist');

function findInstallerExe(dir) {
  if (!fs.existsSync(dir)) {
    console.error(`Directory not found: ${dir}`);
    return null;
  }

  const files = fs.readdirSync(dir);

  for (const file of files) {
    const fullPath = path.join(dir, file);
    const stat = fs.statSync(fullPath);

    // Skip directories and unpacked binaries
    if (stat.isDirectory() && file === 'win-unpacked') {
      continue;
    }

    // Found installer exe
    if (file.endsWith('.exe') && !file.includes('win-unpacked')) {
      return fullPath;
    }
  }

  return null;
}

const exePath = findInstallerExe(distDir);

if (!exePath) {
  console.error('❌ No .exe installer found in dist directory');
  console.error('Contents of dist/:');
  console.error(fs.readdirSync(distDir));
  process.exit(1);
}

console.log(`✓ Found installer: ${exePath}`);
console.log(`✓ File size: ${(fs.statSync(exePath).size / 1024 / 1024).toFixed(2)} MB`);

// Upload using gh CLI
try {
  console.log(`⬆️  Uploading to release ${tagName}...`);
  execSync(`gh release upload ${tagName} "${exePath}" --clobber`, {
    stdio: 'inherit',
    env: { ...process.env }
  });
  console.log(`✅ Upload complete!`);
} catch (error) {
  console.error(`❌ Upload failed:`, error.message);
  process.exit(1);
}
