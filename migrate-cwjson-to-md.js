#!/usr/bin/env node

/**
 * Migration script to convert .cwjson files to .md (Markdown) format
 * Usage: node migrate-cwjson-to-md.js [path-to-notebook-folder]
 */

const fs = require('fs');
const path = require('path');
const { tiptapToMarkdown, extractMetadata } = require('./electron/markdownConverter');

function convertCwjsonToMd(cwjsonPath, mdPath) {
  try {
    console.log(`Converting: ${cwjsonPath}`);

    // Read .cwjson file
    const cwjsonContent = fs.readFileSync(cwjsonPath, 'utf-8');
    const tiptapJSON = JSON.parse(cwjsonContent);

    // Extract metadata
    const noteId = path.basename(cwjsonPath, '.cwjson');
    const metadata = extractMetadata(tiptapJSON, noteId);

    // Convert to Markdown
    const markdown = tiptapToMarkdown(tiptapJSON, metadata);

    // Write .md file
    const dir = path.dirname(mdPath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    fs.writeFileSync(mdPath, markdown, 'utf-8');

    console.log(`✅ Created: ${mdPath}`);
    return true;
  } catch (error) {
    console.error(`❌ Failed to convert ${cwjsonPath}:`, error.message);
    return false;
  }
}

function migrateDirectory(dirPath) {
  let successCount = 0;
  let failCount = 0;

  console.log(`\n🔍 Scanning directory: ${dirPath}\n`);

  function scanDir(dir) {
    const items = fs.readdirSync(dir);

    for (const item of items) {
      const fullPath = path.join(dir, item);
      const stat = fs.statSync(fullPath);

      if (stat.isDirectory()) {
        // Recursively scan subdirectories
        scanDir(fullPath);
      } else if (item.endsWith('.cwjson')) {
        // Convert .cwjson to .md
        const mdPath = fullPath.replace(/\.cwjson$/, '.md');
        const success = convertCwjsonToMd(fullPath, mdPath);

        if (success) {
          successCount++;
          // Optionally backup the original .cwjson file
          const backupPath = fullPath + '.backup';
          fs.copyFileSync(fullPath, backupPath);
          console.log(`📦 Backed up: ${backupPath}`);
        } else {
          failCount++;
        }
      }
    }
  }

  scanDir(dirPath);

  console.log('\n' + '='.repeat(60));
  console.log(`✅ Successfully converted: ${successCount} files`);
  console.log(`❌ Failed: ${failCount} files`);
  console.log('='.repeat(60) + '\n');

  return { successCount, failCount };
}

// Main execution
const notebookPath = process.argv[2] || '/Users/wulang/Desktop/personal';

if (!fs.existsSync(notebookPath)) {
  console.error(`❌ Directory not found: ${notebookPath}`);
  process.exit(1);
}

console.log('╔════════════════════════════════════════════════════════════╗');
console.log('║  FireFire: .cwjson → .md Migration Tool                   ║');
console.log('╚════════════════════════════════════════════════════════════╝');

const { successCount, failCount } = migrateDirectory(notebookPath);

if (successCount > 0) {
  console.log('\n✅ Migration completed!');
  console.log('\nNext steps:');
  console.log('1. Check the generated .md files in your text editor');
  console.log('2. Original .cwjson files have been backed up as .cwjson.backup');
  console.log('3. Update your FireFire settings to use .md format');
  console.log('4. Restart FireFire');
} else {
  console.log('\n⚠️  No files were migrated.');
}

process.exit(failCount > 0 ? 1 : 0);
