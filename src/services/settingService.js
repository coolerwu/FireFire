/**
 * 设置服务层
 *
 * 封装所有设置相关的 IPC 调用，提供统一的接口和错误处理
 */

import { electronAPI } from '@/utils/electronAPI';

/**
 * 设置服务
 */
export const settingService = {
  /**
   * 读取设置
   * @returns {Promise<Object>} 设置对象
   */
  async read() {
    try {
      return await electronAPI.readSettingFile();
    } catch (error) {
      console.error('[settingService] 读取设置失败:', error);
      throw error;
    }
  },

  /**
   * 写入设置
   * @param {Object} settings - 设置对象
   * @returns {Promise<boolean>}
   */
  async write(settings) {
    try {
      await electronAPI.writeSettingFile(settings);
      return true;
    } catch (error) {
      console.error('[settingService] 写入设置失败:', error);
      throw error;
    }
  },

  /**
   * 获取当前工作空间
   * @returns {Promise<string>}
   */
  async getCurrentWorkspace() {
    try {
      return await electronAPI.getCurrentWorkspace();
    } catch (error) {
      console.error('[settingService] 获取工作空间失败:', error);
      throw error;
    }
  },

  /**
   * 切换工作空间
   * @returns {Promise<{ success: boolean, error?: string }>}
   */
  async changeWorkspace() {
    try {
      return await electronAPI.changeWorkspace();
    } catch (error) {
      console.error('[settingService] 切换工作空间失败:', error);
      return { success: false, error: error.message };
    }
  },

  /**
   * 打开工作空间文件夹
   * @returns {Promise<{ success: boolean, error?: string }>}
   */
  async openWorkspaceFolder() {
    try {
      return await electronAPI.openWorkspaceFolder();
    } catch (error) {
      console.error('[settingService] 打开文件夹失败:', error);
      return { success: false, error: error.message };
    }
  },

  /**
   * 获取应用版本
   * @returns {Promise<string>}
   */
  async getAppVersion() {
    try {
      return await electronAPI.getAppVersion();
    } catch (error) {
      console.error('[settingService] 获取版本失败:', error);
      return 'unknown';
    }
  },

  /**
   * 重启应用
   * @returns {Promise<void>}
   */
  async restartApp() {
    try {
      await electronAPI.restartApp();
    } catch (error) {
      console.error('[settingService] 重启应用失败:', error);
      throw error;
    }
  },

  /**
   * 恢复出厂设置
   * @returns {Promise<{ success: boolean, error?: string }>}
   */
  async factoryReset() {
    try {
      return await electronAPI.factoryReset();
    } catch (error) {
      console.error('[settingService] 恢复出厂设置失败:', error);
      return { success: false, error: error.message };
    }
  },

  /**
   * 获取代理配置
   * @returns {Promise<Object>}
   */
  async getProxyConfig() {
    try {
      return await electronAPI.getProxyConfig();
    } catch (error) {
      console.error('[settingService] 获取代理配置失败:', error);
      return { enabled: false };
    }
  },

  /**
   * 设置代理配置
   * @param {Object} config - 代理配置
   * @returns {Promise<{ success: boolean }>}
   */
  async setProxyConfig(config) {
    try {
      return await electronAPI.setProxyConfig(config);
    } catch (error) {
      console.error('[settingService] 设置代理配置失败:', error);
      return { success: false };
    }
  },

  /**
   * 测试代理连接
   * @param {Object} config - 代理配置
   * @returns {Promise<{ success: boolean, message?: string }>}
   */
  async testProxyConnection(config) {
    try {
      return await electronAPI.testProxyConnection(config);
    } catch (error) {
      console.error('[settingService] 测试代理连接失败:', error);
      return { success: false, message: error.message };
    }
  },
};

export default settingService;
