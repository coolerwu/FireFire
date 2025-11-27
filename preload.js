window.addEventListener('DOMContentLoaded', () => {
    const replaceText = (selector, text) => {
        const element = document.getElementById(selector)
        if (element) element.innerText = text
    }

    for (const dependency of ['chrome', 'node', 'electron']) {
        replaceText(`${dependency}-version`, process.versions[dependency])
    }
})

const {contextBridge, ipcRenderer} = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
    //read setting file
    readSettingFile: () => ipcRenderer.invoke('readSettingFile'),
    //write setting file
    writeSettingFile: (content) => ipcRenderer.invoke('writeSettingFile', content),
    //read files only in notebook path
    readNotebookFileList: (absPath) => ipcRenderer.invoke('readNotebookFileList', absPath),
    //create file only in notebook path
    createNotebookFile: (absPath) => ipcRenderer.invoke('createNotebookFile', absPath),
    //create dir only in notebook path
    createNotebookDir: (absPath) => ipcRenderer.invoke('createNotebookDir', absPath),
    //read file only in notebook path
    readNotebookFile: (absPath) => ipcRenderer.invoke('readNotebookFile', absPath),
    //write file only in notebook path
    writeNotebookFile: (absPath, content) => ipcRenderer.invoke('writeNotebookFile', absPath, content),
    //rename filename only in notebook path
    renameNotebookFile: (oldPath, newPath) => ipcRenderer.invoke('renameNotebookFile', oldPath, newPath),
    //delete filename only in notebook path
    deleteNotebookFile: (absPath) => ipcRenderer.invoke('deleteNotebookFile', absPath),
    //delete directory only in notebook path
    deleteDirectory: (absPath) => ipcRenderer.invoke('deleteDirectory', absPath),
    //copy picture to attachment path
    copyAttachment: (fromPath, toDirectoryPath) => ipcRenderer.invoke('copyAttachment', fromPath, toDirectoryPath),
    //copy base64 to attachment path
    copyAttachmentByBase64: (base64, toDirectoryPath) => ipcRenderer.invoke('copyAttachmentByBase64', base64, toDirectoryPath),
    //auto-update functions
    checkForUpdates: () => ipcRenderer.invoke('check-for-updates'),
    downloadUpdate: () => ipcRenderer.invoke('download-update'),
    quitAndInstall: () => ipcRenderer.invoke('quit-and-install'),
    getAppVersion: () => ipcRenderer.invoke('get-app-version'),
    onUpdateStatus: (callback) => {
        const subscription = (event, status) => callback(status);
        ipcRenderer.on('update-status', subscription);
        return () => ipcRenderer.removeListener('update-status', subscription);
    },
    //database functions (tags, links, search)
    getAllTags: () => ipcRenderer.invoke('get-all-tags'),
    getNotesByTag: (tag) => ipcRenderer.invoke('get-notes-by-tag', tag),
    getBacklinks: (noteId) => ipcRenderer.invoke('get-backlinks', noteId),
    searchNotes: (query) => ipcRenderer.invoke('search-notes', query),
    noteExists: (noteId) => ipcRenderer.invoke('note-exists', noteId),
    getAllNotes: () => ipcRenderer.invoke('get-all-notes'),
    getNoteTags: (noteId) => ipcRenderer.invoke('get-note-tags', noteId),
    //journal functions
    getTodayJournal: () => ipcRenderer.invoke('get-today-journal'),
    createJournal: (date) => ipcRenderer.invoke('create-journal', date),
    getJournals: (limit, offset) => ipcRenderer.invoke('get-journals', limit, offset),
    journalExists: (date) => ipcRenderer.invoke('journal-exists', date),
    getJournalCount: () => ipcRenderer.invoke('get-journal-count'),
    //timeline functions
    getRecentNotes: (limit, offset) => ipcRenderer.invoke('get-recent-notes', limit, offset),
    //workspace functions
    getCurrentWorkspace: () => ipcRenderer.invoke('get-current-workspace'),
    changeWorkspace: () => ipcRenderer.invoke('change-workspace'),
    openWorkspaceFolder: () => ipcRenderer.invoke('open-workspace-folder'),
    restartApp: () => ipcRenderer.invoke('restart-app'),
    isFirstTimeSetup: () => ipcRenderer.invoke('is-first-time-setup'),
    completeFirstTimeSetup: () => ipcRenderer.invoke('complete-first-time-setup'),
    factoryReset: () => ipcRenderer.invoke('factory-reset'),
    //webdav functions
    webdavTest: (config) => ipcRenderer.invoke('webdav-test', config),
    webdavSync: (options) => ipcRenderer.invoke('webdav-sync', options),
    //database maintenance functions
    checkDbIntegrity: () => ipcRenderer.invoke('check-db-integrity'),
    repairDatabase: () => ipcRenderer.invoke('repair-database'),
    rebuildFtsIndex: () => ipcRenderer.invoke('rebuild-fts-index'),
    //import/export functions
    importMarkdown: (options) => ipcRenderer.invoke('import-markdown', options),
    importFolder: () => ipcRenderer.invoke('import-folder'),
    exportMarkdown: (noteId) => ipcRenderer.invoke('export-markdown', noteId),
    exportHtml: (noteId) => ipcRenderer.invoke('export-html', noteId),
    exportAll: (format) => ipcRenderer.invoke('export-all', format),
    //knowledge graph functions
    getGraphData: () => ipcRenderer.invoke('get-graph-data'),
    //version history functions
    saveVersion: (noteId, content, forceSave) => ipcRenderer.invoke('save-version', noteId, content, forceSave),
    getVersions: (noteId, limit, offset) => ipcRenderer.invoke('get-versions', noteId, limit, offset),
    getVersionCount: (noteId) => ipcRenderer.invoke('get-version-count', noteId),
    getVersion: (versionId) => ipcRenderer.invoke('get-version', versionId),
    deleteVersion: (versionId) => ipcRenderer.invoke('delete-version', versionId),
    deleteAllVersions: (noteId) => ipcRenderer.invoke('delete-all-versions', noteId),
    compareVersions: (versionId1, versionId2) => ipcRenderer.invoke('compare-versions', versionId1, versionId2),
    getVersionStats: () => ipcRenderer.invoke('get-version-stats'),
    //template functions
    getAllTemplates: () => ipcRenderer.invoke('get-all-templates'),
    getTemplate: (templateId) => ipcRenderer.invoke('get-template', templateId),
    createTemplate: (name, description, content, icon) => ipcRenderer.invoke('create-template', name, description, content, icon),
    updateTemplate: (templateId, updates) => ipcRenderer.invoke('update-template', templateId, updates),
    deleteTemplate: (templateId) => ipcRenderer.invoke('delete-template', templateId),
    applyTemplate: (templateId, variables) => ipcRenderer.invoke('apply-template', templateId, variables),
    exportTemplate: (templateId) => ipcRenderer.invoke('export-template', templateId),
    importTemplate: (jsonString) => ipcRenderer.invoke('import-template', jsonString),
    //database view functions
    createDatabaseView: (title, properties) => ipcRenderer.invoke('create-database-view', title, properties),
    getDatabaseView: (id) => ipcRenderer.invoke('get-database-view', id),
    getAllDatabaseViews: () => ipcRenderer.invoke('get-all-database-views'),
    updateDatabaseView: (id, updates) => ipcRenderer.invoke('update-database-view', id, updates),
    deleteDatabaseView: (id) => ipcRenderer.invoke('delete-database-view', id),
    createDatabaseRow: (databaseId, properties) => ipcRenderer.invoke('create-database-row', databaseId, properties),
    getDatabaseRow: (rowId) => ipcRenderer.invoke('get-database-row', rowId),
    getDatabaseRows: (databaseId, options) => ipcRenderer.invoke('get-database-rows', databaseId, options),
    updateDatabaseRow: (rowId, updates) => ipcRenderer.invoke('update-database-row', rowId, updates),
    deleteDatabaseRow: (rowId) => ipcRenderer.invoke('delete-database-row', rowId),
    updateRowOrders: (databaseId, rowOrders) => ipcRenderer.invoke('update-row-orders', databaseId, rowOrders),
})
