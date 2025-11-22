const fs = require('fs');
const {ipcMain} = require("electron");
const {getCurSettingConfig} = require("./settingFile");
const path = require("path");
const { v4: uuidv4 } = require("uuid");
const dbManager = require("./dbManager");
const { tiptapToMarkdown, markdownToTiptap, extractMetadata } = require("./markdownConverter");
const {
    validateAndResolvePath,
    isPathWithinRoot,
    isAllowedMimeType,
    parseBase64DataUrl,
    isFileSizeAllowed,
    getExtensionFromMimeType,
} = require("./utils/pathValidator");

/**
 * 获取当前notebook完整path
 */
const getCurNotebookFullPath = () => {
    return getCurSettingConfig().notebookPath;
}

/**
 * 获取当前notebook完整path
 */
const getCurAttachmentFullPath = () => {
    return getCurSettingConfig().attachmentPath;
}

/**
 * 获取当前notebook后缀
 */
const getCurNotebookSuffix = () => {
    return getCurSettingConfig().notebookSuffix;
}

/**
 * 当前cwjson文件列表缓存
 * 使用 Map 实现简单的 LRU 缓存
 */
const MAX_CACHE_SIZE = 100;
let cwjsonFileMap = new Map();

/**
 * 添加到缓存，自动清理超出限制的旧条目
 */
const addToCache = (key, value) => {
    // 如果已存在，先删除再添加（移到末尾）
    if (cwjsonFileMap.has(key)) {
        cwjsonFileMap.delete(key);
    }

    // 超出限制时删除最早的条目
    if (cwjsonFileMap.size >= MAX_CACHE_SIZE) {
        const firstKey = cwjsonFileMap.keys().next().value;
        cwjsonFileMap.delete(firstKey);
        console.log('[NotebookFile] 缓存已满，清理旧条目:', firstKey);
    }

    cwjsonFileMap.set(key, value);
};

/**
 * 清空缓存
 */
const clearCache = () => {
    const size = cwjsonFileMap.size;
    cwjsonFileMap.clear();
    console.log('[NotebookFile] 缓存已清空，清理条目数:', size);
};

/**
 * 从 Tiptap JSON 内容中提取标签
 */
const extractTags = (contentObj) => {
    const tags = new Set();
    const traverse = (node) => {
        if (node.type === 'tag' && node.attrs && node.attrs.tag) {
            tags.add(node.attrs.tag);
        }
        if (node.content && Array.isArray(node.content)) {
            node.content.forEach(traverse);
        }
    };
    if (contentObj.content) {
        traverse(contentObj);
    }
    return Array.from(tags);
};

/**
 * 从 Tiptap JSON 内容中提取内部链接
 */
const extractLinks = (contentObj) => {
    const links = new Set();
    const traverse = (node) => {
        if (node.type === 'internalLink' && node.attrs && node.attrs.target) {
            links.add(node.attrs.target);
        }
        if (node.content && Array.isArray(node.content)) {
            node.content.forEach(traverse);
        }
    };
    if (contentObj.content) {
        traverse(contentObj);
    }
    return Array.from(links);
};

/**
 * 从 Tiptap JSON 内容中提取标题（第一个 heading 或段落的文本）
 */
const extractTitle = (contentObj) => {
    let title = '';
    const traverse = (node) => {
        if (title) return; // Already found title

        if (node.type === 'heading' && node.content) {
            title = node.content.map(n => n.text || '').join('');
            return;
        }
        if (node.type === 'paragraph' && node.content && !title) {
            const text = node.content.map(n => n.text || '').join('');
            if (text.trim()) {
                title = text.substring(0, 100); // Limit to 100 chars
                return;
            }
        }
        if (node.content && Array.isArray(node.content)) {
            node.content.forEach(traverse);
        }
    };
    if (contentObj.content) {
        traverse(contentObj);
    }
    return title || '未命名笔记';
};

/**
 * 从 Tiptap JSON 内容中提取纯文本（用于全文搜索）
 */
