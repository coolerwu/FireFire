const Database = require('better-sqlite3');
const path = require('path');
const fs = require('fs');
const { confPath } = require('./env');

/**
 * SQLite 数据库管理器
 *
 * 使用 better-sqlite3 提供高性能的本地存储和全文搜索
 */
class DatabaseManager {
  constructor() {
    this.db = null;
    this.initialized = false;
    // 注意：不在构造函数中初始化，等待 workspaceManager 确定工作空间后再初始化
  }

  /**
   * 初始化数据库（需要在 workspaceManager.checkWorkspace() 之后调用）
   */
  init() {
    if (this.initialized) {
      return;
    }
    const dbPath = path.join(confPath, 'firefire.db');

    // 确保目录存在
    const dbDir = path.dirname(dbPath);
    if (!fs.existsSync(dbDir)) {
      fs.mkdirSync(dbDir, { recursive: true });
    }

    // 打开数据库连接
    this.db = new Database(dbPath);
    this.db.pragma('journal_mode = WAL'); // 使用 WAL 模式提升性能
    this.db.pragma('foreign_keys = ON');  // 启用外键约束

    // 创建表结构
    this.createTables();

    this.initialized = true;
    console.log('[DatabaseManager] 数据库初始化完成:', dbPath);
  }

  /**
   * 创建数据库表结构
   */
  createTables() {
    // 笔记表
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS notes (
        id TEXT PRIMARY KEY,
        title TEXT NOT NULL,
        path TEXT NOT NULL UNIQUE,
        content_text TEXT,
        created_at INTEGER NOT NULL,
        updated_at INTEGER NOT NULL,
        is_journal INTEGER DEFAULT 0,
        journal_date TEXT
      )
    `);

    // 标签表
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS tags (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT UNIQUE NOT NULL
      )
    `);

