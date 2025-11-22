/**
 * 统一错误处理工具模块
 */

import { message } from 'antd';

/**
 * 错误类型枚举
 */
export const ErrorCodes = {
    FILE_NOT_FOUND: 'FILE_NOT_FOUND',
    FILE_READ_ERROR: 'FILE_READ_ERROR',
    FILE_WRITE_ERROR: 'FILE_WRITE_ERROR',
    PATH_VALIDATION_ERROR: 'PATH_VALIDATION_ERROR',
    NETWORK_ERROR: 'NETWORK_ERROR',
    UNKNOWN_ERROR: 'UNKNOWN_ERROR',
};

/**
 * 错误消息映射
 */
const ErrorMessages = {
    [ErrorCodes.FILE_NOT_FOUND]: '文件不存在',
    [ErrorCodes.FILE_READ_ERROR]: '读取文件失败',
    [ErrorCodes.FILE_WRITE_ERROR]: '写入文件失败',
    [ErrorCodes.PATH_VALIDATION_ERROR]: '路径验证失败',
    [ErrorCodes.NETWORK_ERROR]: '网络连接失败',
    [ErrorCodes.UNKNOWN_ERROR]: '发生未知错误',
};

/**
 * 处理 API 错误
 * @param {Error|Object} error - 错误对象
 * @param {string} context - 错误上下文（用于日志）
 * @param {boolean} showMessage - 是否显示用户消息（默认 true）
 */
export const handleAPIError = (error, context = '', showMessage = true) => {
    // 记录错误日志
    console.error(`[${context || 'API'}]`, error);

    // 提取错误消息
    let errorMessage = '操作失败';

    if (error?.message) {
        errorMessage = error.message;
    } else if (error?.error) {
        errorMessage = error.error;
    } else if (typeof error === 'string') {
        errorMessage = error;
    }

    // 根据错误代码获取友好消息
    if (error?.code && ErrorMessages[error.code]) {
        errorMessage = ErrorMessages[error.code];
    }

    // 显示用户消息
    if (showMessage) {
        message.error(errorMessage);
    }

    return errorMessage;
};

/**
 * 处理文件操作错误
 * @param {Error} error - 错误对象
 * @param {string} operation - 操作类型（read/write/delete）
 * @param {string} filename - 文件名
 */
export const handleFileError = (error, operation, filename = '') => {
    const operationNames = {
        read: '读取',
        write: '写入',
        delete: '删除',
        rename: '重命名',
        create: '创建',
    };

    const opName = operationNames[operation] || operation;
    const context = `FileOperation:${operation}`;

    console.error(`[${context}] ${filename}:`, error);

    const userMessage = filename
        ? `${opName}文件 "${filename}" 失败`
        : `${opName}文件失败`;

    message.error(userMessage);

    return userMessage;
};

/**
 * 创建结构化错误响应（用于 IPC）
 * @param {string} code - 错误代码
 * @param {string} message - 错误消息
 * @param {Object} details - 额外详情（可选）
 */
export const createErrorResponse = (code, errorMessage, details = null) => {
    return {
        success: false,
        error: errorMessage,
        code,
        ...(details && { details }),
    };
};

/**
 * 创建成功响应（用于 IPC）
 * @param {*} data - 响应数据
 */
export const createSuccessResponse = (data) => {
    return {
        success: true,
        data,
    };
};

/**
 * Promise 包装器，自动处理错误
 * @param {Promise} promise - 要包装的 Promise
 * @param {string} context - 错误上下文
 * @returns {Promise<[Error|null, any]>} - [error, data] 元组
 */
export const safePromise = async (promise, context = '') => {
    try {
        const data = await promise;
        return [null, data];
    } catch (error) {
        handleAPIError(error, context);
        return [error, null];
    }
};

/**
 * 创建带有自动错误处理的 API 调用
 * @param {Function} apiCall - API 调用函数
 * @param {string} context - 错误上下文
 * @returns {Function} - 包装后的函数
 */
export const withErrorHandler = (apiCall, context) => {
    return async (...args) => {
        try {
            return await apiCall(...args);
        } catch (error) {
            handleAPIError(error, context);
            throw error;
        }
    };
};

const errorHandlerModule = {
    handleAPIError,
    handleFileError,
    createErrorResponse,
    createSuccessResponse,
    safePromise,
    withErrorHandler,
    ErrorCodes,
};

export default errorHandlerModule;
