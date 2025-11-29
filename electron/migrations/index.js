/**
 * 数据库迁移入口
 *
 * 注册所有迁移并提供统一的迁移接口
 */

const MigrationRunner = require('./migrationRunner');

/**
 * 迁移定义
 * 每个迁移包含：
 * - version: 版本号（递增整数）
 * - name: 迁移名称
 * - up: 升级函数
 * - down: 回滚函数（可选）
 */
const migrations = [
  // v1: 初始化迁移表（由 MigrationRunner 自动创建）
  // 这里从 v1 开始定义业务迁移

  // 示例迁移（暂时注释，需要时启用）
  // {
  //   version: 1,
  //   name: 'add_note_summary_column',
  //   up: (db) => {
  //     db.exec(`
  //       ALTER TABLE notes ADD COLUMN summary TEXT
  //     `);
  //   },
  //   down: (db) => {
  //     // SQLite 不支持 DROP COLUMN，需要重建表
  //     db.exec(`
  //       CREATE TABLE notes_new AS SELECT id, title, path, content_text, created_at, updated_at, is_journal, journal_date FROM notes;
  //       DROP TABLE notes;
  //       ALTER TABLE notes_new RENAME TO notes;
  //     `);
  //   },
  // },
];

/**
 * 创建并初始化迁移运行器
 * @param {Database} db - better-sqlite3 数据库实例
 * @returns {MigrationRunner}
 */
function createMigrationRunner(db) {
  const runner = new MigrationRunner(db);
  runner.init();

  // 注册所有迁移
  for (const migration of migrations) {
    runner.register(migration);
  }

  return runner;
}

/**
 * 运行数据库迁移
 * @param {Database} db - better-sqlite3 数据库实例
 * @returns {{ success: boolean, applied: number, error?: string }}
 */
function runMigrations(db) {
  const runner = createMigrationRunner(db);
  return runner.runPending();
}

/**
 * 获取迁移状态
 * @param {Database} db - better-sqlite3 数据库实例
 * @returns {object}
 */
function getMigrationStatus(db) {
  const runner = createMigrationRunner(db);
  return runner.getStatus();
}

module.exports = {
  createMigrationRunner,
  runMigrations,
  getMigrationStatus,
  migrations,
};
