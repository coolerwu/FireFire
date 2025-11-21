# 自动更新功能设计文档

## Context
FireFire 使用 Electron + electron-builder 构建跨平台桌面应用，需要实现自动更新功能以提升用户体验。

## Goals / Non-Goals

### Goals
- 实现跨平台自动更新（Windows、macOS、Linux）
- 使用 GitHub Releases 作为更新源
- 支持手动和自动检查更新
- 显示更新进度和通知
- 支持用户配置（开关自动更新）

### Non-Goals
- 不支持差量更新（differential updates）
- 不支持多渠道更新（仅稳定版）
- 不实现自建更新服务器（使用 GitHub）
- 不支持强制更新

## Decisions

### 1. 更新库选择

**决定**：使用 `electron-updater`

**技术选型**：
| 方案 | 优点 | 缺点 | 决定 |
|------|------|------|------|
| electron-updater | electron-builder 官方，功能完善，跨平台 | 依赖 electron-builder 配置 | ✅ |
| Squirrel.Windows | Windows 原生 | 仅支持 Windows | ❌ |
| 自建更新服务 | 完全控制 | 开发和维护成本高 | ❌ |

### 2. 更新源选择

**决定**：使用 GitHub Releases

**原因**：
- ✅ 免费且稳定
- ✅ 与代码仓库天然集成
- ✅ electron-updater 原生支持
- ⚠️ 国内访问可能较慢（可通过镜像解决）

**配置**：
```json
{
  "build": {
    "publish": {
      "provider": "github",
      "owner": "your-username",
      "repo": "FireFire"
    }
  }
}
```

### 3. 更新流程设计

```
┌─────────────────────────────────────────────────────────────┐
│                    应用启动                                  │
└─────────────────┬───────────────────────────────────────────┘
                  │
                  ▼
        ┌─────────────────┐
        │ 检查自动更新设置 │
        └────────┬────────┘
                 │
         ┌───────┴────────┐
         │                │
         ▼                ▼
    ┌────────┐      ┌────────┐
    │ 已开启  │      │ 已关闭  │
    └────┬───┘      └────┬───┘
         │               │
         ▼               │
 ┌──────────────┐        │
 │ 检查更新      │        │
 └──────┬───────┘        │
        │                │
 ┌──────┴───────┐        │
 │              │        │
 ▼              ▼        │
┌──────┐   ┌──────┐      │
│有更新 │   │无更新 │      │
└──┬───┘   └──────┘      │
   │                     │
   ▼                     │
┌──────────────┐         │
│ 显示更新通知  │         │
└──────┬───────┘         │
       │                 │
 ┌─────┴─────┐           │
 │           │           │
 ▼           ▼           │
┌────┐   ┌────┐          │
│立即 │   │稍后 │          │
│更新 │   │提醒 │          │
└─┬──┘   └────┘          │
  │                      │
  ▼                      │
┌──────────────┐         │
│ 下载更新包    │         │
└──────┬───────┘         │
       │                 │
       ▼                 │
┌──────────────┐         │
│ 显示下载进度  │         │
└──────┬───────┘         │
       │                 │
       ▼                 │
┌──────────────┐         │
│ 下载完成通知  │         │
└──────┬───────┘         │
       │                 │
 ┌─────┴─────┐           │
 │           │           │
 ▼           ▼           │
┌────┐   ┌────┐          │
│重启 │   │稍后 │          │
│安装 │   │安装 │          │
└─┬──┘   └────┘          │
  │                      │
  ▼                      │
┌──────────────┐         │
│ 退出并安装    │         │
└───────────────┘        │
                         │
            ┌────────────┴────────────┐
            │                         │
            ▼                         ▼
     ┌─────────────┐         ┌─────────────┐
     │ 用户可手动   │         │ 等待下次启动 │
     │ 检查更新     │         │             │
     └─────────────┘         └─────────────┘
```

### 4. 代码架构

#### 4.1 更新管理器 (electron/updater.js)

