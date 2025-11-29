/**
 * 笔记服务层
 *
 * 封装所有笔记相关的 IPC 调用，提供统一的接口和错误处理
 */

import { electronAPI } from '@/utils/electronAPI';

/**
 * 笔记服务
 */
export const noteService = {
  /**
   * 读取笔记内容
   * @param {string} path - 笔记相对路径
   * @returns {Promise<string>} 笔记 JSON 内容
   */
  async read(path) {
    try {
      const content = await electronAPI.readNotebookFile(path);
      return content;
    } catch (error) {
      console.error('[noteService] 读取笔记失败:', path, error);
      throw error;
    }
  },

  /**
   * 写入笔记内容
   * @param {string} path - 笔记相对路径
   * @param {string} content - 笔记 JSON 内容
   * @returns {Promise<boolean>}
   */
  async write(path, content) {
    try {
      await electronAPI.writeNotebookFile(path, content);
      return true;
    } catch (error) {
      console.error('[noteService] 写入笔记失败:', path, error);
      throw error;
    }
  },

  /**
   * 创建笔记
   * @param {string} path - 笔记相对路径
   * @returns {Promise<boolean>}
   */
  async create(path) {
    try {
      await electronAPI.createNotebookFile(path);
      return true;
    } catch (error) {
      console.error('[noteService] 创建笔记失败:', path, error);
      throw error;
    }
  },

  /**
   * 删除笔记
   * @param {string} path - 笔记相对路径
   * @returns {Promise<boolean>}
   */
  async delete(path) {
    try {
      return await electronAPI.deleteNotebookFile(path);
    } catch (error) {
      console.error('[noteService] 删除笔记失败:', path, error);
      throw error;
    }
  },

  /**
   * 重命名笔记
   * @param {string} oldPath - 旧路径
   * @param {string} newPath - 新路径
   * @returns {Promise<boolean>}
   */
  async rename(oldPath, newPath) {
    try {
      return await electronAPI.renameNotebookFile(oldPath, newPath);
    } catch (error) {
      console.error('[noteService] 重命名笔记失败:', oldPath, '->', newPath, error);
      throw error;
    }
  },

  /**
   * 获取文件列表
   * @param {string} path - 目录相对路径
   * @returns {Promise<Array>} 文件列表
   */
  async getFileList(path = '') {
    try {
      return await electronAPI.readNotebookFileList(path);
    } catch (error) {
      console.error('[noteService] 获取文件列表失败:', path, error);
      throw error;
    }
  },

  /**
   * 创建目录
   * @param {string} path - 目录相对路径
   * @returns {Promise<boolean>}
   */
  async createDirectory(path) {
    try {
      await electronAPI.createNotebookDir(path);
      return true;
    } catch (error) {
      console.error('[noteService] 创建目录失败:', path, error);
      throw error;
    }
  },

  /**
   * 删除目录
   * @param {string} path - 目录相对路径
   * @returns {Promise<boolean>}
   */
  async deleteDirectory(path) {
    try {
      return await electronAPI.deleteDirectory(path);
    } catch (error) {
      console.error('[noteService] 删除目录失败:', path, error);
      throw error;
    }
  },

  /**
   * 检查笔记是否存在
   * @param {string} noteId - 笔记 ID
   * @returns {Promise<boolean>}
   */
  async exists(noteId) {
    try {
      return await electronAPI.noteExists(noteId);
    } catch (error) {
      console.error('[noteService] 检查笔记存在失败:', noteId, error);
      return false;
    }
  },

  /**
   * 获取所有笔记
   * @returns {Promise<Array>}
   */
  async getAll() {
    try {
      return await electronAPI.getAllNotes();
    } catch (error) {
      console.error('[noteService] 获取所有笔记失败:', error);
      throw error;
    }
  },

  /**
   * 获取最近笔记
   * @param {number} limit - 限制数量
   * @param {number} offset - 偏移量
   * @returns {Promise<Array>}
   */
  async getRecent(limit = 30, offset = 0) {
    try {
      return await electronAPI.getRecentNotes(limit, offset);
    } catch (error) {
      console.error('[noteService] 获取最近笔记失败:', error);
      throw error;
    }
  },

  /**
   * 获取笔记标签
   * @param {string} noteId - 笔记 ID
   * @returns {Promise<Array<string>>}
   */
  async getTags(noteId) {
    try {
      return await electronAPI.getNoteTags(noteId);
    } catch (error) {
      console.error('[noteService] 获取笔记标签失败:', noteId, error);
      return [];
    }
  },

  /**
   * 获取反向链接
   * @param {string} noteId - 笔记 ID
   * @returns {Promise<Array>}
   */
  async getBacklinks(noteId) {
    try {
      return await electronAPI.getBacklinks(noteId);
    } catch (error) {
      console.error('[noteService] 获取反向链接失败:', noteId, error);
      return [];
    }
  },
};

export default noteService;
