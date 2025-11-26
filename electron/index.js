const {init: initSettingFileOperation} = require('./settingFile');
const {init: initNotebookFileOperation} = require('./notebookFile');
const {init: initRootFileOperation} = require('./rootFile');
const {init: initWebDAVSync} = require('./webdavSync');
const {init: initImportExport} = require('./importExport');
const {ipcMain} = require("electron");
const dbManager = require('./dbManager');
const journalManager = require('./journalManager');
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

    //初始化 WebDAV 同步
    initWebDAVSync();

    //初始化导入导出
    initImportExport();
};