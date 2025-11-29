const { autoUpdater } = require('electron-updater');
const { app, session, shell } = require('electron');
const log = require('electron-log');
const proxyManager = require('./proxyManager');

class UpdateManager {
  constructor() {
    this.mainWindow = null;
    this.updateAvailable = false;
    this.updateDownloaded = false;
    this.updateInfo = null;

    // 配置日志
    log.transports.file.level = 'info';
    autoUpdater.logger = log;

    // 配置自动下载（设为 false，让用户选择）
    autoUpdater.autoDownload = false;

    // macOS: 退出时自动安装更新（用于无签名应用的备选方案）
    autoUpdater.autoInstallOnAppQuit = true;

    // 禁用开发环境检查（仅用于测试）
    // autoUpdater.forceDevUpdateConfig = true;

    this.initEventHandlers();
  }

  setMainWindow(window) {
    this.mainWindow = window;
  }

  initEventHandlers() {
    // 检查更新
    autoUpdater.on('checking-for-update', () => {
      log.info('[Updater] Checking for updates...');
      this.sendStatusToWindow('checking-for-update');
    });

    // 有可用更新
    autoUpdater.on('update-available', (info) => {
      log.info('[Updater] Update available:', info);
      this.updateAvailable = true;
      this.updateInfo = info;
      this.sendStatusToWindow('update-available', {
        version: info.version,
        releaseDate: info.releaseDate,
        releaseNotes: info.releaseNotes,
      });
    });

    // 没有可用更新
    autoUpdater.on('update-not-available', (info) => {
      log.info('[Updater] Update not available');
      this.updateAvailable = false;
      this.sendStatusToWindow('update-not-available', {
        version: info.version,
      });
    });

    // 下载进度
    autoUpdater.on('download-progress', (progressObj) => {
      const logMessage = `Downloaded ${progressObj.percent.toFixed(2)}%`;
      log.info('[Updater]', logMessage);
      this.sendStatusToWindow('download-progress', {
        percent: progressObj.percent,
        transferred: progressObj.transferred,
        total: progressObj.total,
        bytesPerSecond: progressObj.bytesPerSecond,
      });
    });

    // 下载完成
    autoUpdater.on('update-downloaded', (info) => {
      log.info('[Updater] Update downloaded:', info);
      this.updateDownloaded = true;
      this.sendStatusToWindow('update-downloaded', {
        version: info.version,
      });
    });

    // 错误处理
    autoUpdater.on('error', (err) => {
      log.error('[Updater] Error:', err);
      this.sendStatusToWindow('update-error', {
        message: err.message || err.toString(),
      });
    });
  }

  sendStatusToWindow(event, data = {}) {
    if (this.mainWindow && this.mainWindow.webContents) {
      this.mainWindow.webContents.send('update-status', { event, data });
    }
  }

  // 检查更新
  checkForUpdates() {
    if (!app.isPackaged) {
      log.info('[Updater] 开发环境，跳过更新检查');
      this.sendStatusToWindow('update-error', {
        message: '开发环境不支持自动更新',
      });
      return;
    }

    try {
      // 检查代理状态
      const proxyConfig = proxyManager.getProxyConfig();
      if (proxyConfig.enabled && proxyConfig.host && proxyConfig.port) {
        log.info(`[Updater] 使用代理: ${proxyConfig.type}://${proxyConfig.host}:${proxyConfig.port}`);
      } else {
        log.info('[Updater] 直连模式（未使用代理）');
      }

      autoUpdater.checkForUpdates();
    } catch (error) {
      log.error('[Updater] Check for updates failed:', error);
      this.sendStatusToWindow('update-error', {
        message: '检查更新失败: ' + error.message,
      });
    }
  }

  // 下载更新
  downloadUpdate() {
    if (!this.updateAvailable) {
      log.warn('[Updater] No update available to download');
      return;
    }

    try {
      autoUpdater.downloadUpdate();
    } catch (error) {
      log.error('[Updater] Download update failed:', error);
      this.sendStatusToWindow('update-error', {
        message: '下载更新失败: ' + error.message,
      });
    }
  }

  // 退出并安装
  quitAndInstall() {
    if (!this.updateDownloaded) {
      log.warn('[Updater] No update downloaded, cannot install');
      this.sendStatusToWindow('update-error', {
        message: '更新尚未下载完成',
      });
      return;
    }

    const isMac = process.platform === 'darwin';

    // macOS 上无签名应用直接使用备选方案
    // 因为 quitAndInstall 会因代码签名问题静默失败
    if (isMac) {
      log.info('[Updater] macOS detected, using fallback restart to avoid code signature issues...');
      this.fallbackRestart();
      return;
    }

    try {
      log.info('[Updater] Attempting quitAndInstall...');
      // false: 不强制立即退出，true: 安装后重启
      autoUpdater.quitAndInstall(false, true);
    } catch (error) {
      log.error('[Updater] quitAndInstall failed:', error);
      this.sendStatusToWindow('update-error', {
        message: '安装更新失败: ' + error.message,
      });
    }
  }

  // 备选重启方案（用于无签名应用）
  fallbackRestart() {
    log.info('[Updater] Using fallback restart method...');

    // 尝试直接调用 quitAndInstall，忽略错误
    try {
      // 设置强制退出，跳过某些验证
      autoUpdater.quitAndInstall(true, true);
    } catch (error) {
      log.error('[Updater] quitAndInstall in fallback failed:', error);

      // 如果仍然失败，打开下载页面让用户手动更新
      const version = this.updateInfo?.version || 'latest';
      const downloadUrl = `https://github.com/coolerwu/FireFire/releases/tag/v${version}`;

      log.info('[Updater] Opening download page:', downloadUrl);
      shell.openExternal(downloadUrl);

      this.sendStatusToWindow('update-error', {
        message: '自动更新失败，已打开下载页面，请手动下载安装新版本',
      });
    }
  }

  // 获取当前版本
  getCurrentVersion() {
    return app.getVersion();
  }
}

module.exports = new UpdateManager();
