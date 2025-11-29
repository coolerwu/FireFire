const path = require('path');
const { confPath } = require('./env');

/**
 * 笔记版本历史管理器
 *
 * 自动保存笔记的历史版本，支持查看和恢复
 */
class VersionManager {
  constructor() {
    this.db = null;
    this.initialized = false;
    // 版本保存配置
    this.config = {
      maxVersions: 50,        // 每个笔记最多保留版本数
      maxAgeDays: 30,         // 版本最长保留天数
      minSaveInterval: 300000, // 最小保存间隔（5分钟）
      minContentChange: 100,   // 触发保存的最小内容变化（字符数）
    };
    // 记录每个笔记的上次保存时间和内容长度
    this.lastSaveInfo = new Map();
  }

  /**
   * 初始化版本管理器（需要传入已初始化的数据库实例）
   */
  init(db) {
    if (this.initialized) return;

    this.db = db;
    this.createTables();
    this.initialized = true;
    console.log('[VersionManager] 版本管理器初始化完成');
  }

  /**
   * 创建版本历史表
   */
  createTables() {
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS note_versions (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        note_id TEXT NOT NULL,
        content TEXT NOT NULL,
        content_length INTEGER NOT NULL,
        summary TEXT,
        created_at INTEGER NOT NULL,
        FOREIGN KEY (note_id) REFERENCES notes(id) ON DELETE CASCADE
      )
    `);

    this.db.exec(`
      CREATE INDEX IF NOT EXISTS idx_versions_note_id ON note_versions(note_id);
      CREATE INDEX IF NOT EXISTS idx_versions_created_at ON note_versions(created_at DESC);
    `);
  }

  /**
   * 判断是否需要保存新版本
   */
  shouldSaveVersion(noteId, content) {
    const lastInfo = this.lastSaveInfo.get(noteId);
    const now = Date.now();
    const contentLength = content ? content.length : 0;

    if (!lastInfo) {
      return true; // 首次保存
    }

    const timeSinceLastSave = now - lastInfo.timestamp;
    const contentChange = Math.abs(contentLength - lastInfo.contentLength);

    // 距上次保存超过5分钟 且 内容有变化
    if (timeSinceLastSave >= this.config.minSaveInterval && contentChange > 0) {
      return true;
    }

    // 内容变化超过阈值
    if (contentChange >= this.config.minContentChange) {
      return true;
    }

    return false;
  }

  /**
   * 保存笔记版本
   */
  saveVersion(noteId, content, forceSave = false) {
    if (!this.initialized) {
      console.warn('[VersionManager] 版本管理器未初始化');
      return null;
    }

    // 检查是否需要保存
    if (!forceSave && !this.shouldSaveVersion(noteId, content)) {
      return null;
    }

    const now = Date.now();
    const contentLength = content ? content.length : 0;
    const summary = this.generateSummary(content);

    try {
      // 保存新版本
      const result = this.db.prepare(`
        INSERT INTO note_versions (note_id, content, content_length, summary, created_at)
        VALUES (?, ?, ?, ?, ?)
      `).run(noteId, content, contentLength, summary, now);

      // 更新保存记录
      this.lastSaveInfo.set(noteId, {
        timestamp: now,
        contentLength: contentLength,
      });

      // 清理旧版本
      this.cleanOldVersions(noteId);

      console.log(`[VersionManager] 保存版本: noteId=${noteId}, versionId=${result.lastInsertRowid}`);
      return result.lastInsertRowid;
    } catch (err) {
      console.error('[VersionManager] 保存版本失败:', err);
      return null;
    }
  }

  /**
   * 生成版本摘要
   */
  generateSummary(content) {
    if (!content) return '空内容';

    try {
      const parsed = JSON.parse(content);
      // 提取文本内容
      const textContent = this.extractText(parsed);
      const wordCount = textContent.length;
      const preview = textContent.substring(0, 50);
      return `${wordCount} 字符${preview ? ': ' + preview + '...' : ''}`;
    } catch {
      return `${content.length} 字符`;
    }
  }

  /**
   * 从 Tiptap JSON 中提取纯文本
   */
  extractText(node) {
    if (!node) return '';

    if (typeof node === 'string') return node;

    if (node.text) return node.text;

    if (node.content && Array.isArray(node.content)) {
      return node.content.map(n => this.extractText(n)).join('');
    }

    return '';
  }

  /**
   * 清理旧版本
   */
  cleanOldVersions(noteId) {
    const cutoffTime = Date.now() - (this.config.maxAgeDays * 24 * 60 * 60 * 1000);

    // 删除超过保留天数的版本
    this.db.prepare(`
      DELETE FROM note_versions
      WHERE note_id = ? AND created_at < ?
    `).run(noteId, cutoffTime);

    // 删除超出最大数量的版本（保留最新的）
    this.db.prepare(`
      DELETE FROM note_versions
      WHERE note_id = ? AND id NOT IN (
        SELECT id FROM note_versions
        WHERE note_id = ?
        ORDER BY created_at DESC
        LIMIT ?
      )
    `).run(noteId, noteId, this.config.maxVersions);
  }

  /**
   * 获取笔记的版本历史列表
   */
  getVersions(noteId, limit = 50, offset = 0) {
    const rows = this.db.prepare(`
      SELECT id, note_id, content_length, summary, created_at
      FROM note_versions
      WHERE note_id = ?
      ORDER BY created_at DESC
      LIMIT ? OFFSET ?
    `).all(noteId, limit, offset);

    return rows.map(row => ({
      id: row.id,
      noteId: row.note_id,
      contentLength: row.content_length,
      summary: row.summary,
      createdAt: new Date(row.created_at).toISOString(),
    }));
  }

  /**
   * 获取版本总数
   */
  getVersionCount(noteId) {
    const row = this.db.prepare(`
      SELECT COUNT(*) as count FROM note_versions WHERE note_id = ?
    `).get(noteId);
    return row.count;
  }

  /**
   * 获取特定版本的完整内容
   */
  getVersion(versionId) {
    const row = this.db.prepare(`
      SELECT id, note_id, content, content_length, summary, created_at
      FROM note_versions
      WHERE id = ?
    `).get(versionId);

    if (!row) return null;

    return {
      id: row.id,
      noteId: row.note_id,
      content: row.content,
      contentLength: row.content_length,
      summary: row.summary,
      createdAt: new Date(row.created_at).toISOString(),
    };
  }

  /**
   * 删除特定版本
   */
  deleteVersion(versionId) {
    this.db.prepare('DELETE FROM note_versions WHERE id = ?').run(versionId);
    console.log(`[VersionManager] 删除版本: ${versionId}`);
  }

  /**
   * 删除笔记的所有版本
   */
  deleteAllVersions(noteId) {
    this.db.prepare('DELETE FROM note_versions WHERE note_id = ?').run(noteId);
    this.lastSaveInfo.delete(noteId);
    console.log(`[VersionManager] 删除笔记所有版本: ${noteId}`);
  }

  /**
   * 比较两个版本的差异（简单实现）
   */
  compareVersions(versionId1, versionId2) {
    const v1 = this.getVersion(versionId1);
    const v2 = this.getVersion(versionId2);

    if (!v1 || !v2) return null;

    return {
      version1: {
        id: v1.id,
        createdAt: v1.createdAt,
        contentLength: v1.contentLength,
      },
      version2: {
        id: v2.id,
        createdAt: v2.createdAt,
        contentLength: v2.contentLength,
      },
      lengthDiff: v2.contentLength - v1.contentLength,
    };
  }

  /**
   * 获取存储统计信息
   */
  getStats() {
    const stats = this.db.prepare(`
      SELECT
        COUNT(*) as totalVersions,
        COUNT(DISTINCT note_id) as notesWithVersions,
        SUM(content_length) as totalSize
      FROM note_versions
    `).get();

    return {
      totalVersions: stats.totalVersions,
      notesWithVersions: stats.notesWithVersions,
      totalSize: stats.totalSize || 0,
      totalSizeMB: ((stats.totalSize || 0) / (1024 * 1024)).toFixed(2),
    };
  }

  /**
   * 迁移版本历史（用于重命名笔记）
   * @param {string} oldNoteId - 旧笔记 ID
   * @param {string} newNoteId - 新笔记 ID
   * @returns {number} 迁移的版本数量
   */
  migrateVersions(oldNoteId, newNoteId) {
    if (!this.db) return 0;

    try {
      const result = this.db.prepare(`
        UPDATE note_versions SET note_id = ? WHERE note_id = ?
      `).run(newNoteId, oldNoteId);

      // 更新内存中的最后保存信息
      if (this.lastSaveInfo.has(oldNoteId)) {
        this.lastSaveInfo.set(newNoteId, this.lastSaveInfo.get(oldNoteId));
        this.lastSaveInfo.delete(oldNoteId);
      }

      console.log(`[VersionManager] 迁移版本: ${oldNoteId} -> ${newNoteId} (${result.changes} 个版本)`);
      return result.changes;
    } catch (error) {
      console.error('[VersionManager] 迁移版本失败:', error);
      return 0;
    }
  }
}

// 导出单例
module.exports = new VersionManager();
