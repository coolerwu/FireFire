#!/usr/bin/env node
/**
 * 图标生成脚本
 * 使用方法：
 * 1. 先准备一个 1024x1024 的 PNG 图片放在 build/icon-source.png
 * 2. 运行: node scripts/generate-icons.js
 *
 * 或者使用在线工具将 build/icon.svg 转换为 PNG：
 * - https://cloudconvert.com/svg-to-png
 * - https://svgtopng.com/
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const buildDir = path.join(__dirname, '..', 'build');
const sourcePng = path.join(buildDir, 'icon-source.png');
const iconsetDir = path.join(buildDir, 'icon.iconset');

// macOS icon sizes
const sizes = [16, 32, 64, 128, 256, 512, 1024];

function generateMacIcon() {
  if (!fs.existsSync(sourcePng)) {
    console.error('❌ 请先创建 build/icon-source.png (1024x1024)');
    console.log('   可以使用在线工具将 build/icon.svg 转换为 PNG');
    console.log('   推荐: https://cloudconvert.com/svg-to-png');
    process.exit(1);
  }

  // Create iconset directory
  if (!fs.existsSync(iconsetDir)) {
    fs.mkdirSync(iconsetDir);
  }

  console.log('🔥 正在生成 macOS 图标...');

  // Generate all sizes
  sizes.forEach(size => {
    const output1x = path.join(iconsetDir, `icon_${size}x${size}.png`);
    execSync(`sips -z ${size} ${size} "${sourcePng}" --out "${output1x}"`, { stdio: 'pipe' });
    console.log(`   ✓ ${size}x${size}`);

    // @2x versions (except for 1024)
    if (size <= 512) {
      const output2x = path.join(iconsetDir, `icon_${size}x${size}@2x.png`);
      const size2x = size * 2;
      execSync(`sips -z ${size2x} ${size2x} "${sourcePng}" --out "${output2x}"`, { stdio: 'pipe' });
      console.log(`   ✓ ${size}x${size}@2x`);
    }
  });

  // Generate icns
  const icnsPath = path.join(buildDir, 'icon.icns');
  execSync(`iconutil -c icns "${iconsetDir}" -o "${icnsPath}"`);
  console.log(`✅ macOS 图标已生成: ${icnsPath}`);

  // Clean up iconset
  fs.rmSync(iconsetDir, { recursive: true });
}

function generateLinuxIcon() {
  if (!fs.existsSync(sourcePng)) return;

  const linuxIcon = path.join(buildDir, 'icon.png');
  execSync(`sips -z 512 512 "${sourcePng}" --out "${linuxIcon}"`, { stdio: 'pipe' });
  console.log(`✅ Linux 图标已生成: ${linuxIcon}`);
}

function main() {
  console.log('🔥 FireFire 图标生成工具\n');

  try {
    generateMacIcon();
    generateLinuxIcon();

    console.log('\n📝 Windows 图标 (icon.ico) 需要使用其他工具生成:');
    console.log('   推荐: https://icoconvert.com/');
    console.log('   上传 icon-source.png，生成 ico 后保存到 build/icon.ico\n');
  } catch (err) {
    console.error('生成失败:', err.message);
    process.exit(1);
  }
}

main();
