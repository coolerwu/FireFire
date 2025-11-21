const {init: initSettingFileOperation} = require('./settingFile');
const {init: initNotebookFileOperation} = require('./notebookFile');
const {init: initRootFileOperation} = require('./rootFile');
const {ipcMain} = require("electron");
const indexManager = require('./indexManager');
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
 * 索引操作函数初始化
 */
const initIndexOperation = () => {
    // 获取所有标签
    ipcMain.handle('get-all-tags', () => {
        return indexManager.getAllTags();
    });

    // 根据标签获取笔记
    ipcMain.handle('get-notes-by-tag', (event, tag) => {
        return indexManager.getNotesByTag(tag);
    });

    // 获取反向链接
    ipcMain.handle('get-backlinks', (event, noteId) => {
        return indexManager.getBacklinks(noteId);
    });

    // 搜索笔记
    ipcMain.handle('search-notes', (event, query) => {
        return indexManager.searchNotes(query);
    });

    // 检查笔记是否存在
    ipcMain.handle('note-exists', (event, noteId) => {
        return indexManager.noteExists(noteId);
    });

    // 重建索引
    ipcMain.handle('rebuild-index', () => {
        const { notebookPath, notebookSuffix } = getCurSettingConfig();
        indexManager.rebuildIndex(notebookPath, notebookSuffix);
        return true;
    });
}

exports.init = () => {
    //文件操作函数初始化
    initFileOperation();

    //索引操作函数初始化
    initIndexOperation();
};