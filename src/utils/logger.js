/**
 * 统一日志工具
 * 根据环境自动过滤日志级别
 */

// 判断是否为开发环境
const isDev = process.env.NODE_ENV === 'development' ||
              process.env.REACT_APP_ENV === 'development' ||
              window.location.hostname === 'localhost';

// 日志级别
const LogLevel = {
    DEBUG: 0,
    INFO: 1,
    WARN: 2,
    ERROR: 3,
};

// 当前日志级别（生产环境只显示 WARN 及以上）
const currentLevel = isDev ? LogLevel.DEBUG : LogLevel.WARN;

/**
 * 格式化日志前缀
 * @param {string} level - 日志级别
 * @param {string} context - 上下文
 */
const formatPrefix = (level, context) => {
    const timestamp = new Date().toISOString().substring(11, 23);
    return context ? `[${timestamp}] [${level}] [${context}]` : `[${timestamp}] [${level}]`;
};

/**
 * 日志对象
 */
export const logger = {
    /**
     * 调试日志（仅开发环境）
     */
    debug: (message, ...args) => {
        if (currentLevel <= LogLevel.DEBUG) {
            console.log(formatPrefix('DEBUG'), message, ...args);
        }
    },

    /**
     * 信息日志（仅开发环境）
     */
    info: (message, ...args) => {
        if (currentLevel <= LogLevel.INFO) {
            console.log(formatPrefix('INFO'), message, ...args);
        }
    },

    /**
     * 警告日志
     */
    warn: (message, ...args) => {
        if (currentLevel <= LogLevel.WARN) {
            console.warn(formatPrefix('WARN'), message, ...args);
        }
    },

    /**
     * 错误日志
     */
    error: (message, ...args) => {
        if (currentLevel <= LogLevel.ERROR) {
            console.error(formatPrefix('ERROR'), message, ...args);
        }
    },

    /**
     * 创建带上下文的 logger
     * @param {string} context - 上下文名称（如组件名、模块名）
     */
    withContext: (context) => ({
        debug: (message, ...args) => {
            if (currentLevel <= LogLevel.DEBUG) {
                console.log(formatPrefix('DEBUG', context), message, ...args);
            }
        },
        info: (message, ...args) => {
            if (currentLevel <= LogLevel.INFO) {
                console.log(formatPrefix('INFO', context), message, ...args);
            }
        },
        warn: (message, ...args) => {
            if (currentLevel <= LogLevel.WARN) {
                console.warn(formatPrefix('WARN', context), message, ...args);
            }
        },
        error: (message, ...args) => {
            if (currentLevel <= LogLevel.ERROR) {
                console.error(formatPrefix('ERROR', context), message, ...args);
            }
        },
    }),

    /**
     * 性能计时
     * @param {string} label - 计时标签
     */
    time: (label) => {
        if (isDev) {
            console.time(label);
        }
    },

    timeEnd: (label) => {
        if (isDev) {
            console.timeEnd(label);
        }
    },
};

export default logger;
