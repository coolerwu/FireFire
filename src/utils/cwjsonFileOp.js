import {electronAPI} from "./electronAPI";
import {logger} from "./logger";

/**
 * 防抖定时器存储
 */
const debounceTimers = new Map();

/**
 * 防抖函数
 * @param {string} key - 唯一标识
 * @param {Function} fn - 要执行的函数
 * @param {number} delay - 延迟时间（毫秒）
 */
const debounce = (key, fn, delay = 1000) => {
    // 清除之前的定时器
    if (debounceTimers.has(key)) {
        clearTimeout(debounceTimers.get(key));
    }

    // 设置新的定时器
    const timer = setTimeout(() => {
        fn();
        debounceTimers.delete(key);
    }, delay);

    debounceTimers.set(key, timer);
};

/**
 * 保存状态追踪
 */
let isSaving = false;
let pendingSave = null;

/**
 * 保存状态枚举
 */
export const SaveStatus = {
    IDLE: 'idle',
    PENDING: 'pending',
    SAVING: 'saving',
    SAVED: 'saved',
    ERROR: 'error',
};

/**
 * 状态订阅者
 */
const statusSubscribers = new Set();

/**
 * 当前保存状态
 */
let currentSaveStatus = SaveStatus.IDLE;

/**
 * 通知所有订阅者状态变化
 */
const notifyStatusChange = (status, filename = null) => {
    currentSaveStatus = status;
    statusSubscribers.forEach(callback => {
        try {
            callback(status, filename);
        } catch (e) {
            logger.error('[SaveStatus] 订阅者回调错误:', e);
        }
    });
};

/**
 * 订阅保存状态变化
 * @param {Function} callback - 回调函数 (status, filename) => void
 * @returns {Function} 取消订阅函数
 */
export const subscribeSaveStatus = (callback) => {
    statusSubscribers.add(callback);
    // 立即通知当前状态
    callback(currentSaveStatus, null);
    return () => statusSubscribers.delete(callback);
};

/**
 * 获取当前保存状态
 */
export const getCurrentSaveStatus = () => currentSaveStatus;

/**
 * markdown持久化（带防抖）
 * @param editor 编辑器
 * @param cwjson 文件
 * @param delay 防抖延迟（毫秒，默认 1000）
 */
export const persist = (editor, cwjson, delay = 1000) => {
    if (!editor || !cwjson?.filename) {
        logger.warn('[persist] 无效的参数');
        return;
    }

    const key = `persist_${cwjson.filename}`;

    // 通知状态：等待保存
    notifyStatusChange(SaveStatus.PENDING, cwjson.filename);

    debounce(key, async () => {
        // 防止并发保存
        if (isSaving) {
            pendingSave = { editor, cwjson };
            return;
        }

        isSaving = true;
        notifyStatusChange(SaveStatus.SAVING, cwjson.filename);

        try {
            const content = JSON.stringify(editor.getJSON());
            await electronAPI.writeNotebookFile(cwjson.filename, content);
            logger.debug('[persist] 保存成功:', cwjson.filename);
            notifyStatusChange(SaveStatus.SAVED, cwjson.filename);

            // 尝试保存版本历史（异步，不阻塞主保存流程）
            try {
                const noteId = cwjson.id || cwjson.filename.replace(/\.[^/.]+$/, '');
                await electronAPI.saveVersion(noteId, content, false);
            } catch (versionError) {
                logger.debug('[persist] 版本保存跳过或失败:', versionError);
            }

            // 3秒后恢复空闲状态
            setTimeout(() => {
                if (currentSaveStatus === SaveStatus.SAVED) {
                    notifyStatusChange(SaveStatus.IDLE, null);
                }
            }, 3000);
        } catch (error) {
            logger.error('[persist] 保存失败:', error);
            notifyStatusChange(SaveStatus.ERROR, cwjson.filename);
        } finally {
            isSaving = false;

            // 处理待保存的内容
            if (pendingSave) {
                const { editor: e, cwjson: c } = pendingSave;
                pendingSave = null;
                persist(e, c, 100); // 快速重试
            }
        }
    }, delay);
};

/**
 * 立即保存（不防抖）
 * @param editor 编辑器
 * @param cwjson 文件
 */
export const persistImmediate = async (editor, cwjson) => {
    if (!editor || !cwjson?.filename) {
        return;
    }

    try {
        const content = JSON.stringify(editor.getJSON());
        await electronAPI.writeNotebookFile(cwjson.filename, content);
        logger.debug('[persistImmediate] 保存成功:', cwjson.filename);
    } catch (error) {
        logger.error('[persistImmediate] 保存失败:', error);
        throw error;
    }
};

/**
 * 拷贝其他地方的文件到附件文件夹
 */
export const copyAttachment = (cwjson, fromPath) => {
    if (!cwjson) {
        return null;
    }

    return electronAPI.copyAttachment(fromPath, cwjson.attachmentPath);
}

/**
 * 拷贝base64到附件文件夹
 */
export const copyAttachmentByBase64 = (cwjson, base64) => {
    if (!cwjson) {
        return null;
    }

    return electronAPI.copyAttachmentByBase64(base64, cwjson.attachmentPath);
}