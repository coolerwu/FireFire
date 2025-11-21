const workspaceManager = require('./workspaceManager');

/**
 * 获取工作空间路径（动态）
 * @returns {string|null} 工作空间路径，如果未配置则返回 null
 */
function getWorkspacePath() {
  return workspaceManager.getWorkspacePath();
}

/**
 * 获取配置路径（向后兼容）
 * @deprecated 请使用 getWorkspacePath() 替代
 */
function getConfPath() {
  const workspacePath = getWorkspacePath();
  if (workspacePath) {
    return workspacePath;
  }
  // 降级到旧路径（首次启动时）
  return (process.env.HOME || process.env.USERPROFILE) + "/.firefire";
}

// 导出函数（推荐）
exports.getWorkspacePath = getWorkspacePath;
exports.getConfPath = getConfPath;

// 导出 getter 属性（向后兼容）
Object.defineProperty(exports, 'confPath', {
  get: getConfPath,
  enumerable: true,
});