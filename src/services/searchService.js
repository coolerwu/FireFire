/**
 * 搜索服务层
 *
 * 封装所有搜索相关的 IPC 调用，提供统一的接口和错误处理
 */

import { electronAPI } from '@/utils/electronAPI';

/**
 * 搜索服务
 */
export const searchService = {
  /**
   * 全文搜索笔记
   * @param {string} query - 搜索关键词
   * @returns {Promise<Array>} 搜索结果
   */
  async search(query) {
    if (!query || query.trim() === '') {
      return [];
    }

    try {
      return await electronAPI.searchNotes(query);
    } catch (error) {
      console.error('[searchService] 搜索失败:', query, error);
      throw error;
    }
  },

  /**
   * 获取所有标签
   * @returns {Promise<Array>} 标签列表 [{ name, count }]
   */
  async getAllTags() {
    try {
      return await electronAPI.getAllTags();
    } catch (error) {
      console.error('[searchService] 获取标签失败:', error);
      return [];
    }
  },

  /**
   * 根据标签获取笔记
   * @param {string} tagName - 标签名
   * @returns {Promise<Array>} 笔记列表
   */
  async getNotesByTag(tagName) {
    try {
      return await electronAPI.getNotesByTag(tagName);
    } catch (error) {
      console.error('[searchService] 获取标签笔记失败:', tagName, error);
      return [];
    }
  },

  /**
   * 获取知识图谱数据
   * @returns {Promise<{ nodes: Array, links: Array }>}
   */
  async getGraphData() {
    try {
      return await electronAPI.getGraphData();
    } catch (error) {
      console.error('[searchService] 获取图谱数据失败:', error);
      return { nodes: [], links: [] };
    }
  },
};

export default searchService;
