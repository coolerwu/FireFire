/** @type {import('jest').Config} */
module.exports = {
  // 测试环境
  testEnvironment: 'jsdom',

  // 测试文件匹配
  testMatch: [
    '<rootDir>/__tests__/**/*.test.{js,jsx}',
    '<rootDir>/src/**/*.test.{js,jsx}',
  ],

  // 模块路径别名（与 config-overrides.js 保持一致）
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
    '^assets/(.*)$': '<rootDir>/src/assets/$1',
    '^components/(.*)$': '<rootDir>/src/components/$1',
    '^pages/(.*)$': '<rootDir>/src/pages/$1',
    '^common/(.*)$': '<rootDir>/src/common/$1',
    '^utils/(.*)$': '<rootDir>/src/utils/$1',
    // 样式文件 mock
    '\\.(css|less|scss|sass)$': 'identity-obj-proxy',
    // 静态资源 mock
    '\\.(jpg|jpeg|png|gif|svg|ico)$': '<rootDir>/__tests__/__mocks__/fileMock.js',
  },

  // 设置文件
  setupFilesAfterEnv: ['<rootDir>/__tests__/setup.js'],

  // 转换配置
  transform: {
    '^.+\\.(js|jsx)$': 'babel-jest',
  },

  // 忽略转换的模块
  transformIgnorePatterns: [
    'node_modules/(?!(uuid|lowlight|@tiptap)/)',
  ],

  // 覆盖率配置
  collectCoverageFrom: [
    'src/**/*.{js,jsx}',
    'electron/**/*.js',
    '!src/index.jsx',
    '!src/reportWebVitals.js',
    '!**/node_modules/**',
    '!**/__tests__/**',
  ],

  // 覆盖率报告格式
  coverageReporters: ['text', 'text-summary', 'lcov', 'html'],

  // 覆盖率阈值
  coverageThreshold: {
    global: {
      branches: 30,
      functions: 30,
      lines: 30,
      statements: 30,
    },
  },

  // 测试超时
  testTimeout: 10000,

  // 详细输出
  verbose: true,
};
