/**
 * 路径验证工具模块
 * 用于防止路径穿越攻击和验证文件路径安全性
 */

const path = require('path');
const fs = require('fs');

/**
 * 验证目标路径是否在允许的根目录内
 * @param {string} targetPath - 目标路径
 * @param {string} rootPath - 允许的根目录
 * @returns {boolean} 是否在允许范围内
 */
function isPathWithinRoot(targetPath, rootPath) {
    if (!targetPath || !rootPath) {
        return false;
    }

    const resolvedTarget = path.resolve(targetPath);
    const resolvedRoot = path.resolve(rootPath);

    // 确保目标路径以根路径开头（加上路径分隔符以避免部分匹配）
    return resolvedTarget === resolvedRoot ||
           resolvedTarget.startsWith(resolvedRoot + path.sep);
}

/**
 * 净化文件名，移除危险字符
 * @param {string} filename - 原始文件名
 * @returns {string} 净化后的文件名
 */
function sanitizeFileName(filename) {
    if (!filename || typeof filename !== 'string') {
        return '';
    }
    // 移除路径分隔符和其他危险字符
    return filename.replace(/[<>:"|?*\x00-\x1f\\\/]/g, '_');
}

/**
 * 验证并规范化相对路径
 * @param {string} relativePath - 相对路径
 * @param {string} rootPath - 根目录
 * @returns {{valid: boolean, fullPath: string, error?: string}} 验证结果
 */
function validateAndResolvePath(relativePath, rootPath) {
    if (!relativePath || typeof relativePath !== 'string') {
        return { valid: false, fullPath: '', error: '路径不能为空' };
    }

    if (!rootPath || typeof rootPath !== 'string') {
        return { valid: false, fullPath: '', error: '根目录未配置' };
    }

    // 规范化路径
    const normalizedRelative = path.normalize(relativePath);

    // 检查是否包含向上遍历
    if (normalizedRelative.startsWith('..') || normalizedRelative.includes(`..${path.sep}`)) {
        return { valid: false, fullPath: '', error: '路径不允许包含上级目录引用' };
    }

    // 构建完整路径
    const fullPath = path.join(rootPath, normalizedRelative);

    // 最终验证
    if (!isPathWithinRoot(fullPath, rootPath)) {
        return { valid: false, fullPath: '', error: '路径超出允许范围' };
    }

    return { valid: true, fullPath };
}

/**
 * 验证 MIME 类型是否在允许的列表中
 * @param {string} mimeType - MIME 类型
 * @param {string[]} allowedTypes - 允许的类型列表
 * @returns {boolean}
 */
function isAllowedMimeType(mimeType, allowedTypes = null) {
    const defaultAllowedTypes = [
        'image/png',
        'image/jpeg',
        'image/jpg',
        'image/gif',
        'image/webp',
        'image/svg+xml',
        'image/bmp',
        'image/ico',
        'image/x-icon',
    ];

    const types = allowedTypes || defaultAllowedTypes;
    return types.includes(mimeType);
}

/**
 * 从 Base64 数据 URL 中提取 MIME 类型
 * @param {string} base64 - Base64 数据 URL
 * @returns {{valid: boolean, mimeType?: string, data?: string, error?: string}}
 */
function parseBase64DataUrl(base64) {
    if (!base64 || typeof base64 !== 'string') {
        return { valid: false, error: 'Base64 数据不能为空' };
    }

    // 验证格式
    const matches = base64.match(/^data:([\w\/+-]+);base64,(.+)$/);
    if (!matches) {
        return { valid: false, error: 'Base64 格式不正确' };
    }

    return {
        valid: true,
        mimeType: matches[1],
        data: matches[2],
    };
}

/**
 * 文件大小限制检查（默认 10MB）
 * @param {number} size - 文件大小（字节）
 * @param {number} maxSize - 最大允许大小（字节，默认 10MB）
 * @returns {boolean}
 */
function isFileSizeAllowed(size, maxSize = 10 * 1024 * 1024) {
    return size > 0 && size <= maxSize;
}

/**
 * 获取文件扩展名（从 MIME 类型）
 * @param {string} mimeType - MIME 类型
 * @returns {string} 文件扩展名（不含点）
 */
function getExtensionFromMimeType(mimeType) {
    const mimeToExt = {
        'image/png': 'png',
        'image/jpeg': 'jpg',
        'image/jpg': 'jpg',
        'image/gif': 'gif',
        'image/webp': 'webp',
        'image/svg+xml': 'svg',
        'image/bmp': 'bmp',
        'image/ico': 'ico',
        'image/x-icon': 'ico',
    };

    return mimeToExt[mimeType] || 'bin';
}

module.exports = {
    isPathWithinRoot,
    sanitizeFileName,
    validateAndResolvePath,
    isAllowedMimeType,
    parseBase64DataUrl,
    isFileSizeAllowed,
    getExtensionFromMimeType,
};
