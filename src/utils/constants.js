/**
 * 应用常量定义
 */

/**
 * 日期时间格式
 */
export const DATE_FORMATS = {
    // 日期格式
    DATE: 'YYYY-MM-DD',
    DATE_CN: 'YYYY年MM月DD日',

    // 时间格式
    TIME: 'HH:mm:ss',
    TIME_SHORT: 'HH:mm',

    // 日期时间格式
    DATETIME: 'YYYY-MM-DD HH:mm:ss',
    DATETIME_SHORT: 'YYYY-MM-DD HH:mm',

    // 文件名用日期格式
    FILENAME_DATE: 'YYYYMMDD',
    FILENAME_DATETIME: 'YYYYMMDD-HHmm',
};

/**
 * 文件相关常量
 */
export const FILE_CONSTANTS = {
    // 快速笔记目录
    QUICK_NOTES_DIR: 'Quick Notes',

    // 日记目录
    JOURNALS_DIR: 'journals',

    // 默认笔记前缀
    NOTE_PREFIX: '笔记-',

    // 文件大小限制 (10MB)
    MAX_FILE_SIZE: 10 * 1024 * 1024,

    // 缓存大小限制
    MAX_CACHE_SIZE: 100,
};

/**
 * UI 相关常量
 */
export const UI_CONSTANTS = {
    // 侧边栏宽度
    SIDEBAR_WIDTH: 80,

    // 自动保存延迟 (毫秒)
    AUTO_SAVE_DELAY: 1000,

    // 加载动画延迟 (毫秒)
    LOADING_DELAY: 50,
};

/**
 * 安全相关常量
 */
export const SECURITY_CONSTANTS = {
    // 允许的图片 MIME 类型
    ALLOWED_IMAGE_TYPES: [
        'image/png',
        'image/jpeg',
        'image/jpg',
        'image/gif',
        'image/webp',
        'image/svg+xml',
        'image/bmp',
    ],

    // 允许的 URL 协议
    ALLOWED_URL_PROTOCOLS: ['http:', 'https:'],
};

/**
 * 格式化日期为文件名格式
 * @param {Date} date - 日期对象
 * @returns {string} 格式化后的字符串
 */
export const formatDateForFilename = (date = new Date()) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');

    return `${year}${month}${day}-${hours}${minutes}`;
};

const constants = {
    DATE_FORMATS,
    FILE_CONSTANTS,
    UI_CONSTANTS,
    SECURITY_CONSTANTS,
    formatDateForFilename,
};

export default constants;
