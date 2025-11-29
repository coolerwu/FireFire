/**
 * 日记服务层
 *
 * 封装所有日记相关的 IPC 调用，提供统一的接口和错误处理
 */

import { electronAPI } from '@/utils/electronAPI';

/**
 * 日记服务
 */
export const journalService = {
  /**
   * 获取今天的日记
   * @returns {Promise<string>} 日记路径
   */
  async getToday() {
    try {
      return await electronAPI.getTodayJournal();
    } catch (error) {
      console.error('[journalService] 获取今日日记失败:', error);
      throw error;
    }
  },

  /**
   * 创建日记
   * @param {string} date - 日期字符串 (YYYY-MM-DD)
   * @returns {Promise<string>} 日记路径
   */
  async create(date) {
    try {
      return await electronAPI.createJournal(date);
    } catch (error) {
      console.error('[journalService] 创建日记失败:', date, error);
      throw error;
    }
  },

  /**
   * 获取日记列表
   * @param {number} limit - 限制数量
   * @param {number} offset - 偏移量
   * @returns {Promise<Array>} 日记列表
   */
  async getList(limit = 30, offset = 0) {
    try {
      return await electronAPI.getJournals(limit, offset);
    } catch (error) {
      console.error('[journalService] 获取日记列表失败:', error);
      throw error;
    }
  },

  /**
   * 检查日记是否存在
   * @param {string} date - 日期字符串 (YYYY-MM-DD)
   * @returns {Promise<boolean>}
   */
  async exists(date) {
    try {
      return await electronAPI.journalExists(date);
    } catch (error) {
      console.error('[journalService] 检查日记存在失败:', date, error);
      return false;
    }
  },

  /**
   * 获取日记总数
   * @returns {Promise<number>}
   */
  async getCount() {
    try {
      return await electronAPI.getJournalCount();
    } catch (error) {
      console.error('[journalService] 获取日记总数失败:', error);
      return 0;
    }
  },

  /**
   * 删除日记
   * @param {string} dateStr - 日期字符串 (YYYY-MM-DD)
   * @returns {Promise<boolean>}
   */
  async delete(dateStr) {
    try {
      return await electronAPI.deleteJournal(dateStr);
    } catch (error) {
      console.error('[journalService] 删除日记失败:', dateStr, error);
      throw error;
    }
  },
};

export default journalService;
