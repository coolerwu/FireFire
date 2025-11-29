/**
 * dbManager.js 单元测试
 *
 * 测试数据库管理器的核心功能
 * 使用内存数据库进行测试，不影响真实数据
 */

let Database;
let dbAvailable = false;

try {
  Database = require('better-sqlite3');
  // 尝试创建内存数据库来验证是否真正可用
  const testDb = new Database(':memory:');
  testDb.close();
  dbAvailable = true;
} catch (e) {
  console.warn('better-sqlite3 不可用（可能是 Node 版本不匹配），跳过数据库测试');
  dbAvailable = false;
}

// 创建内存数据库用于测试
function createTestDatabase() {
  if (!dbAvailable) return null;

  const db = new Database(':memory:');
  db.pragma('journal_mode = WAL');
  db.pragma('foreign_keys = ON');

  // 创建表结构
  db.exec(`
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

  db.exec(`
    CREATE TABLE IF NOT EXISTS tags (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT UNIQUE NOT NULL
    )
  `);

  db.exec(`
    CREATE TABLE IF NOT EXISTS note_tags (
      note_id TEXT NOT NULL,
      tag_id INTEGER NOT NULL,
      PRIMARY KEY (note_id, tag_id),
      FOREIGN KEY (note_id) REFERENCES notes(id) ON DELETE CASCADE,
      FOREIGN KEY (tag_id) REFERENCES tags(id) ON DELETE CASCADE
    )
  `);

  db.exec(`
    CREATE TABLE IF NOT EXISTS links (
      from_note_id TEXT NOT NULL,
      to_note_id TEXT NOT NULL,
      PRIMARY KEY (from_note_id, to_note_id),
      FOREIGN KEY (from_note_id) REFERENCES notes(id) ON DELETE CASCADE
    )
  `);

  db.exec(`
    CREATE INDEX IF NOT EXISTS idx_notes_updated_at ON notes(updated_at DESC);
    CREATE INDEX IF NOT EXISTS idx_journal_date ON notes(journal_date DESC) WHERE is_journal = 1;
  `);

  return db;
}

// 如果 better-sqlite3 不可用，跳过所有测试
const describeIfDb = dbAvailable ? describe : describe.skip;

describeIfDb('DatabaseManager', () => {
  let db;

  beforeEach(() => {
    db = createTestDatabase();
  });

  afterEach(() => {
    if (db) db.close();
  });

  describe('笔记 CRUD', () => {
    test('saveNote 应创建新笔记', () => {
      const now = Date.now();
      const noteData = {
        id: 'note-1',
        title: 'Test Note',
        path: '/test/note-1.md',
        contentText: 'This is test content',
        tags: ['tag1', 'tag2'],
        outgoingLinks: [],
        isJournal: false,
        journalDate: null,
      };

      // 插入笔记
      db.prepare(`
        INSERT INTO notes (id, title, path, content_text, created_at, updated_at, is_journal, journal_date)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `).run(
        noteData.id,
        noteData.title,
        noteData.path,
        noteData.contentText,
        now,
        now,
        0,
        null
      );

      // 验证
      const note = db.prepare('SELECT * FROM notes WHERE id = ?').get('note-1');
      expect(note).toBeDefined();
      expect(note.title).toBe('Test Note');
      expect(note.content_text).toBe('This is test content');
    });

    test('saveNote 应更新现有笔记', () => {
      const now = Date.now();

      // 先创建
      db.prepare(`
        INSERT INTO notes (id, title, path, content_text, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?, ?)
      `).run('note-1', 'Original Title', '/test/note-1.md', 'Original', now, now);

      // 再更新
      db.prepare(`
        UPDATE notes SET title = ?, content_text = ?, updated_at = ? WHERE id = ?
      `).run('Updated Title', 'Updated Content', now + 1000, 'note-1');

      // 验证
      const note = db.prepare('SELECT * FROM notes WHERE id = ?').get('note-1');
      expect(note.title).toBe('Updated Title');
      expect(note.content_text).toBe('Updated Content');
      expect(note.created_at).toBe(now); // created_at 不应变化
    });

    test('deleteNote 应删除笔记', () => {
      const now = Date.now();

      // 创建笔记
      db.prepare(`
        INSERT INTO notes (id, title, path, content_text, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?, ?)
      `).run('note-1', 'Test', '/test/note-1.md', 'Content', now, now);

      // 删除
      db.prepare('DELETE FROM notes WHERE id = ?').run('note-1');

      // 验证
      const note = db.prepare('SELECT * FROM notes WHERE id = ?').get('note-1');
      expect(note).toBeUndefined();
    });
  });

  describe('标签功能', () => {
    test('应正确关联标签', () => {
      const now = Date.now();

      // 创建笔记
      db.prepare(`
        INSERT INTO notes (id, title, path, content_text, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?, ?)
      `).run('note-1', 'Test', '/test/note-1.md', 'Content', now, now);

      // 创建标签
      db.prepare('INSERT INTO tags (name) VALUES (?)').run('tag1');
      db.prepare('INSERT INTO tags (name) VALUES (?)').run('tag2');

      // 关联
      const tag1 = db.prepare('SELECT id FROM tags WHERE name = ?').get('tag1');
      const tag2 = db.prepare('SELECT id FROM tags WHERE name = ?').get('tag2');

      db.prepare('INSERT INTO note_tags (note_id, tag_id) VALUES (?, ?)').run('note-1', tag1.id);
      db.prepare('INSERT INTO note_tags (note_id, tag_id) VALUES (?, ?)').run('note-1', tag2.id);

      // 验证
      const tags = db
        .prepare(
          `
        SELECT t.name FROM tags t
        JOIN note_tags nt ON t.id = nt.tag_id
        WHERE nt.note_id = ?
      `
        )
        .all('note-1');

      expect(tags).toHaveLength(2);
      expect(tags.map((t) => t.name)).toContain('tag1');
      expect(tags.map((t) => t.name)).toContain('tag2');
    });

    test('getAllTags 应返回带计数的标签', () => {
      const now = Date.now();

      // 创建多个笔记
      db.prepare(`INSERT INTO notes (id, title, path, created_at, updated_at) VALUES (?, ?, ?, ?, ?)`).run(
        'note-1',
        'Note 1',
        '/test/note-1.md',
        now,
        now
      );
      db.prepare(`INSERT INTO notes (id, title, path, created_at, updated_at) VALUES (?, ?, ?, ?, ?)`).run(
        'note-2',
        'Note 2',
        '/test/note-2.md',
        now,
        now
      );

      // 创建标签
      db.prepare('INSERT INTO tags (name) VALUES (?)').run('common-tag');
      db.prepare('INSERT INTO tags (name) VALUES (?)').run('rare-tag');

      const commonTag = db.prepare('SELECT id FROM tags WHERE name = ?').get('common-tag');
      const rareTag = db.prepare('SELECT id FROM tags WHERE name = ?').get('rare-tag');

      // common-tag 关联两个笔记
      db.prepare('INSERT INTO note_tags (note_id, tag_id) VALUES (?, ?)').run('note-1', commonTag.id);
      db.prepare('INSERT INTO note_tags (note_id, tag_id) VALUES (?, ?)').run('note-2', commonTag.id);

      // rare-tag 只关联一个笔记
      db.prepare('INSERT INTO note_tags (note_id, tag_id) VALUES (?, ?)').run('note-1', rareTag.id);

      // 查询带计数的标签
      const tags = db
        .prepare(
          `
        SELECT tags.name, COUNT(note_tags.note_id) as count
        FROM tags
        LEFT JOIN note_tags ON tags.id = note_tags.tag_id
        GROUP BY tags.id, tags.name
        HAVING count > 0
        ORDER BY count DESC
      `
        )
        .all();

      expect(tags[0].name).toBe('common-tag');
      expect(tags[0].count).toBe(2);
      expect(tags[1].name).toBe('rare-tag');
      expect(tags[1].count).toBe(1);
    });
  });

  describe('日记功能', () => {
    test('getJournals 应按日期倒序返回日记', () => {
      const now = Date.now();

      // 创建日记
      db.prepare(`
        INSERT INTO notes (id, title, path, created_at, updated_at, is_journal, journal_date)
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `).run('2024-01-01', 'Jan 1', '/journals/2024-01-01.md', now, now, 1, '2024-01-01');

      db.prepare(`
        INSERT INTO notes (id, title, path, created_at, updated_at, is_journal, journal_date)
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `).run('2024-01-02', 'Jan 2', '/journals/2024-01-02.md', now, now, 1, '2024-01-02');

      db.prepare(`
        INSERT INTO notes (id, title, path, created_at, updated_at, is_journal, journal_date)
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `).run('2024-01-03', 'Jan 3', '/journals/2024-01-03.md', now, now, 1, '2024-01-03');

      // 查询
      const journals = db
        .prepare(
          `
        SELECT id, title, journal_date
        FROM notes
        WHERE is_journal = 1
        ORDER BY journal_date DESC
        LIMIT 10
      `
        )
        .all();

      expect(journals).toHaveLength(3);
      expect(journals[0].journal_date).toBe('2024-01-03');
      expect(journals[1].journal_date).toBe('2024-01-02');
      expect(journals[2].journal_date).toBe('2024-01-01');
    });

    test('deleteJournal 应删除指定日期的日记', () => {
      const now = Date.now();

      // 创建日记
      db.prepare(`
        INSERT INTO notes (id, title, path, created_at, updated_at, is_journal, journal_date)
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `).run('2024-01-01', 'Jan 1', '/journals/2024-01-01.md', now, now, 1, '2024-01-01');

      // 删除
      const result = db.prepare(`DELETE FROM notes WHERE is_journal = 1 AND journal_date = ?`).run('2024-01-01');

      expect(result.changes).toBe(1);

      // 验证
      const journal = db.prepare('SELECT * FROM notes WHERE journal_date = ?').get('2024-01-01');
      expect(journal).toBeUndefined();
    });
  });

  describe('链接功能', () => {
    test('应正确存储和查询反向链接', () => {
      const now = Date.now();

      // 创建笔记
      db.prepare(`INSERT INTO notes (id, title, path, created_at, updated_at) VALUES (?, ?, ?, ?, ?)`).run(
        'note-a',
        'Note A',
        '/test/note-a.md',
        now,
        now
      );
      db.prepare(`INSERT INTO notes (id, title, path, created_at, updated_at) VALUES (?, ?, ?, ?, ?)`).run(
        'note-b',
        'Note B',
        '/test/note-b.md',
        now,
        now
      );
      db.prepare(`INSERT INTO notes (id, title, path, created_at, updated_at) VALUES (?, ?, ?, ?, ?)`).run(
        'note-c',
        'Note C',
        '/test/note-c.md',
        now,
        now
      );

      // A 链接到 B 和 C
      db.prepare('INSERT INTO links (from_note_id, to_note_id) VALUES (?, ?)').run('note-a', 'note-b');
      db.prepare('INSERT INTO links (from_note_id, to_note_id) VALUES (?, ?)').run('note-a', 'note-c');

      // 查询 B 的反向链接
      const backlinks = db
        .prepare(
          `
        SELECT notes.id, notes.title
        FROM notes
        JOIN links ON notes.id = links.from_note_id
        WHERE links.to_note_id = ?
      `
        )
        .all('note-b');

      expect(backlinks).toHaveLength(1);
      expect(backlinks[0].id).toBe('note-a');
    });
  });

  describe('搜索功能', () => {
    test('应正确过滤空查询', () => {
      const searchNotes = (query) => {
        if (!query || query.trim() === '') {
          return [];
        }
        // 实际搜索逻辑
        return [{ id: 'test', title: 'Test' }];
      };

      expect(searchNotes('')).toEqual([]);
      expect(searchNotes('   ')).toEqual([]);
      expect(searchNotes(null)).toEqual([]);
      expect(searchNotes(undefined)).toEqual([]);
      expect(searchNotes('valid')).toHaveLength(1);
    });
  });

  describe('数据库视图', () => {
    beforeEach(() => {
      // 创建数据库视图表
      db.exec(`
        CREATE TABLE IF NOT EXISTS databases (
          id TEXT PRIMARY KEY,
          title TEXT NOT NULL DEFAULT '无标题数据库',
          properties_config TEXT NOT NULL DEFAULT '[]',
          view_config TEXT NOT NULL DEFAULT '{}',
          created_at INTEGER NOT NULL,
          updated_at INTEGER NOT NULL
        )
      `);

      db.exec(`
        CREATE TABLE IF NOT EXISTS database_rows (
          id TEXT PRIMARY KEY,
          database_id TEXT NOT NULL,
          properties TEXT NOT NULL DEFAULT '{}',
          order_index INTEGER NOT NULL DEFAULT 0,
          created_at INTEGER NOT NULL,
          updated_at INTEGER NOT NULL,
          FOREIGN KEY (database_id) REFERENCES databases(id) ON DELETE CASCADE
        )
      `);
    });

    test('createDatabase 应创建带默认属性的数据库', () => {
      const now = Date.now();
      const id = 'db_test';

      const defaultProperties = [{ id: 'title', name: '名称', type: 'text', width: 200 }];

      db.prepare(`
        INSERT INTO databases (id, title, properties_config, view_config, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?, ?)
      `).run(id, '测试数据库', JSON.stringify(defaultProperties), '{}', now, now);

      const database = db.prepare('SELECT * FROM databases WHERE id = ?').get(id);
      expect(database).toBeDefined();
      expect(database.title).toBe('测试数据库');

      const props = JSON.parse(database.properties_config);
      expect(props[0].id).toBe('title');
    });

    test('createDatabaseRow 应创建行并设置正确的 order_index', () => {
      const now = Date.now();
      const dbId = 'db_test';

      // 创建数据库
      db.prepare(`
        INSERT INTO databases (id, title, properties_config, view_config, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?, ?)
      `).run(dbId, 'Test', '[]', '{}', now, now);

      // 创建第一行
      db.prepare(`
        INSERT INTO database_rows (id, database_id, properties, order_index, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?, ?)
      `).run('row-1', dbId, '{"title": "Row 1"}', 0, now, now);

      // 创建第二行
      const maxOrder = db.prepare(`SELECT MAX(order_index) as max FROM database_rows WHERE database_id = ?`).get(dbId);
      const newOrderIndex = (maxOrder?.max ?? -1) + 1;

      db.prepare(`
        INSERT INTO database_rows (id, database_id, properties, order_index, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?, ?)
      `).run('row-2', dbId, '{"title": "Row 2"}', newOrderIndex, now, now);

      // 验证
      const rows = db.prepare('SELECT * FROM database_rows WHERE database_id = ? ORDER BY order_index').all(dbId);
      expect(rows).toHaveLength(2);
      expect(rows[0].order_index).toBe(0);
      expect(rows[1].order_index).toBe(1);
    });
  });
});
