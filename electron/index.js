const {init: initSettingFileOperation} = require('./settingFile');
const {init: initNotebookFileOperation} = require('./notebookFile');
const {init: initRootFileOperation} = require('./rootFile');
const {init: initWebDAVSync} = require('./webdavSync');
const {init: initImportExport} = require('./importExport');
const {ipcMain} = require("electron");
const dbManager = require('./dbManager');
const journalManager = require('./journalManager');
const versionManager = require('./versionManager');
const templateManager = require('./templateManager');
const proxyManager = require('./proxyManager');
const {getCurSettingConfig} = require('./settingFile');

/**
 * 文件操作函数初始化
 */
const initFileOperation = () => {
    initRootFileOperation();
    initSettingFileOperation();
    initNotebookFileOperation();
}

/**
 * 数据库操作函数初始化
 */
const initDatabaseOperation = () => {
    // 获取所有标签
    ipcMain.handle('get-all-tags', () => {
        return dbManager.getAllTags();
    });

    // 根据标签获取笔记
    ipcMain.handle('get-notes-by-tag', (event, tag) => {
        return dbManager.getNotesByTag(tag);
    });

    // 获取反向链接
    ipcMain.handle('get-backlinks', (event, noteId) => {
        return dbManager.getBacklinks(noteId);
    });

    // 搜索笔记（全文搜索）
    ipcMain.handle('search-notes', (event, query) => {
        return dbManager.searchNotes(query);
    });

    // 检查笔记是否存在
    ipcMain.handle('note-exists', (event, noteId) => {
        return dbManager.noteExists(noteId);
    });

    // 获取所有笔记列表
    ipcMain.handle('get-all-notes', () => {
        return dbManager.getAllNotes();
    });

    // 获取笔记的标签
    ipcMain.handle('get-note-tags', (event, noteId) => {
        return dbManager.getNoteTags(noteId);
    });

    // 检查数据库完整性
    ipcMain.handle('check-db-integrity', () => {
        return dbManager.checkIntegrity();
    });

    // 修复数据库
    ipcMain.handle('repair-database', () => {
        return dbManager.repair();
    });

    // 重建 FTS 索引
    ipcMain.handle('rebuild-fts-index', () => {
        return dbManager.rebuildFtsIndex();
    });

    // 获取知识图谱数据
    ipcMain.handle('get-graph-data', () => {
        return dbManager.getGraphData();
    });
}

/**
 * 版本历史操作函数初始化
 */
const initVersionOperation = () => {
    // 保存版本
    ipcMain.handle('save-version', (event, noteId, content, forceSave) => {
        return versionManager.saveVersion(noteId, content, forceSave);
    });

    // 获取版本列表
    ipcMain.handle('get-versions', (event, noteId, limit, offset) => {
        return versionManager.getVersions(noteId, limit, offset);
    });

    // 获取版本总数
    ipcMain.handle('get-version-count', (event, noteId) => {
        return versionManager.getVersionCount(noteId);
    });

    // 获取特定版本
    ipcMain.handle('get-version', (event, versionId) => {
        return versionManager.getVersion(versionId);
    });

    // 删除版本
    ipcMain.handle('delete-version', (event, versionId) => {
        versionManager.deleteVersion(versionId);
        return true;
    });

    // 删除笔记所有版本
    ipcMain.handle('delete-all-versions', (event, noteId) => {
        versionManager.deleteAllVersions(noteId);
        return true;
    });

    // 比较版本
    ipcMain.handle('compare-versions', (event, versionId1, versionId2) => {
        return versionManager.compareVersions(versionId1, versionId2);
    });

    // 获取版本统计
    ipcMain.handle('get-version-stats', () => {
        return versionManager.getStats();
    });
}

/**
 * 模板操作函数初始化
 */
const initTemplateOperation = () => {
    // 获取所有模板
    ipcMain.handle('get-all-templates', () => {
        return templateManager.getAllTemplates();
    });

    // 获取单个模板
    ipcMain.handle('get-template', (event, templateId) => {
        return templateManager.getTemplate(templateId);
    });

    // 创建用户模板
    ipcMain.handle('create-template', (event, name, description, content, icon) => {
        return templateManager.createTemplate(name, description, content, icon);
    });

    // 更新用户模板
    ipcMain.handle('update-template', (event, templateId, updates) => {
        return templateManager.updateTemplate(templateId, updates);
    });

    // 删除用户模板
    ipcMain.handle('delete-template', (event, templateId) => {
        return templateManager.deleteTemplate(templateId);
    });

    // 应用模板（替换变量）
    ipcMain.handle('apply-template', (event, templateId, variables) => {
        return templateManager.applyTemplate(templateId, variables);
    });

    // 导出模板
    ipcMain.handle('export-template', (event, templateId) => {
        return templateManager.exportTemplate(templateId);
    });

    // 导入模板
    ipcMain.handle('import-template', (event, jsonString) => {
        return templateManager.importTemplate(jsonString);
    });
}

