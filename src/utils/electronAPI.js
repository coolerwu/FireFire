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
}

// 导出 API（优先使用真实 API，否则使用 mock）
export const electronAPI = isElectron ? window.electronAPI : mockAPI;

// 导出环境标识
export const isDevelopment = !isElectron;
