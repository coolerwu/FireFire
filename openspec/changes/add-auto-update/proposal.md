# Change: 添加自动更新功能

## Why
当前 FireFire 需要用户手动下载新版本并重新安装，用户体验不够友好。添加自动更新功能可以：
1. **提升用户体验**：用户无需手动下载和安装更新
2. **确保安全性**：及时推送安全补丁和 bug 修复
3. **增加更新率**：自动化流程提高用户使用最新版本的比例
4. **标准化体验**：符合现代桌面应用的标准功能

## What Changes
使用 Electron 的 `electron-updater` 实现自动更新功能：

### 1. 自动检测更新
- 应用启动时检查新版本
- 支持手动检查更新（设置页面）
- 使用 GitHub Releases 作为更新源

### 2. 更新通知
- 发现新版本时弹出通知
- 显示版本号和更新日志
- 用户可选择"立即更新"或"稍后提醒"

### 3. 下载和安装
- 后台下载更新包
- 显示下载进度
- 下载完成后提示重启应用
- 重启后自动安装更新

### 4. 更新配置
- 支持配置自动检查更新（开/关）
- 支持配置更新渠道（稳定版/测试版）
- 保存用户更新偏好

### 5. GitHub Actions 集成
- 自动发布到 GitHub Releases
- 生成平台特定的更新文件（latest.yml/latest-mac.yml/latest-linux.yml）
- 代码签名（macOS/Windows）

## Impact
- Affected specs: 无（新功能）
- Affected code:
  - `main.js` (添加自动更新逻辑)
  - `electron/updater.js` (新建，更新管理器)
  - `src/pages/setting/index.jsx` (添加更新设置)
  - `.github/workflows/build.yml` (添加发布步骤)
  - `package.json` (配置更新源)
- Breaking: 无（向后兼容）
- Risk: 低
  - electron-updater 是成熟的库
  - GitHub Releases 是稳定的托管方案
  - 用户可以选择不更新

## Dependencies
新增 npm 包：
- `electron-updater`: Electron 自动更新库

## Implementation Plan
1. 安装 electron-updater
2. 配置 package.json（repository、publish 信息）
3. 创建更新管理器模块
4. 集成到主进程
5. 添加设置页面 UI
6. 配置 GitHub Actions 自动发布
7. 测试完整更新流程

## Update Source
使用 **GitHub Releases** 作为更新源：
- 优点：免费、稳定、与代码仓库集成
- 缺点：国内访问可能较慢（可配置镜像）
- 备选方案：自建服务器或使用 CDN
