#!/usr/bin/env node

/**
 * Post-install script for native dependencies
 * Handles electron-builder deps and rebuilds better-sqlite3 for Electron
 */

const { execSync } = require('child_process');
const os = require('os');
const fs = require('fs');
const path = require('path');

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

// Check if running in CI environment
// GitHub Actions always sets GITHUB_ACTIONS=true (string, not boolean)
// We also check CI_NAME and other common CI indicators
const isCI = !!(
  process.env.GITHUB_ACTIONS === 'true' ||
  process.env.CI_NAME ||
  process.env.CIRCLECI ||
  process.env.TRAVIS ||
  process.env.GITLAB_CI ||
  process.env.APPVEYOR ||
  // Check if running in GitHub Actions runner (has characteristic paths)
  (process.env.RUNNER_OS && process.env.GITHUB_REPOSITORY)
);

console.log('Environment check:');
console.log('  Platform:', platform);
console.log('  GITHUB_ACTIONS:', process.env.GITHUB_ACTIONS);
console.log('  CI:', process.env.CI);
console.log('  RUNNER_OS:', process.env.RUNNER_OS);
console.log('  Is CI:', isCI);

if (platform === 'win32') {
  if (isCI) {
    console.log('✓ Windows CI detected: Skipping native module rebuild');
    console.log('  electron-builder will handle native modules during packaging');
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

  // Check if better-sqlite3 is actually working
  try {
    const testPath = path.join(__dirname, '../node_modules/better-sqlite3/build/Release/better_sqlite3.node');
    if (fs.existsSync(testPath)) {
      console.log('✓ better-sqlite3 native module already exists, continuing...');
      console.log('  Path:', testPath);
      rebuildSuccess = true;
    }
  } catch (e) {
    console.error('Failed to check better-sqlite3:', e.message);
  }

  // Don't fail in CI environment or if better-sqlite3 already works
  if (process.env.CI || rebuildSuccess) {
    console.warn('Continuing despite rebuild failure...');
  } else {
    process.exit(1);
  }
}

console.log('\n✅ Post-install completed successfully!\n');
