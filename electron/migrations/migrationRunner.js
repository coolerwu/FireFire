/**
 * 数据库迁移运行器
 *
 * 管理数据库 schema 版本和自动迁移
 */

const fs = require('fs');
const path = require('path');

/**
 * 迁移运行器
 */
class MigrationRunner {
  constructor(db) {
    this.db = db;
    this.migrations = [];
  }

  /**
   * 初始化迁移系统
   * 创建迁移版本表
   */
  init() {
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS _migrations (
        version INTEGER PRIMARY KEY,
        name TEXT NOT NULL,
        applied_at INTEGER NOT NULL
      )
    `);
    console.log('[MigrationRunner] 迁移系统初始化完成');
  }

  /**
   * 注册迁移
   * @param {object} migration - { version, name, up, down }
   */
  register(migration) {
    if (!migration.version || !migration.name || !migration.up) {
      throw new Error('迁移必须包含 version、name 和 up 函数');
    }
    this.migrations.push(migration);
    // 按版本排序
    this.migrations.sort((a, b) => a.version - b.version);
  }

  /**
   * 获取当前数据库版本
   * @returns {number}
   */
  getCurrentVersion() {
    try {
      const row = this.db.prepare('SELECT MAX(version) as version FROM _migrations').get();
      return row?.version || 0;
    } catch {
      return 0;
    }
  }

  /**
   * 获取已应用的迁移
   * @returns {Array}
   */
  getAppliedMigrations() {
    try {
      return this.db.prepare('SELECT * FROM _migrations ORDER BY version').all();
    } catch {
      return [];
    }
  }

  /**
   * 获取待应用的迁移
   * @returns {Array}
   */
  getPendingMigrations() {
    const currentVersion = this.getCurrentVersion();
    return this.migrations.filter(m => m.version > currentVersion);
  }

  /**
   * 运行所有待应用的迁移
   * @returns {{ success: boolean, applied: number, error?: string }}
   */
  runPending() {
    const pending = this.getPendingMigrations();

    if (pending.length === 0) {
      console.log('[MigrationRunner] 没有待应用的迁移');
      return { success: true, applied: 0 };
    }

    console.log(`[MigrationRunner] 发现 ${pending.length} 个待应用迁移`);

    let applied = 0;

    for (const migration of pending) {
      try {
        console.log(`[MigrationRunner] 正在应用迁移 v${migration.version}: ${migration.name}`);

        // 在事务中运行迁移
        const runMigration = this.db.transaction(() => {
          migration.up(this.db);

          // 记录迁移
          this.db.prepare(`
            INSERT INTO _migrations (version, name, applied_at)
            VALUES (?, ?, ?)
          `).run(migration.version, migration.name, Date.now());
        });

        runMigration();
        applied++;
        console.log(`[MigrationRunner] 迁移 v${migration.version} 应用成功`);
      } catch (error) {
        console.error(`[MigrationRunner] 迁移 v${migration.version} 失败:`, error);
        return {
          success: false,
          applied,
          error: `迁移 v${migration.version} 失败: ${error.message}`,
        };
      }
    }

    console.log(`[MigrationRunner] 成功应用 ${applied} 个迁移`);
    return { success: true, applied };
  }

  /**
   * 回滚最近的迁移
   * @returns {{ success: boolean, error?: string }}
   */
  rollbackLast() {
    const currentVersion = this.getCurrentVersion();

    if (currentVersion === 0) {
      console.log('[MigrationRunner] 没有可回滚的迁移');
      return { success: true };
    }

    const migration = this.migrations.find(m => m.version === currentVersion);

    if (!migration) {
      return { success: false, error: `找不到版本 ${currentVersion} 的迁移` };
    }

    if (!migration.down) {
      return { success: false, error: `迁移 v${currentVersion} 不支持回滚` };
    }

    try {
      console.log(`[MigrationRunner] 正在回滚迁移 v${migration.version}: ${migration.name}`);

      const runRollback = this.db.transaction(() => {
        migration.down(this.db);
        this.db.prepare('DELETE FROM _migrations WHERE version = ?').run(migration.version);
      });

      runRollback();
      console.log(`[MigrationRunner] 迁移 v${migration.version} 回滚成功`);
      return { success: true };
    } catch (error) {
      console.error(`[MigrationRunner] 回滚失败:`, error);
      return { success: false, error: error.message };
    }
  }

  /**
   * 获取迁移状态
   * @returns {object}
   */
  getStatus() {
    return {
      currentVersion: this.getCurrentVersion(),
      appliedMigrations: this.getAppliedMigrations(),
      pendingMigrations: this.getPendingMigrations().map(m => ({
        version: m.version,
        name: m.name,
      })),
      totalMigrations: this.migrations.length,
    };
  }
}

module.exports = MigrationRunner;