```javascript
const { autoUpdater } = require('electron-updater');
const { app, BrowserWindow, ipcMain } = require('electron');
const log = require('electron-log');

class UpdateManager {
  constructor() {
    this.mainWindow = null;
    this.updateAvailable = false;

    // 配置日志
    log.transports.file.level = 'info';
    autoUpdater.logger = log;

    // 配置自动下载（设为 false，让用户选择）
    autoUpdater.autoDownload = false;

    this.initEventHandlers();
  }

  setMainWindow(window) {
    this.mainWindow = window;
  }

  initEventHandlers() {
    // 检查更新
    autoUpdater.on('checking-for-update', () => {
      this.sendStatusToWindow('checking-for-update');
    });

    // 有可用更新
    autoUpdater.on('update-available', (info) => {
      this.updateAvailable = true;
      this.sendStatusToWindow('update-available', info);
    });

    // 没有可用更新
    autoUpdater.on('update-not-available', (info) => {
      this.sendStatusToWindow('update-not-available', info);
    });

    // 下载进度
    autoUpdater.on('download-progress', (progressObj) => {
      this.sendStatusToWindow('download-progress', progressObj);
    });

    // 下载完成
    autoUpdater.on('update-downloaded', (info) => {
      this.sendStatusToWindow('update-downloaded', info);
    });

    // 错误处理
    autoUpdater.on('error', (err) => {
      this.sendStatusToWindow('update-error', { message: err.toString() });
    });
  }

  sendStatusToWindow(event, data = {}) {
    if (this.mainWindow) {
      this.mainWindow.webContents.send('update-status', { event, data });
    }
    log.info(`[Update] ${event}`, data);
  }

  // 检查更新
  checkForUpdates() {
    if (!app.isPackaged) {
      log.info('[Update] 开发环境，跳过更新检查');
      return;
    }
    autoUpdater.checkForUpdates();
  }

  // 下载更新
  downloadUpdate() {
    autoUpdater.downloadUpdate();
  }

  // 退出并安装
  quitAndInstall() {
    autoUpdater.quitAndInstall(false, true);
  }
}

module.exports = new UpdateManager();
```

#### 4.2 主进程集成 (main.js)

```javascript
const updater = require('./electron/updater');

app.whenReady().then(() => {
  createWindow();

  // 设置主窗口
  updater.setMainWindow(mainWindow);

  // 启动后延迟检查更新（避免阻塞启动）
  setTimeout(() => {
    // 读取用户设置
    const settings = readSettingFile();
    if (settings.autoUpdate !== false) { // 默认开启
      updater.checkForUpdates();
    }
  }, 3000);
});

// IPC 通信
ipcMain.handle('check-for-updates', () => {
  updater.checkForUpdates();
});

ipcMain.handle('download-update', () => {
  updater.downloadUpdate();
});

ipcMain.handle('quit-and-install', () => {
  updater.quitAndInstall();
});

ipcMain.handle('get-app-version', () => {
  return app.getVersion();
});
```

#### 4.3 渲染进程 UI (src/pages/setting/index.jsx)

```jsx
// 添加到设置页面
const [updateInfo, setUpdateInfo] = useState(null);
const [downloading, setDownloading] = useState(false);
const [downloadProgress, setDownloadProgress] = useState(0);
const [currentVersion, setCurrentVersion] = useState('');

useEffect(() => {
  // 获取当前版本
  window.electronAPI.getAppVersion().then(setCurrentVersion);

  // 监听更新状态
  const removeListener = window.electronAPI.onUpdateStatus((status) => {
    const { event, data } = status;

    switch (event) {
      case 'checking-for-update':
        message.info('正在检查更新...');
        break;

      case 'update-available':
        setUpdateInfo(data);
        Modal.confirm({
          title: '发现新版本',
          content: `
            当前版本: ${currentVersion}
            最新版本: ${data.version}

            ${data.releaseNotes || ''}
          `,
          okText: '立即更新',
          cancelText: '稍后提醒',
          onOk: () => {
            window.electronAPI.downloadUpdate();
            setDownloading(true);
          },
        });
        break;

      case 'update-not-available':
        message.success('已是最新版本');
        break;

      case 'download-progress':
        setDownloadProgress(data.percent);
        break;

      case 'update-downloaded':
        setDownloading(false);
        Modal.confirm({
          title: '更新已下载',
          content: '更新已下载完成，是否立即重启安装？',
          okText: '立即重启',
          cancelText: '稍后安装',
          onOk: () => {
            window.electronAPI.quitAndInstall();
          },
        });
        break;

      case 'update-error':
        setDownloading(false);
        message.error(`更新失败: ${data.message}`);
        break;
    }
  });

  return removeListener;
}, [currentVersion]);

// UI 组件
<Card title="软件更新">
  <Space direction="vertical" style={{ width: '100%' }}>
    <div>当前版本: v{currentVersion}</div>

    <Switch
      checked={setting.autoUpdate !== false}
      onChange={(checked) => {
        const newSetting = { ...setting, autoUpdate: checked };
        setSetting(newSetting);
        window.electronAPI.updateSetting(newSetting);
      }}
    />
    <span>自动检查更新</span>

    <Button
      onClick={() => window.electronAPI.checkForUpdates()}
      loading={downloading}
    >
      检查更新
    </Button>

    {downloading && (
      <Progress percent={Math.round(downloadProgress)} />
    )}
  </Space>
</Card>
```