const extractText = (contentObj) => {
    const texts = [];
    const traverse = (node) => {
        if (node.text) {
            texts.push(node.text);
        }
        if (node.content && Array.isArray(node.content)) {
            node.content.forEach(traverse);
        }
    };
    if (contentObj.content) {
        traverse(contentObj);
    }
    return texts.join(' ');
};

/**
 * 文件初始化
 */
exports.init = () => {
    ipcMain.handle('readNotebookFileList', (event, absPath) => {
        const curNotebookFullPath = getCurNotebookFullPath();
        const curNotebookSuffix = getCurNotebookSuffix();
        if (!fs.existsSync(curNotebookFullPath)) {
            fs.mkdirSync(curNotebookFullPath);
        }

        let fileFullPath;
        if (absPath === undefined || absPath === '.' || absPath === '') {
            fileFullPath = curNotebookFullPath;
        } else {
            // 路径验证
            const validation = validateAndResolvePath(absPath, curNotebookFullPath);
            if (!validation.valid) {
                console.error('[NotebookFile] 路径验证失败:', validation.error);
                return [];
            }
            fileFullPath = validation.fullPath;
        }

        const fileList = fs.readdirSync(fileFullPath);
        if (fileList) {
            return fileList.filter(file => {
                if (file.endsWith(curNotebookSuffix)) {
                    return true;
                } else if (file.includes('.')) {
                    return false;
                } else {
                    return true;
                }
            }).map(file => {
                let curFilePath = path.join(fileFullPath, file);
                const fileStat = fs.statSync(curFilePath);
                const attachmentPath = getCurAttachmentFullPath();
                const notebookPath = getCurNotebookFullPath();
                let attachmentFullPath = path.join(attachmentPath, curFilePath.substring(notebookPath.length));
                attachmentFullPath = attachmentFullPath.substring(0, attachmentFullPath.lastIndexOf(curNotebookSuffix));
                const cwjsonFile = {
                    filename: file,
                    isDirectory: fileStat.isDirectory(),
                    id: fileStat.isDirectory() ? file : file.substring(0, file.lastIndexOf(curNotebookSuffix)),
                    updateTime: fileStat.mtimeMs,
                    notebookPath: curFilePath,
                    attachmentPath: attachmentFullPath,
                };
                addToCache(cwjsonFile.id, cwjsonFile);
                return cwjsonFile;
            }).sort((left, right) => right.updateTime - left.updateTime);
        } else {
            clearCache();
            return [];
        }
    });
    ipcMain.handle('createNotebookFile', (event, absPath) => {
        const curNotebookFullPath = getCurNotebookFullPath();
        const curNotebookSuffix = getCurNotebookSuffix();

        // 路径验证
        const validation = validateAndResolvePath(absPath, curNotebookFullPath);
        if (!validation.valid) {
            console.error('[NotebookFile] createNotebookFile 路径验证失败:', validation.error);
            throw new Error(validation.error);
        }

        let fileFullPath = validation.fullPath;
        if (!fileFullPath.endsWith(curNotebookSuffix)) {
            fileFullPath += curNotebookSuffix;
        }

        // 再次验证添加后缀后的路径
        if (!isPathWithinRoot(fileFullPath, curNotebookFullPath)) {
            throw new Error('路径超出允许范围');
        }

        if (!fs.existsSync(fileFullPath)) {
            fs.writeFileSync(fileFullPath, '');
        }
    });
    ipcMain.handle('createNotebookDir', (event, absPath) => {
        const curNotebookFullPath = getCurNotebookFullPath();

        // 路径验证
        const validation = validateAndResolvePath(absPath, curNotebookFullPath);
        if (!validation.valid) {
            console.error('[NotebookFile] createNotebookDir 路径验证失败:', validation.error);
            throw new Error(validation.error);
        }

        const fileFullPath = validation.fullPath;
        if (!fs.existsSync(fileFullPath)) {
            fs.mkdirSync(fileFullPath);
        }
    });
    ipcMain.handle('readNotebookFile', (event, absPath) => {
        try {
            const curNotebookFullPath = getCurNotebookFullPath();
            const curNotebookSuffix = getCurNotebookSuffix();

            // 路径验证
            const validation = validateAndResolvePath(absPath, curNotebookFullPath);
            if (!validation.valid) {
                console.error('[NotebookFile] readNotebookFile 路径验证失败:', validation.error);
                throw new Error(validation.error);
            }

            let fileFullPath = validation.fullPath;
            if (!fileFullPath.endsWith(curNotebookSuffix)) {
                fileFullPath += curNotebookSuffix;
            }

            // 再次验证添加后缀后的路径
            if (!isPathWithinRoot(fileFullPath, curNotebookFullPath)) {
                throw new Error('路径超出允许范围');
            }

            if (!fs.existsSync(fileFullPath)) {
                console.error('[NotebookFile] File not found:', fileFullPath);
                throw new Error(`File not found: ${absPath}`);
            }

            const content = fs.readFileSync(fileFullPath, 'utf-8');

            // Convert Markdown to Tiptap JSON for the editor
            try {
                const { content: tiptapJSON } = markdownToTiptap(content);
                console.log('[NotebookFile] Successfully loaded Markdown file:', absPath);
                return JSON.stringify(tiptapJSON);
            } catch (error) {
                console.error('[NotebookFile] Error converting Markdown to Tiptap:', error);
                throw new Error(`Failed to parse Markdown file ${absPath}: ${error.message}`);
            }
        } catch (error) {
            console.error('[NotebookFile] Error reading file:', error);
            // Return empty document so UI doesn't crash
            return JSON.stringify({ type: 'doc', content: [] });
        }
    });
    ipcMain.handle('writeNotebookFile', (event, absPath, content) => {
        try {
            const curNotebookFullPath = getCurNotebookFullPath();
            const curNotebookSuffix = getCurNotebookSuffix();

            // 路径验证
            const validation = validateAndResolvePath(absPath, curNotebookFullPath);
            if (!validation.valid) {
                console.error('[NotebookFile] writeNotebookFile 路径验证失败:', validation.error);
                throw new Error(validation.error);
            }

            let fileFullPath = validation.fullPath;
            if (!fileFullPath.endsWith(curNotebookSuffix)) {
                fileFullPath += curNotebookSuffix;
            }

            // 再次验证添加后缀后的路径
            if (!isPathWithinRoot(fileFullPath, curNotebookFullPath)) {
                throw new Error('路径超出允许范围');
            }

            // Parse Tiptap JSON (content is always JSON from editor)
            let contentObj;
            try {
                contentObj = JSON.parse(content);
            } catch (error) {
                console.error('[NotebookFile] Invalid JSON content:', error);
                throw new Error(`Invalid content format: ${error.message}`);
            }

            // Convert Tiptap JSON to Markdown
            let writeContent;
            try {
                const noteId = path.basename(fileFullPath, curNotebookSuffix);
                const metadata = extractMetadata(contentObj, noteId);
                writeContent = tiptapToMarkdown(contentObj, metadata);
                console.log('[NotebookFile] Successfully converted to Markdown format');
            } catch (error) {
                console.error('[NotebookFile] Error converting to Markdown:', error);
                throw new Error(`Failed to convert to Markdown: ${error.message}`);
            }

            // Write file
            try {
                // Ensure directory exists
                const dir = path.dirname(fileFullPath);
                if (!fs.existsSync(dir)) {
                    fs.mkdirSync(dir, { recursive: true });
                }

                fs.writeFileSync(fileFullPath, writeContent, 'utf-8');
                console.log('[NotebookFile] Successfully wrote file:', fileFullPath);
            } catch (error) {
                console.error('[NotebookFile] Error writing file:', error);
                throw new Error(`Failed to write file: ${error.message}`);
            }

            // 更新数据库索引
            try {
                const noteId = path.basename(fileFullPath, curNotebookSuffix);
                const tags = extractTags(contentObj);
                const links = extractLinks(contentObj);
                const title = extractTitle(contentObj);
                const contentText = extractText(contentObj);

                // 检查是否是日记（路径包含 journals/）
                const isJournal = fileFullPath.includes('/journals/') || fileFullPath.includes('\\journals\\');
                const journalDate = isJournal ? noteId : null;

                console.log(`[NotebookFile] 保存笔记到数据库: id=${noteId}, isJournal=${isJournal}, journalDate=${journalDate}`);

                dbManager.saveNote({
                    id: noteId,
                    title: title,
                    path: fileFullPath,
                    contentText: contentText,
                    tags: tags,
                    outgoingLinks: links,
                    isJournal: isJournal,
                    journalDate: journalDate,
                });
            } catch (error) {
                console.error('[NotebookFile] 更新数据库索引失败:', error);
                // Database indexing failure shouldn't prevent file save
                // Just log the error and continue
            }
        } catch (error) {
            console.error('[NotebookFile] Error in writeNotebookFile:', error);
            throw error; // Re-throw to let caller handle
        }
    });
    ipcMain.handle('renameNotebookFile', (event, oldPath, newPath) => {
        const curNotebookFullPath = getCurNotebookFullPath();
        const curNotebookSuffix = getCurNotebookSuffix();

        // 验证旧路径
        const oldValidation = validateAndResolvePath(oldPath, curNotebookFullPath);
        if (!oldValidation.valid) {
            console.error('[NotebookFile] renameNotebookFile 旧路径验证失败:', oldValidation.error);
            return false;
        }

        // 验证新路径
        const newValidation = validateAndResolvePath(newPath, curNotebookFullPath);
        if (!newValidation.valid) {
            console.error('[NotebookFile] renameNotebookFile 新路径验证失败:', newValidation.error);
            return false;
        }

        const oldFileFullPath = oldValidation.fullPath + curNotebookSuffix;
        const newFileFullPath = newValidation.fullPath + curNotebookSuffix;

        // 再次验证添加后缀后的路径
        if (!isPathWithinRoot(oldFileFullPath, curNotebookFullPath) ||
            !isPathWithinRoot(newFileFullPath, curNotebookFullPath)) {
            console.error('[NotebookFile] renameNotebookFile 路径超出允许范围');
            return false;
        }

        if (fs.existsSync(oldFileFullPath) && !fs.existsSync(newFileFullPath)) {
            fs.renameSync(oldFileFullPath, newFileFullPath);
            return true;
        } else {
            return false;
        }
    });
    ipcMain.handle('deleteNotebookFile', (event, absPath) => {
        const curNotebookFullPath = getCurNotebookFullPath();
        const curNotebookSuffix = getCurNotebookSuffix();

        // 路径验证
        const validation = validateAndResolvePath(absPath, curNotebookFullPath);
        if (!validation.valid) {
            console.error('[NotebookFile] deleteNotebookFile 路径验证失败:', validation.error);
            return false;
        }

        const fileFullPath = validation.fullPath + curNotebookSuffix;

        // 再次验证添加后缀后的路径
        if (!isPathWithinRoot(fileFullPath, curNotebookFullPath)) {
            console.error('[NotebookFile] deleteNotebookFile 路径超出允许范围');
            return false;
        }

        if (fs.existsSync(fileFullPath)) {
            fs.rmSync(fileFullPath);

            // 从数据库删除
            const noteId = path.basename(fileFullPath, curNotebookSuffix);
            dbManager.deleteNote(noteId);

            return true;
        } else {
            return false;
        }
    });
    ipcMain.handle('deleteDirectory', (event, absPath) => {
        const curNotebookFullPath = getCurNotebookFullPath();

        // 路径验证
        const validation = validateAndResolvePath(absPath, curNotebookFullPath);
        if (!validation.valid) {
            console.error('[NotebookFile] deleteDirectory 路径验证失败:', validation.error);
            return false;
        }

        const fileFullPath = validation.fullPath;

        if (fs.existsSync(fileFullPath)) {
            const fileList = fs.readdirSync(fileFullPath);
            if (fileList || fileList.length > 0) {
                return false;
            }
            fs.rmSync(fileFullPath, {recursive: true, force: true});
            return true;
        } else {
            return false;
        }
    });
    ipcMain.handle('copyAttachment', (event, fromPath, toDirectoryPath) => {
        const curAttachmentFullPath = getCurAttachmentFullPath();

        // 检查源文件是否存在
        if (!fromPath || !fs.existsSync(fromPath)) {
            console.error('[NotebookFile] copyAttachment 源文件不存在:', fromPath);
            return null;
        }

        // 验证目标路径在附件目录内
        if (!isPathWithinRoot(toDirectoryPath, curAttachmentFullPath)) {
            console.error('[NotebookFile] copyAttachment 目标路径超出允许范围:', toDirectoryPath);
            return null;
        }

        // 创建父目录
        if (!fs.existsSync(toDirectoryPath)) {
            fs.mkdirSync(toDirectoryPath, { recursive: true });
        }

        // 附件后缀
        let attachmentSuffix = "";
        if (fromPath.lastIndexOf('.') !== -1) {
            attachmentSuffix = fromPath.substring(fromPath.lastIndexOf('.'));
        }

        // 移动指定文件
        const srcUrl = path.join(toDirectoryPath, uuidv4()) + attachmentSuffix;

        // 最终验证目标路径
        if (!isPathWithinRoot(srcUrl, curAttachmentFullPath)) {
            console.error('[NotebookFile] copyAttachment 最终路径超出允许范围:', srcUrl);
            return null;
        }

        fs.cpSync(fromPath, srcUrl);
        return srcUrl;
    });
    ipcMain.handle('copyAttachmentByBase64', (event, base64, toDirectoryPath) => {
        const curAttachmentFullPath = getCurAttachmentFullPath();
        const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB 限制

        // 检查 Base64 数据
        if (!base64) {
            console.error('[NotebookFile] copyAttachmentByBase64 Base64 数据为空');
            return null;
        }

        // 验证目标路径在附件目录内
        if (!isPathWithinRoot(toDirectoryPath, curAttachmentFullPath)) {
            console.error('[NotebookFile] copyAttachmentByBase64 目标路径超出允许范围:', toDirectoryPath);
            return null;
        }

        // 解析 Base64 数据
        const parseResult = parseBase64DataUrl(base64);
        if (!parseResult.valid) {
            console.error('[NotebookFile] copyAttachmentByBase64 Base64 格式错误:', parseResult.error);
            return null;
        }

        // 验证 MIME 类型
        if (!isAllowedMimeType(parseResult.mimeType)) {
            console.error('[NotebookFile] copyAttachmentByBase64 不允许的 MIME 类型:', parseResult.mimeType);
            return null;
        }

        // 解码 Base64
        let u8arr;
        try {
            const byteStr = atob(parseResult.data);
            const n = byteStr.length;

            // 检查文件大小
            if (!isFileSizeAllowed(n, MAX_FILE_SIZE)) {
                console.error('[NotebookFile] copyAttachmentByBase64 文件大小超出限制:', n, 'bytes');
                return null;
            }

            u8arr = new Uint8Array(n);
            for (let i = 0; i < n; i++) {
                u8arr[i] = byteStr.charCodeAt(i);
            }
        } catch (error) {
            console.error('[NotebookFile] copyAttachmentByBase64 Base64 解码失败:', error.message);
            return null;
        }

        // 创建父目录
        if (!fs.existsSync(toDirectoryPath)) {
            fs.mkdirSync(toDirectoryPath, { recursive: true });
        }

        // 获取文件扩展名
        const extension = getExtensionFromMimeType(parseResult.mimeType);

        // 生成目标路径
        const srcUrl = path.join(toDirectoryPath, uuidv4()) + '.' + extension;

        // 最终验证目标路径
        if (!isPathWithinRoot(srcUrl, curAttachmentFullPath)) {
            console.error('[NotebookFile] copyAttachmentByBase64 最终路径超出允许范围:', srcUrl);
            return null;
        }

        // 写入文件
        try {
            fs.writeFileSync(srcUrl, u8arr);
            return srcUrl;
        } catch (error) {
            console.error('[NotebookFile] copyAttachmentByBase64 写入文件失败:', error.message);
            return null;
        }
    });
};