    // 笔记-标签关联表（多对多）
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS note_tags (
        note_id TEXT NOT NULL,
        tag_id INTEGER NOT NULL,
        PRIMARY KEY (note_id, tag_id),
        FOREIGN KEY (note_id) REFERENCES notes(id) ON DELETE CASCADE,
        FOREIGN KEY (tag_id) REFERENCES tags(id) ON DELETE CASCADE
      )
    `);

    // 笔记链接表
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS links (
        from_note_id TEXT NOT NULL,
        to_note_id TEXT NOT NULL,
        PRIMARY KEY (from_note_id, to_note_id),
        FOREIGN KEY (from_note_id) REFERENCES notes(id) ON DELETE CASCADE,
        FOREIGN KEY (to_note_id) REFERENCES notes(id) ON DELETE CASCADE
      )
    `);

    // 创建索引
    this.db.exec(`
      CREATE INDEX IF NOT EXISTS idx_notes_updated_at ON notes(updated_at DESC);
      CREATE INDEX IF NOT EXISTS idx_note_tags_note_id ON note_tags(note_id);
      CREATE INDEX IF NOT EXISTS idx_note_tags_tag_id ON note_tags(tag_id);
      CREATE INDEX IF NOT EXISTS idx_links_from ON links(from_note_id);
      CREATE INDEX IF NOT EXISTS idx_links_to ON links(to_note_id);
      CREATE INDEX IF NOT EXISTS idx_journal_date ON notes(journal_date DESC) WHERE is_journal = 1;
    `);

    // 创建全文搜索虚拟表（FTS5）
    this.db.exec(`
      CREATE VIRTUAL TABLE IF NOT EXISTS notes_fts USING fts5(
        title,
        content_text,
        content='notes',
        content_rowid='rowid'
      )
    `);

    // 创建触发器：自动更新 FTS 索引
    this.db.exec(`
      CREATE TRIGGER IF NOT EXISTS notes_ai AFTER INSERT ON notes BEGIN
        INSERT INTO notes_fts(rowid, title, content_text)
        VALUES (new.rowid, new.title, new.content_text);
      END;

      CREATE TRIGGER IF NOT EXISTS notes_ad AFTER DELETE ON notes BEGIN
        DELETE FROM notes_fts WHERE rowid = old.rowid;
      END;

      CREATE TRIGGER IF NOT EXISTS notes_au AFTER UPDATE ON notes BEGIN
        UPDATE notes_fts SET title = new.title, content_text = new.content_text
        WHERE rowid = new.rowid;
      END;
    `);
  }

  /**
   * 保存或更新笔记
   */
  saveNote(noteData) {
    const { id, title, path: notePath, contentText, tags = [], outgoingLinks = [], isJournal = false, journalDate = null } = noteData;
    const now = Date.now();

    // 使用事务确保数据一致性
    const transaction = this.db.transaction(() => {
      // 检查笔记是否已存在
      const existing = this.db.prepare('SELECT id, created_at FROM notes WHERE id = ?').get(id);
      const createdAt = existing ? existing.created_at : now;

      // 插入或更新笔记
      this.db.prepare(`
        INSERT INTO notes (id, title, path, content_text, created_at, updated_at, is_journal, journal_date)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        ON CONFLICT(id) DO UPDATE SET
          title = excluded.title,
          path = excluded.path,
          content_text = excluded.content_text,
          updated_at = excluded.updated_at,
          is_journal = excluded.is_journal,
          journal_date = excluded.journal_date
      `).run(id, title, notePath, contentText, createdAt, now, isJournal ? 1 : 0, journalDate);

      // 更新标签关联
      this.db.prepare('DELETE FROM note_tags WHERE note_id = ?').run(id);
      if (tags.length > 0) {
        const insertTag = this.db.prepare('INSERT OR IGNORE INTO tags (name) VALUES (?)');
        const getTagId = this.db.prepare('SELECT id FROM tags WHERE name = ?');
        const insertNoteTag = this.db.prepare('INSERT INTO note_tags (note_id, tag_id) VALUES (?, ?)');

        for (const tagName of tags) {
          insertTag.run(tagName);
          const tag = getTagId.get(tagName);
          if (tag) {
            insertNoteTag.run(id, tag.id);
          }
        }
      }

      // 更新链接关联
      this.db.prepare('DELETE FROM links WHERE from_note_id = ?').run(id);
      if (outgoingLinks.length > 0) {
        const insertLink = this.db.prepare('INSERT OR IGNORE INTO links (from_note_id, to_note_id) VALUES (?, ?)');
        for (const targetId of outgoingLinks) {
          insertLink.run(id, targetId);
        }
      }
    });

    transaction();
    console.log(`[DatabaseManager] 保存笔记: ${title}`);
  }

  /**
   * 删除笔记
   */
  deleteNote(noteId) {
    this.db.prepare('DELETE FROM notes WHERE id = ?').run(noteId);
    console.log(`[DatabaseManager] 删除笔记: ${noteId}`);
  }

  /**
   * 获取所有标签
   */
  getAllTags() {
    const rows = this.db.prepare(`
      SELECT tags.name, COUNT(note_tags.note_id) as count
      FROM tags
      LEFT JOIN note_tags ON tags.id = note_tags.tag_id
      GROUP BY tags.id, tags.name
      HAVING count > 0
      ORDER BY count DESC
    `).all();

    return rows.map(row => ({
      name: row.name,
      count: row.count,
    }));
  }

  /**
   * 根据标签获取笔记
   */
  getNotesByTag(tagName) {
    const rows = this.db.prepare(`
      SELECT notes.id, notes.title, notes.path, notes.updated_at
      FROM notes
      JOIN note_tags ON notes.id = note_tags.note_id
      JOIN tags ON note_tags.tag_id = tags.id
      WHERE tags.name = ?
      ORDER BY notes.updated_at DESC
    `).all(tagName);

    return rows.map(row => ({
      id: row.id,
      title: row.title,
      path: row.path,
      updatedAt: new Date(row.updated_at).toISOString(),
    }));
  }

  /**
   * 获取笔记的标签
   */
  getNoteTags(noteId) {
    const rows = this.db.prepare(`
      SELECT tags.name
      FROM tags
      JOIN note_tags ON tags.id = note_tags.tag_id
      WHERE note_tags.note_id = ?
    `).all(noteId);

    return rows.map(row => row.name);
  }

  /**
   * 获取反向链接（谁链接到这个笔记）
   */
  getBacklinks(noteId) {
    const rows = this.db.prepare(`
      SELECT notes.id, notes.title, notes.path
      FROM notes
      JOIN links ON notes.id = links.from_note_id
      WHERE links.to_note_id = ?
    `).all(noteId);

    return rows.map(row => ({
      id: row.id,
      title: row.title,
      path: row.path,
    }));
  }

  /**
   * 全文搜索笔记（FTS5）
   */
  searchNotes(query) {
    if (!query || query.trim() === '') {
      return [];
    }

    // 使用 FTS5 全文搜索
    const rows = this.db.prepare(`
      SELECT notes.id, notes.title, notes.path, notes.updated_at,
             rank
      FROM notes_fts
      JOIN notes ON notes.rowid = notes_fts.rowid
      WHERE notes_fts MATCH ?
      ORDER BY rank
      LIMIT 50
    `).all(query);

    return rows.map(row => ({
      id: row.id,
      title: row.title,
      path: row.path,
      score: -row.rank, // rank 是负数，转为正数表示相关性
    }));
  }

  /**
   * 检查笔记是否存在
   */
  noteExists(noteId) {
    const row = this.db.prepare('SELECT 1 FROM notes WHERE id = ? LIMIT 1').get(noteId);
    return !!row;
  }

  /**
   * 获取所有笔记列表
   */
  getAllNotes() {
    const rows = this.db.prepare(`
      SELECT id, title, path, updated_at
      FROM notes
      ORDER BY updated_at DESC
    `).all();

    return rows.map(row => ({
      id: row.id,
      title: row.title,
      path: row.path,
      updatedAt: new Date(row.updated_at).toISOString(),
    }));
  }

  /**
   * 获取日记列表（按日期倒序）
   */
  getJournals(limit = 30, offset = 0) {
    const rows = this.db.prepare(`
      SELECT id, title, path, journal_date, updated_at
      FROM notes
      WHERE is_journal = 1
      ORDER BY journal_date DESC
      LIMIT ? OFFSET ?
    `).all(limit, offset);

    return rows.map(row => ({
      id: row.id,
      title: row.title,
      path: row.path,
      journalDate: row.journal_date,
      updatedAt: new Date(row.updated_at).toISOString(),
    }));
  }

  /**
   * 检查指定日期的日记是否存在
   */
  journalExists(date) {
    const row = this.db.prepare(`
      SELECT 1 FROM notes
      WHERE is_journal = 1 AND journal_date = ?
      LIMIT 1
    `).get(date);
    return !!row;
  }

  /**
   * 获取日记总数
   */
  getJournalCount() {
    const row = this.db.prepare(`
      SELECT COUNT(*) as count FROM notes WHERE is_journal = 1
    `).get();
    return row.count;
  }

  /**
   * 获取最近更新的笔记（按更新时间倒序，不包括日记）
   */
  getRecentNotes(limit = 30, offset = 0) {
    const rows = this.db.prepare(`
      SELECT id, title, path, updated_at
      FROM notes
      WHERE is_journal = 0
      ORDER BY updated_at DESC
      LIMIT ? OFFSET ?
    `).all(limit, offset);

    return rows.map(row => ({
      id: row.id,
      title: row.title,
      path: row.path,
      tags: [],  // TODO: 从文件内容中提取标签
      updatedAt: new Date(row.updated_at).toISOString(),
    }));
  }

  /**
   * 检查数据库完整性
   * @returns {object} { ok: boolean, error?: string }
   */
  checkIntegrity() {
    try {
      const result = this.db.pragma('integrity_check');
      const isOk = result.length === 1 && result[0].integrity_check === 'ok';
      if (!isOk) {
        console.error('[DatabaseManager] 完整性检查失败:', result);
        return { ok: false, error: JSON.stringify(result) };
      }
      console.log('[DatabaseManager] 数据库完整性检查通过');
      return { ok: true };
    } catch (err) {
      console.error('[DatabaseManager] 完整性检查异常:', err);
      return { ok: false, error: err.message };
    }
  }

  /**
   * 重建 FTS5 索引（修复 FTS 相关问题）
   */
  rebuildFtsIndex() {
    try {
      console.log('[DatabaseManager] 开始重建 FTS5 索引...');
      // 删除并重建 FTS 表
      this.db.exec(`
        DROP TABLE IF EXISTS notes_fts;
        CREATE VIRTUAL TABLE notes_fts USING fts5(
          title,
          content_text,
          content='notes',
          content_rowid='rowid'
        );
        INSERT INTO notes_fts(notes_fts) VALUES('rebuild');
      `);
      console.log('[DatabaseManager] FTS5 索引重建完成');
      return { ok: true };
    } catch (err) {
      console.error('[DatabaseManager] FTS5 索引重建失败:', err);
      return { ok: false, error: err.message };
    }
  }

  /**
   * 尝试修复数据库
   * @returns {object} { ok: boolean, message: string }
   */
  repair() {
    const dbPath = path.join(confPath, 'firefire.db');
    const backupPath = path.join(confPath, `firefire_backup_${Date.now()}.db`);

    try {
      // 1. 首先尝试检查完整性
      const integrityResult = this.checkIntegrity();
      if (integrityResult.ok) {
        // 尝试重建 FTS 索引
        const ftsResult = this.rebuildFtsIndex();
        if (ftsResult.ok) {
          return { ok: true, message: '数据库修复完成（重建了 FTS 索引）' };
        }
      }

      // 2. 如果完整性检查失败，尝试导出数据并重建
      console.log('[DatabaseManager] 尝试导出数据并重建数据库...');

      // 备份当前数据库
      if (fs.existsSync(dbPath)) {
        fs.copyFileSync(dbPath, backupPath);
        console.log('[DatabaseManager] 已备份旧数据库到:', backupPath);
      }

      // 尝试从损坏的数据库导出数据
      let notes = [];
      try {
        notes = this.db.prepare('SELECT * FROM notes').all();
        console.log(`[DatabaseManager] 成功导出 ${notes.length} 条笔记`);
      } catch (err) {
        console.error('[DatabaseManager] 无法从损坏数据库导出数据:', err);
      }

      // 关闭当前连接
      this.close();

      // 删除损坏的数据库文件（保留备份）
      if (fs.existsSync(dbPath)) {
        fs.unlinkSync(dbPath);
      }
      // 也删除 WAL 和 SHM 文件
      if (fs.existsSync(dbPath + '-wal')) {
        fs.unlinkSync(dbPath + '-wal');
      }
      if (fs.existsSync(dbPath + '-shm')) {
        fs.unlinkSync(dbPath + '-shm');
      }

      // 重新初始化
      this.initialized = false;
      this.init();

      // 恢复数据
      if (notes.length > 0) {
        const insertNote = this.db.prepare(`
          INSERT INTO notes (id, title, path, content_text, created_at, updated_at, is_journal, journal_date)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        `);

        const transaction = this.db.transaction(() => {
          for (const note of notes) {
            try {
              insertNote.run(
                note.id,
                note.title,
                note.path,
                note.content_text,
                note.created_at,
                note.updated_at,
                note.is_journal,
                note.journal_date
              );
            } catch (err) {
              console.error('[DatabaseManager] 恢复笔记失败:', note.id, err);
            }
          }
        });
        transaction();
        console.log(`[DatabaseManager] 已恢复 ${notes.length} 条笔记`);
      }

      return { ok: true, message: `数据库已重建，恢复了 ${notes.length} 条笔记。旧数据库备份在: ${backupPath}` };
    } catch (err) {
      console.error('[DatabaseManager] 数据库修复失败:', err);
      return { ok: false, message: `修复失败: ${err.message}` };
    }
  }

  /**
   * 关闭数据库连接
   */
  close() {
    if (this.db) {
      // 在关闭前执行 checkpoint，确保 WAL 写入主文件
      try {
        this.db.pragma('wal_checkpoint(TRUNCATE)');
      } catch (err) {
        console.error('[DatabaseManager] WAL checkpoint 失败:', err);
      }
      this.db.close();
      this.db = null;
      this.initialized = false;
      console.log('[DatabaseManager] 数据库连接已关闭');
    }
  }
}

// 导出单例
module.exports = new DatabaseManager();
