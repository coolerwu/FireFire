const fs = require('fs');
const path = require('path');
const os = require('os');

/**
 * WorkspaceManager - 工作空间管理器
 *
 * 负责管理全局配置文件和工作空间路径
 */
class WorkspaceManager {
  constructor() {
    this.cachedWorkspacePath = null;
    this.configVersion = '1.0';
  }

  /**
   * 获取全局配置目录路径（跨平台）
   * - Windows: %APPDATA%/firefire
   * - macOS: ~/Library/Application Support/firefire
   * - Linux: ~/.config/firefire
   */
  getGlobalConfigDir() {
    const platform = process.platform;
    let configDir;

    if (platform === 'win32') {
      configDir = process.env.APPDATA || path.join(os.homedir(), 'AppData', 'Roaming');
    } else if (platform === 'darwin') {
      configDir = path.join(os.homedir(), 'Library', 'Application Support');
    } else {
      // Linux and others
      configDir = process.env.XDG_CONFIG_HOME || path.join(os.homedir(), '.config');
    }

    return path.join(configDir, 'firefire');
  }

  /**
   * 获取全局配置文件路径
   */
  getGlobalConfigPath() {
    return path.join(this.getGlobalConfigDir(), 'workspace.json');
  }

  /**
   * 加载全局配置
   */
  loadGlobalConfig() {
    const configPath = this.getGlobalConfigPath();

    if (!fs.existsSync(configPath)) {
      return null;
    }

    try {
      const content = fs.readFileSync(configPath, 'utf8');
      const config = JSON.parse(content);
      return config;
    } catch (error) {
      console.error('[WorkspaceManager] 读取全局配置失败:', error);
      // 配置文件损坏，返回 null
      return null;
    }
  }

  /**
   * 保存全局配置
   */
  saveGlobalConfig(config) {
    const configDir = this.getGlobalConfigDir();
    const configPath = this.getGlobalConfigPath();

    try {
      // 确保配置目录存在
      if (!fs.existsSync(configDir)) {
        fs.mkdirSync(configDir, { recursive: true });
      }

      // 添加版本和时间戳
      const fullConfig = {
        version: this.configVersion,
        currentWorkspace: config.currentWorkspace,
        lastOpened: new Date().toISOString(),
      };

      fs.writeFileSync(configPath, JSON.stringify(fullConfig, null, 2), 'utf8');
      console.log('[WorkspaceManager] 全局配置已保存:', config.currentWorkspace);

      // 更新缓存
      this.cachedWorkspacePath = config.currentWorkspace;
    } catch (error) {
      console.error('[WorkspaceManager] 保存全局配置失败:', error);
      throw error;
    }
  }

  /**
   * 验证路径是否为有效的工作空间
   */
  isValidWorkspace(workspacePath) {
    // 1. 路径必须存在
    if (!fs.existsSync(workspacePath)) {
      return { valid: false, reason: '路径不存在' };
    }

    // 2. 必须是目录
    try {
      const stat = fs.statSync(workspacePath);
      if (!stat.isDirectory()) {
        return { valid: false, reason: '不是有效的目录' };
      }
    } catch (error) {
      return { valid: false, reason: '无法访问路径' };
    }

    // 3. 必须有写权限
    try {
      fs.accessSync(workspacePath, fs.constants.W_OK);
    } catch (error) {
      return { valid: false, reason: '没有写权限' };
    }

    // 4. 检查是否是现有的 FireFire 工作空间
    const hasDB = fs.existsSync(path.join(workspacePath, 'firefire.db'));
    const hasNotebook = fs.existsSync(path.join(workspacePath, 'notebook'));
    const isEmpty = fs.readdirSync(workspacePath).length === 0;

    // 允许任何有写权限的目录作为工作空间
    // FireFire 会在其中创建 notebook、attachment、journals 子目录
    return { valid: true, isEmpty: isEmpty, isExistingWorkspace: hasDB || hasNotebook };
  }

  /**
   * 验证路径安全性（禁止系统关键目录）
   */
  validateWorkspacePath(userPath) {
    // 解析为绝对路径
    const absPath = path.resolve(userPath);

    // 禁止的系统目录
    const forbidden = [
      '/',
      '/System',
      '/usr',
      '/bin',
      '/sbin',
      '/etc',
      '/var',
      '/Library',
      'C:\\Windows',
      'C:\\Program Files',
      'C:\\Program Files (x86)',
    ];

    // macOS Library
    if (process.platform === 'darwin') {
      const homeLibrary = path.join(os.homedir(), 'Library');
      if (absPath === homeLibrary || absPath.startsWith(homeLibrary + path.sep + 'System')) {
        return { valid: false, reason: '无法使用系统目录作为工作空间' };
      }
    }

    // 检查是否是禁止目录
    for (const dir of forbidden) {
      if (absPath === dir || absPath.startsWith(dir + path.sep)) {
        return { valid: false, reason: '无法使用系统目录作为工作空间' };
      }
    }

    return { valid: true };
  }

