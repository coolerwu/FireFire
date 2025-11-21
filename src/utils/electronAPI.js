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
};

// 导出 API（优先使用真实 API，否则使用 mock）
export const electronAPI = isElectron ? window.electronAPI : mockAPI;

// 导出环境标识
export const isDevelopment = !isElectron;
