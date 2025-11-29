/**
 * 版本历史服务层
 *
 * 封装所有版本历史相关的 IPC 调用，提供统一的接口和错误处理
 */

import { electronAPI } from '@/utils/electronAPI';

/**
 * 版本历史服务
 */
export const versionService = {
  /**
   * 保存版本快照
   * @param {string} noteId - 笔记 ID
   * @param {string} content - 笔记内容
   * @param {boolean} forceSave - 是否强制保存
   * @returns {Promise<number>} 版本时间戳
   */
  async save(noteId, content, forceSave = false) {
    try {
      return await electronAPI.saveVersion(noteId, content, forceSave);
    } catch (error) {
      console.error('[versionService] 保存版本失败:', noteId, error);
      throw error;
    }
  },

  /**
   * 获取版本列表
   * @param {string} noteId - 笔记 ID
   * @param {number} limit - 限制数量
   * @param {number} offset - 偏移量
   * @returns {Promise<Array>} 版本列表
   */
  async getList(noteId, limit = 20, offset = 0) {
    try {
      return await electronAPI.getVersions(noteId, limit, offset);
    } catch (error) {
      console.error('[versionService] 获取版本列表失败:', noteId, error);
      return [];
    }
  },

  /**
   * 获取版本数量
   * @param {string} noteId - 笔记 ID
   * @returns {Promise<number>}
   */
  async getCount(noteId) {
    try {
      return await electronAPI.getVersionCount(noteId);
    } catch (error) {
      console.error('[versionService] 获取版本数量失败:', noteId, error);
      return 0;
    }
  },

  /**
   * 获取版本详情
   * @param {number} versionId - 版本 ID
   * @returns {Promise<Object>}
   */
  async get(versionId) {
    try {
      return await electronAPI.getVersion(versionId);
    } catch (error) {
      console.error('[versionService] 获取版本详情失败:', versionId, error);
      throw error;
    }
  },

  /**
   * 删除版本
   * @param {number} versionId - 版本 ID
   * @returns {Promise<boolean>}
   */
  async delete(versionId) {
    try {
      return await electronAPI.deleteVersion(versionId);
    } catch (error) {
      console.error('[versionService] 删除版本失败:', versionId, error);
      throw error;
    }
  },

  /**
   * 删除笔记所有版本
   * @param {string} noteId - 笔记 ID
   * @returns {Promise<boolean>}
   */
  async deleteAll(noteId) {
    try {
      return await electronAPI.deleteAllVersions(noteId);
    } catch (error) {
      console.error('[versionService] 删除所有版本失败:', noteId, error);
      throw error;
    }
  },

  /**
   * 比较两个版本
   * @param {number} versionId1 - 版本 1 ID
   * @param {number} versionId2 - 版本 2 ID
   * @returns {Promise<Object>}
   */
  async compare(versionId1, versionId2) {
    try {
      return await electronAPI.compareVersions(versionId1, versionId2);
    } catch (error) {
      console.error('[versionService] 比较版本失败:', versionId1, versionId2, error);
      throw error;
    }
  },

  /**
   * 获取版本统计
   * @returns {Promise<Object>}
   */
  async getStats() {
    try {
      return await electronAPI.getVersionStats();
    } catch (error) {
      console.error('[versionService] 获取版本统计失败:', error);
      return { totalVersions: 0, notesWithVersions: 0, totalSize: 0 };
    }
  },
};

export default versionService;