/**
 * 数据库视图操作函数初始化
 */
const initDatabaseViewOperation = () => {
    // 创建数据库
    ipcMain.handle('create-database-view', (event, title, properties) => {
        return dbManager.createDatabase(title, properties);
    });

    // 获取数据库
    ipcMain.handle('get-database-view', (event, id) => {
        return dbManager.getDatabase(id);
    });

    // 获取所有数据库列表
    ipcMain.handle('get-all-database-views', () => {
        return dbManager.getAllDatabases();
    });

    // 更新数据库
    ipcMain.handle('update-database-view', (event, id, updates) => {
        return dbManager.updateDatabase(id, updates);
    });

    // 删除数据库
    ipcMain.handle('delete-database-view', (event, id) => {
        return dbManager.deleteDatabase(id);
    });

    // 创建数据库行
    ipcMain.handle('create-database-row', (event, databaseId, properties) => {
        return dbManager.createDatabaseRow(databaseId, properties);
    });

    // 获取数据库行
    ipcMain.handle('get-database-row', (event, rowId) => {
        return dbManager.getDatabaseRow(rowId);
    });

    // 获取数据库所有行
    ipcMain.handle('get-database-rows', (event, databaseId, options) => {
        return dbManager.getDatabaseRows(databaseId, options);
    });

    // 更新数据库行
    ipcMain.handle('update-database-row', (event, rowId, updates) => {
        return dbManager.updateDatabaseRow(rowId, updates);
    });

    // 删除数据库行
    ipcMain.handle('delete-database-row', (event, rowId) => {
        return dbManager.deleteDatabaseRow(rowId);
    });

    // 批量更新行顺序
    ipcMain.handle('update-row-orders', (event, databaseId, rowOrders) => {
        dbManager.updateRowOrders(databaseId, rowOrders);
        return true;
    });
}

/**
 * 日记操作函数初始化
 */
const initJournalOperation = () => {
    // 获取今日日记路径
    ipcMain.handle('get-today-journal', () => {
        return journalManager.getTodayJournalPath();
    });

    // 创建日记
    ipcMain.handle('create-journal', async (event, date) => {
        const journalDate = date ? new Date(date) : new Date();
        return await journalManager.createJournal(journalDate);
    });

    // 获取日记列表
    ipcMain.handle('get-journals', (event, limit, offset) => {
        const journals = journalManager.getJournals(limit, offset);
        console.log(`[IPC] get-journals: limit=${limit}, offset=${offset}, count=${journals.length}`, JSON.stringify(journals, null, 2));
        return journals;
    });

    // 检查日记是否存在
    ipcMain.handle('journal-exists', (event, date) => {
        return journalManager.journalExists(date);
    });

    // 获取日记总数
    ipcMain.handle('get-journal-count', () => {
        return journalManager.getJournalCount();
    });

    // 获取最近更新的笔记（时间线视图）
    ipcMain.handle('get-recent-notes', (event, limit, offset) => {
        return dbManager.getRecentNotes(limit, offset);
    });
}

exports.init = () => {
    // 首先初始化数据库（必须在 workspaceManager.checkWorkspace() 之后调用）
    dbManager.init();

    //文件操作函数初始化
    initFileOperation();

    //数据库操作函数初始化
    initDatabaseOperation();

    //日记操作函数初始化
    initJournalOperation();

    //初始化日记管理器
    journalManager.init();

    //初始化版本管理器（需要数据库实例）
    versionManager.init(dbManager.db);

    //版本历史操作函数初始化
    initVersionOperation();

    //初始化模板管理器
    templateManager.init();

    //模板操作函数初始化
    initTemplateOperation();

    //数据库视图操作函数初始化
    initDatabaseViewOperation();

    //初始化 WebDAV 同步
    initWebDAVSync();

    //初始化导入导出
    initImportExport();

    //初始化代理管理器
    proxyManager.init();

    //从设置加载代理配置
    const settings = getCurSettingConfig();
    if (settings?.proxy) {
        proxyManager.loadFromSettings(settings);
    }
};