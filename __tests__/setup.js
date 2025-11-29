/**
 * Jest 测试全局设置
 */
require('@testing-library/jest-dom');

// Mock window.matchMedia
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: jest.fn().mockImplementation(query => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: jest.fn(),
    removeListener: jest.fn(),
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
    dispatchEvent: jest.fn(),
  })),
});

// Mock ResizeObserver
global.ResizeObserver = jest.fn().mockImplementation(() => ({
  observe: jest.fn(),
  unobserve: jest.fn(),
  disconnect: jest.fn(),
}));

// Mock IntersectionObserver
global.IntersectionObserver = jest.fn().mockImplementation(() => ({
  observe: jest.fn(),
  unobserve: jest.fn(),
  disconnect: jest.fn(),
}));

// Mock electronAPI for renderer tests
global.window.electronAPI = {
  // 文件操作
  readNotebookFile: jest.fn(),
  writeNotebookFile: jest.fn(),
  deleteNotebookFile: jest.fn(),
  renameNotebookFile: jest.fn(),
  getDirectory: jest.fn(),

  // 日记操作
  getTodayJournal: jest.fn(),
  getJournals: jest.fn(),
  deleteJournal: jest.fn(),

  // 搜索
  searchNotes: jest.fn(),

  // 设置
  getSetting: jest.fn(),
  setSetting: jest.fn(),

  // 版本
  getVersions: jest.fn(),
  restoreVersion: jest.fn(),

  // 数据库
  getNoteInfo: jest.fn(),
  getAllTags: jest.fn(),
  getNotesWithTag: jest.fn(),

  // 其他
  openExternal: jest.fn(),
  showItemInFolder: jest.fn(),
};

// 禁用 console.error 在测试中的噪音（可选）
// const originalError = console.error;
// beforeAll(() => {
//   console.error = (...args) => {
//     if (args[0]?.includes?.('Warning:')) return;
//     originalError.call(console, ...args);
//   };
// });
// afterAll(() => {
//   console.error = originalError;
// });