  /**
   * 初始化工作空间目录结构
   */
  initWorkspace(workspacePath) {
    console.log('[WorkspaceManager] 初始化工作空间:', workspacePath);

    try {
      // 创建必要的子目录
      // journals 与 notebook 平行
      const dirs = ['notebook', 'attachment', 'journals'];

      for (const dir of dirs) {
        const dirPath = path.join(workspacePath, dir);
        if (!fs.existsSync(dirPath)) {
          fs.mkdirSync(dirPath, { recursive: true });
          console.log('[WorkspaceManager] 创建目录:', dir);
        }
      }

      // 注意：不在这里初始化数据库和 setting.json
      // 数据库由 dbManager 初始化
      // setting.json 由 settingFile 初始化

      console.log('[WorkspaceManager] 工作空间初始化完成');
      return true;
    } catch (error) {
      console.error('[WorkspaceManager] 初始化工作空间失败:', error);
      return false;
    }
  }

  /**
   * 获取当前工作空间路径（带缓存）
   */
  getWorkspacePath() {
    // 优先使用缓存
    if (this.cachedWorkspacePath) {
      return this.cachedWorkspacePath;
    }

    // 从配置文件读取
    const config = this.loadGlobalConfig();
    if (config && config.currentWorkspace) {
      this.cachedWorkspacePath = config.currentWorkspace;
      return this.cachedWorkspacePath;
    }

    // 没有配置，返回 null
    return null;
  }

  /**
   * 设置当前工作空间路径
   */
  setWorkspacePath(workspacePath) {
    // 验证安全性
    const safetyCheck = this.validateWorkspacePath(workspacePath);
    if (!safetyCheck.valid) {
      throw new Error(safetyCheck.reason);
    }

    // 验证有效性
    const validityCheck = this.isValidWorkspace(workspacePath);
    if (!validityCheck.valid) {
      throw new Error(validityCheck.reason);
    }

    // 无论是否是现有工作空间，都确保所有必要的子目录存在
    this.initWorkspace(workspacePath);

    // 保存配置
    this.saveGlobalConfig({ currentWorkspace: workspacePath });

    return true;
  }

  /**
   * 自动检测并迁移旧版本数据（~/.firefire）
   */
  autoMigrateFromLegacy() {
    const legacyPath = path.join(os.homedir(), '.firefire');

    if (!fs.existsSync(legacyPath)) {
      return null; // 无需迁移
    }

    console.log('[WorkspaceManager] 检测到旧版本数据目录:', legacyPath);

    // 确保所有必要的子目录存在
    this.initWorkspace(legacyPath);

    // 自动创建全局配置，将旧路径设为工作空间
    this.saveGlobalConfig({ currentWorkspace: legacyPath });

    console.log('[WorkspaceManager] 自动迁移完成，工作空间设置为:', legacyPath);
    return legacyPath;
  }

  /**
   * 检查并获取工作空间路径
   * 启动时调用，处理首次启动、自动迁移等逻辑
   */
  checkWorkspace() {
    const config = this.loadGlobalConfig();

    // 1. 如果有配置，验证工作空间是否有效
    if (config && config.currentWorkspace) {
      const validation = this.isValidWorkspace(config.currentWorkspace);

      if (validation.valid) {
        console.log('[WorkspaceManager] 使用配置的工作空间:', config.currentWorkspace);
        // 确保所有必要的子目录存在（兼容旧版本）
        this.initWorkspace(config.currentWorkspace);
        this.cachedWorkspacePath = config.currentWorkspace;
        return { status: 'ready', path: config.currentWorkspace };
      } else {
        console.warn('[WorkspaceManager] 工作空间无效:', validation.reason);
        return { status: 'invalid', reason: validation.reason };
      }
    }

    // 2. 没有配置，检查是否有旧数据需要迁移
    const migratedPath = this.autoMigrateFromLegacy();
    if (migratedPath) {
      return { status: 'migrated', path: migratedPath };
    }

    // 3. 首次使用，需要选择工作空间
    console.log('[WorkspaceManager] 首次使用，需要选择工作空间');
    return { status: 'first-time' };
  }

  /**
   * 清除缓存（切换工作空间时调用）
   */
  clearCache() {
    this.cachedWorkspacePath = null;
  }
}

// 导出单例
module.exports = new WorkspaceManager();
