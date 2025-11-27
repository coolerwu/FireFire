/**
 * Electron API 兼容层
 * 在浏览器环境中提供 mock 数据，在 Electron 环境中使用真实 API
 */

// 检查是否在 Electron 环境中
const isElectron = window.electronAPI !== undefined;

// Mock 数据
const mockSetting = {
    notebookPath: '/mock/notebook',
    attachmentPath: '/mock/attachment',
    notebookSuffix: '.cwjson',
    themeSource: 'light',
    autoSave: 10,
};

const mockFileList = [
    {
        filename: '示例文档.cwjson',
        isDirectory: false,
        id: '示例文档',
        updateTime: Date.now(),
        notebookPath: '/mock/notebook/示例文档.cwjson',
        attachmentPath: '/mock/attachment/示例文档',
    }
];

// Mock API 实现
const mockAPI = {
    readSettingFile: async () => {
        console.warn('[Mock Mode] readSettingFile called');
        return mockSetting;
    },
    writeSettingFile: async (content) => {
        console.warn('[Mock Mode] writeSettingFile called', content);
        return true;
    },
    readNotebookFileList: async (absPath) => {
        console.warn('[Mock Mode] readNotebookFileList called', absPath);
        return mockFileList;
    },
    createNotebookFile: async (absPath) => {
        console.warn('[Mock Mode] createNotebookFile called', absPath);
        return true;
    },
    createNotebookDir: async (absPath) => {
        console.warn('[Mock Mode] createNotebookDir called', absPath);
        return true;
    },
    readNotebookFile: async (absPath) => {
        console.warn('[Mock Mode] readNotebookFile called', absPath);
        return '';
    },
    writeNotebookFile: async (absPath, content) => {
        console.warn('[Mock Mode] writeNotebookFile called', absPath);
        return true;
    },
    renameNotebookFile: async (oldPath, newPath) => {
        console.warn('[Mock Mode] renameNotebookFile called', oldPath, newPath);
        return true;
    },
    deleteNotebookFile: async (absPath) => {
        console.warn('[Mock Mode] deleteNotebookFile called', absPath);
        return true;
    },
    deleteDirectory: async (absPath) => {
        console.warn('[Mock Mode] deleteDirectory called', absPath);
        return true;
    },
    copyAttachment: async (fromPath, toDirectoryPath) => {
        console.warn('[Mock Mode] copyAttachment called', fromPath, toDirectoryPath);
        return '/mock/attachment/image.png';
    },
    copyAttachmentByBase64: async (base64, toDirectoryPath) => {
        console.warn('[Mock Mode] copyAttachmentByBase64 called', toDirectoryPath);
        return '/mock/attachment/image.png';
    },
    checkForUpdates: async () => {
        console.warn('[Mock Mode] checkForUpdates called - not available in browser');
    },
    downloadUpdate: async () => {
        console.warn('[Mock Mode] downloadUpdate called - not available in browser');
    },
    quitAndInstall: async () => {
        console.warn('[Mock Mode] quitAndInstall called - not available in browser');
    },
    getAppVersion: async () => {
        console.warn('[Mock Mode] getAppVersion called');
        return '0.3.4-browser';
    },
    onUpdateStatus: (callback) => {
        console.warn('[Mock Mode] onUpdateStatus called - not available in browser');
        return () => {}; // Return empty cleanup function
    },
    getAllTags: async () => {
        console.warn('[Mock Mode] getAllTags called');
        return [
            { name: '工作', count: 5 },
            { name: '学习', count: 3 },
            { name: '生活', count: 2 },
        ];
    },
    getNotesByTag: async (tag) => {
        console.warn('[Mock Mode] getNotesByTag called', tag);
        return [
            {
                title: '示例笔记',
                path: '/mock/notebook/示例笔记.cwjson',
                tags: [tag],
                updatedAt: new Date().toISOString(),
            }
        ];
    },
    getBacklinks: async (noteId) => {
        console.warn('[Mock Mode] getBacklinks called', noteId);
        return [];
    },
    searchNotes: async (query) => {
        console.warn('[Mock Mode] searchNotes called', query);
        return [
            {
                id: 'demo-note',
                title: '示例搜索结果',
                path: '/mock/notebook/示例.cwjson',
                tags: ['工作'],
                score: 10,
            }
        ];
    },
    noteExists: async (noteId) => {
        console.warn('[Mock Mode] noteExists called', noteId);
        return false;
    },
    getAllNotes: async () => {
        console.warn('[Mock Mode] getAllNotes called');
        return [
            {
                id: 'demo-note-1',
                title: '示例笔记1',
                path: '/mock/notebook/示例1.cwjson',
                updatedAt: new Date().toISOString(),
            },
            {
                id: 'demo-note-2',
                title: '示例笔记2',
                path: '/mock/notebook/示例2.cwjson',
                updatedAt: new Date().toISOString(),
            }
        ];
    },
    getNoteTags: async (noteId) => {
        console.warn('[Mock Mode] getNoteTags called', noteId);
        return ['工作', '学习'];
    },
    getTodayJournal: async () => {
        console.warn('[Mock Mode] getTodayJournal called');
        const today = new Date().toISOString().split('T')[0];
        return `journals/${today}`;
    },
    createJournal: async (date) => {
        console.warn('[Mock Mode] createJournal called', date);
        return `journals/${date || new Date().toISOString().split('T')[0]}`;
    },
    getJournals: async (limit, offset) => {
        console.warn('[Mock Mode] getJournals called', limit, offset);
        return [
            {
                id: '2025-11-21',
                title: '2025年11月21日 星期四',
                path: '/mock/notebook/journals/2025-11-21.cwjson',
                journalDate: '2025-11-21',
                updatedAt: new Date().toISOString(),
            },
            {
                id: '2025-11-20',
                title: '2025年11月20日 星期三',
                path: '/mock/notebook/journals/2025-11-20.cwjson',
                journalDate: '2025-11-20',
                updatedAt: new Date().toISOString(),
            }
        ];
    },
    journalExists: async (date) => {
        console.warn('[Mock Mode] journalExists called', date);
        return false;
    },
    getJournalCount: async () => {
        console.warn('[Mock Mode] getJournalCount called');
        return 10;
    },
    deleteJournal: async (dateStr) => {
        console.warn('[Mock Mode] deleteJournal called', dateStr);
        return true;
    },
    getRecentNotes: async (limit, offset) => {
        console.warn('[Mock Mode] getRecentNotes called', limit, offset);
        return [
            {
                id: 'mock-note-1',
                title: '示例文章 1',
                path: '/mock/notebook/example1.cwjson',
                tags: ['tag1', 'tag2'],
                updatedAt: new Date().toISOString(),
            },
            {
                id: 'mock-note-2',
                title: '示例文章 2',
                path: '/mock/notebook/example2.cwjson',
                tags: ['tag3'],
                updatedAt: new Date(Date.now() - 86400000).toISOString(),
            }
        ];
    },
    getCurrentWorkspace: async () => {
        console.warn('[Mock Mode] getCurrentWorkspace called');
        return '/mock/workspace';
    },
    changeWorkspace: async () => {
        console.warn('[Mock Mode] changeWorkspace called - not available in browser');
        return { success: false, error: '浏览器模式不支持更改工作空间' };
    },
    openWorkspaceFolder: async () => {
        console.warn('[Mock Mode] openWorkspaceFolder called - not available in browser');
        return { success: false, error: '浏览器模式不支持打开文件夹' };
    },
    restartApp: async () => {
        console.warn('[Mock Mode] restartApp called - not available in browser');
    },
    isFirstTimeSetup: async () => {
        console.warn('[Mock Mode] isFirstTimeSetup called');
        // 在浏览器模式下返回 false，直接进入主界面
        return false;
    },
    completeFirstTimeSetup: async () => {
        console.warn('[Mock Mode] completeFirstTimeSetup called');
        return { success: true };
    },
    factoryReset: async () => {
        console.warn('[Mock Mode] factoryReset called - not available in browser');
        return { success: false, error: '浏览器模式不支持恢复出厂设置' };
    },
    webdavTest: async (config) => {
        console.warn('[Mock Mode] webdavTest called - limited in browser due to CORS');
        return { success: false, error: '浏览器模式下无法直接测试 WebDAV' };
    },
    webdavSync: async (options) => {
        console.warn('[Mock Mode] webdavSync called - not available in browser');
        return { success: false, error: '浏览器模式不支持 WebDAV 同步' };
    },
    checkDbIntegrity: async () => {
        console.warn('[Mock Mode] checkDbIntegrity called');
        return { ok: true };
    },
    repairDatabase: async () => {
        console.warn('[Mock Mode] repairDatabase called - not available in browser');
        return { ok: false, message: '浏览器模式不支持数据库修复' };
    },
    rebuildFtsIndex: async () => {
        console.warn('[Mock Mode] rebuildFtsIndex called - not available in browser');
        return { ok: false, error: '浏览器模式不支持重建索引' };
    },
    importMarkdown: async (options) => {
        console.warn('[Mock Mode] importMarkdown called - not available in browser');
        return { success: false, error: '浏览器模式不支持导入' };
    },
    importFolder: async () => {
        console.warn('[Mock Mode] importFolder called - not available in browser');
        return { success: false, error: '浏览器模式不支持导入' };
    },
    exportMarkdown: async (noteId) => {
        console.warn('[Mock Mode] exportMarkdown called - not available in browser');
        return { success: false, error: '浏览器模式不支持导出' };
    },
    exportHtml: async (noteId) => {
        console.warn('[Mock Mode] exportHtml called - not available in browser');
        return { success: false, error: '浏览器模式不支持导出' };
    },
    exportAll: async (format) => {
        console.warn('[Mock Mode] exportAll called - not available in browser');
        return { success: false, error: '浏览器模式不支持导出' };
    },
    getGraphData: async () => {
        console.warn('[Mock Mode] getGraphData called');
        return {
            nodes: [
                { id: 'note-1', name: '示例笔记1', type: 'note', tags: ['工作'], val: 3 },
                { id: 'note-2', name: '示例笔记2', type: 'note', tags: ['学习'], val: 2 },
                { id: 'note-3', name: '示例笔记3', type: 'note', tags: [], val: 1 },
            ],
            links: [
                { source: 'note-1', target: 'note-2' },
                { source: 'note-2', target: 'note-3' },
            ]
        };
    },
    // 版本历史 API
    saveVersion: async (noteId, content, forceSave) => {
        console.warn('[Mock Mode] saveVersion called', noteId);
        return Date.now();
    },
    getVersions: async (noteId, limit, offset) => {
        console.warn('[Mock Mode] getVersions called', noteId);
        return [
            { id: 1, noteId, contentLength: 100, summary: '100 字符: 示例内容...', createdAt: new Date().toISOString() },
            { id: 2, noteId, contentLength: 200, summary: '200 字符: 更多内容...', createdAt: new Date(Date.now() - 300000).toISOString() },
        ];
    },
    getVersionCount: async (noteId) => {
        console.warn('[Mock Mode] getVersionCount called', noteId);
        return 2;
    },
    getVersion: async (versionId) => {
        console.warn('[Mock Mode] getVersion called', versionId);
        return {
            id: versionId,
            noteId: 'mock-note',
            content: '{"type":"doc","content":[]}',
            contentLength: 100,
            summary: '100 字符',
            createdAt: new Date().toISOString(),
        };
    },
    deleteVersion: async (versionId) => {
        console.warn('[Mock Mode] deleteVersion called', versionId);
        return true;
    },
    deleteAllVersions: async (noteId) => {
        console.warn('[Mock Mode] deleteAllVersions called', noteId);
        return true;
    },
    compareVersions: async (versionId1, versionId2) => {
        console.warn('[Mock Mode] compareVersions called', versionId1, versionId2);
        return { version1: { id: versionId1 }, version2: { id: versionId2 }, lengthDiff: 50 };
    },
    getVersionStats: async () => {
        console.warn('[Mock Mode] getVersionStats called');
        return { totalVersions: 10, notesWithVersions: 5, totalSize: 10240, totalSizeMB: '0.01' };
    },
    // 模板 API
    getAllTemplates: async () => {
        console.warn('[Mock Mode] getAllTemplates called');
        return [
            { id: 'builtin-meeting', name: '会议记录', description: '记录会议要点', category: 'builtin', icon: '📋', isBuiltin: true },
            { id: 'builtin-reading', name: '读书笔记', description: '记录书籍要点', category: 'builtin', icon: '📚', isBuiltin: true },
            { id: 'builtin-blank', name: '空白笔记', description: '从空白开始', category: 'builtin', icon: '📄', isBuiltin: true },
        ];
    },
    getTemplate: async (templateId) => {
        console.warn('[Mock Mode] getTemplate called', templateId);
        return { id: templateId, name: '模板', content: { type: 'doc', content: [] } };
    },
    createTemplate: async (name, description, content, icon) => {
        console.warn('[Mock Mode] createTemplate called', name);
        return { id: `user-${Date.now()}`, name, description, content, icon, category: 'user' };
    },
    updateTemplate: async (templateId, updates) => {
        console.warn('[Mock Mode] updateTemplate called', templateId);
        return { id: templateId, ...updates };
    },
    deleteTemplate: async (templateId) => {
        console.warn('[Mock Mode] deleteTemplate called', templateId);
        return true;
    },
    applyTemplate: async (templateId, variables) => {
        console.warn('[Mock Mode] applyTemplate called', templateId, variables);
        return { type: 'doc', content: [{ type: 'heading', attrs: { level: 1 }, content: [{ type: 'text', text: '新笔记' }] }] };
    },
    exportTemplate: async (templateId) => {
        console.warn('[Mock Mode] exportTemplate called', templateId);
        return '{}';
    },
    importTemplate: async (jsonString) => {
        console.warn('[Mock Mode] importTemplate called');
        return { id: `imported-${Date.now()}`, name: '导入的模板' };
    },
    // 数据库视图 API
    createDatabaseView: async (title, properties) => {
        console.warn('[Mock Mode] createDatabaseView called', title);
        const id = `db_${Date.now()}`;
        return {
            id,
            title: title || '无标题数据库',
            propertiesConfig: [{ id: 'title', name: '名称', type: 'text', width: 200 }],
            viewConfig: { currentView: 'table', views: {} },
            createdAt: Date.now(),
            updatedAt: Date.now(),
        };
    },
    getDatabaseView: async (id) => {
        console.warn('[Mock Mode] getDatabaseView called', id);
        return {
            id,
            title: '示例数据库',
            propertiesConfig: [
                { id: 'title', name: '名称', type: 'text', width: 200 },
                { id: 'status', name: '状态', type: 'select', width: 120, options: ['待办', '进行中', '已完成'] },
            ],
            viewConfig: { currentView: 'table', views: {} },
            createdAt: Date.now(),
            updatedAt: Date.now(),
        };
    },
    getAllDatabaseViews: async () => {
        console.warn('[Mock Mode] getAllDatabaseViews called');
        return [
            { id: 'db_1', title: '任务列表', createdAt: Date.now(), updatedAt: Date.now() },
            { id: 'db_2', title: '阅读清单', createdAt: Date.now(), updatedAt: Date.now() },
        ];
    },
    updateDatabaseView: async (id, updates) => {
        console.warn('[Mock Mode] updateDatabaseView called', id);
        return true;
    },
    deleteDatabaseView: async (id) => {
        console.warn('[Mock Mode] deleteDatabaseView called', id);
        return true;
    },
    createDatabaseRow: async (databaseId, properties) => {
        console.warn('[Mock Mode] createDatabaseRow called', databaseId);
        return {
            id: `row_${Date.now()}`,
            databaseId,
            properties: properties || {},
            orderIndex: 0,
            createdAt: Date.now(),
            updatedAt: Date.now(),
        };
    },
    getDatabaseRow: async (rowId) => {
        console.warn('[Mock Mode] getDatabaseRow called', rowId);
        return { id: rowId, properties: { title: '示例行' }, orderIndex: 0 };
    },
    getDatabaseRows: async (databaseId, options) => {
        console.warn('[Mock Mode] getDatabaseRows called', databaseId);
        return [
            { id: 'row_1', databaseId, properties: { title: '任务1', status: '待办' }, orderIndex: 0 },
            { id: 'row_2', databaseId, properties: { title: '任务2', status: '进行中' }, orderIndex: 1 },
        ];
    },
    updateDatabaseRow: async (rowId, updates) => {
        console.warn('[Mock Mode] updateDatabaseRow called', rowId);
        return true;
    },
    deleteDatabaseRow: async (rowId) => {
        console.warn('[Mock Mode] deleteDatabaseRow called', rowId);
        return true;
    },
    updateRowOrders: async (databaseId, rowOrders) => {
        console.warn('[Mock Mode] updateRowOrders called', databaseId);
        return true;
    },
    // 代理 API
    getProxyConfig: async () => {
        console.warn('[Mock Mode] getProxyConfig called');
        return {
            enabled: false,
            type: 'http',
            host: '',
            port: '',
            username: '',
            password: '',
        };
    },
    setProxyConfig: async (config) => {
        console.warn('[Mock Mode] setProxyConfig called', config);
        return { success: true };
    },
    testProxyConnection: async (config) => {
        console.warn('[Mock Mode] testProxyConnection called - not available in browser');
        return { success: false, message: '浏览器模式不支持代理测试' };
    },
    callAIAPI: async (config, messages) => {
        console.warn('[Mock Mode] callAIAPI called - will use browser fetch');
        return { success: false, error: '浏览器模式请使用直接 API 调用' };
    },
}

// 导出 API（优先使用真实 API，否则使用 mock）
export const electronAPI = isElectron ? window.electronAPI : mockAPI;

// 导出环境标识
export const isDevelopment = !isElectron;
