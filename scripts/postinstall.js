#!/usr/bin/env node

/**
 * Post-install script for native dependencies
 * Handles electron-builder deps and rebuilds better-sqlite3 for Electron
 */

const { execSync } = require('child_process');
const os = require('os');

function run(command, options = {}) {
  try {
    console.log(`Running: ${command}`);
    execSync(command, {
      stdio: 'inherit',
      ...options
    });
    return true;
  } catch (error) {
    console.error(`Failed to run: ${command}`);
    console.error(error.message);
    return false;
  }
}

console.log('Post-install: Installing app dependencies...');

// Step 1: Install electron-builder dependencies
const installDeps = run('electron-builder install-app-deps');

if (!installDeps) {
  console.warn('Warning: electron-builder install-app-deps failed, but continuing...');
}

// Step 2: Rebuild better-sqlite3 for Electron
console.log('\nPost-install: Rebuilding better-sqlite3 for Electron...');

const platform = os.platform();
let rebuildSuccess = false;

if (platform === 'win32') {
  // On Windows in CI, skip rebuild entirely
  if (process.env.CI) {
    console.log('Windows CI detected: Skipping native module rebuild');
    console.log('Electron will handle native module loading at runtime');
    rebuildSuccess = true; // Skip and succeed
  } else {
    // On local Windows, try to rebuild
    console.log('Windows detected: Attempting rebuild...');
    rebuildSuccess = run('electron-rebuild -f -w better-sqlite3');
  }
} else {
  // On Mac and Linux, rebuild should work fine
  rebuildSuccess = run('electron-rebuild -f -w better-sqlite3');
}

if (!rebuildSuccess) {
  console.error('\n⚠️  WARNING: Failed to rebuild better-sqlite3');
  console.error('The app may not work correctly until native modules are rebuilt.');
  console.error('\nTry running manually:');
  console.error('  npm run rebuild-native\n');

  // Don't fail in CI environment
  if (process.env.CI) {
    console.warn('Running in CI, continuing despite rebuild failure...');
  } else {
    process.exit(1);
  }
}

console.log('\n✅ Post-install completed successfully!\n');