### 5. GitHub Actions 配置

```yaml
# .github/workflows/build.yml
name: Build and Release

on:
  push:
    tags:
      - 'v*.*.*'  # 触发条件：推送 tag（如 v0.3.4）

jobs:
  build-and-release:
    runs-on: ${{ matrix.os }}
    strategy:
      matrix:
        os: [macos-latest, windows-latest, ubuntu-latest]

    steps:
      - uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '18'

      - name: Install dependencies
        run: npm install

      - name: Build
        run: npm run build

      - name: Build Electron (macOS)
        if: matrix.os == 'macos-latest'
        run: npm run package-mac
        env:
          GH_TOKEN: ${{ secrets.GITHUB_TOKEN }}

      - name: Build Electron (Windows)
        if: matrix.os == 'windows-latest'
        run: npm run package-win
        env:
          GH_TOKEN: ${{ secrets.GITHUB_TOKEN }}

      - name: Build Electron (Linux)
        if: matrix.os == 'ubuntu-latest'
        run: npm run package-linux
        env:
          GH_TOKEN: ${{ secrets.GITHUB_TOKEN }}

      - name: Upload to Release
        uses: softprops/action-gh-release@v1
        with:
          files: |
            target/*.dmg
            target/*.exe
            target/*.deb
            target/*.yml
        env:
          GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}
```

### 6. package.json 配置

```json
{
  "name": "firefire",
  "version": "0.3.4",
  "repository": {
    "type": "git",
    "url": "https://github.com/your-username/FireFire.git"
  },
  "build": {
    "appId": "com.firefire.app",
    "productName": "FireFire",
    "publish": {
      "provider": "github",
      "owner": "your-username",
      "repo": "FireFire"
    },
    "mac": {
      "category": "public.app-category.productivity",
      "target": ["dmg"]
    },
    "win": {
      "target": ["nsis"]
    },
    "linux": {
      "target": ["deb"],
      "category": "Office"
    }
  }
}
```

## Risks / Trade-offs

### 风险 1：GitHub Releases 访问速度
- **影响**：国内用户下载更新可能较慢
- **缓解**：
  - 提供镜像源选项
  - 支持手动下载安装包
  - 添加下载超时和重试机制

### 风险 2：自动更新失败
- **影响**：用户无法通过自动更新获取新版本
- **缓解**：
  - 完善错误处理和日志
  - 提供手动下载链接
  - 保持向后兼容

### 风险 3：版本兼容性
- **影响**：旧版本数据可能不兼容新版本
- **缓解**：
  - 添加数据迁移逻辑
  - 版本号严格遵循语义化版本
  - 在更新说明中标注破坏性变更

### Trade-off：自动更新 vs 用户控制
- **选择**：默认开启自动检查，但需要用户确认下载和安装
- **理由**：平衡便利性和用户控制权

## Open Questions
- ❓ 是否需要支持测试版渠道（beta channel）？
- ❓ 是否需要代码签名（macOS 需要，Windows 可选）？
- ❓ 是否需要支持增量更新（differential updates）？
- ❓ 是否需要配置国内镜像源？
