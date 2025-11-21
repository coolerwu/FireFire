const fs = require('fs');
const {ipcMain} = require("electron");
const {getCurSettingConfig} = require("./settingFile");
const path = require("path");
const { v4: uuidv4 } = require("uuid");
const dbManager = require("./dbManager");
const { tiptapToMarkdown, markdownToTiptap, extractMetadata } = require("./markdownConverter");

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
 */
let cwjsonFileMap = {};

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
        if (absPath === undefined) {
            fileFullPath = curNotebookFullPath;
        } else {
            fileFullPath = path.join(curNotebookFullPath, absPath);
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
                cwjsonFileMap[cwjsonFile.id] = cwjsonFile;
                return cwjsonFile;
            }).sort((left, right) => right.updateTime - left.updateTime);
        } else {
            cwjsonFileMap = {};
            return [];
        }
    });
    ipcMain.handle('createNotebookFile', (event, absPath) => {
        const curNotebookFullPath = getCurNotebookFullPath();
        const curNotebookSuffix = getCurNotebookSuffix();
        let fileFullPath = path.join(curNotebookFullPath, absPath);
        if (!fileFullPath.endsWith(curNotebookSuffix)) {
            fileFullPath += curNotebookSuffix;
        }
        if (!fs.existsSync(fileFullPath)) {
            fs.writeFileSync(fileFullPath, '');
        }
    });
    ipcMain.handle('createNotebookDir', (event, absPath) => {
        const curNotebookFullPath = getCurNotebookFullPath();
        let fileFullPath = path.join(curNotebookFullPath, absPath);
        if (!fs.existsSync(fileFullPath)) {
            fs.mkdirSync(fileFullPath);
        }
    });
    ipcMain.handle('readNotebookFile', (event, absPath) => {
        try {
            const curNotebookFullPath = getCurNotebookFullPath();
            const curNotebookSuffix = getCurNotebookSuffix();
            let fileFullPath = path.join(curNotebookFullPath, absPath);

            if (!fileFullPath.endsWith(curNotebookSuffix)) {
                fileFullPath += curNotebookSuffix;
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
            let fileFullPath = path.join(curNotebookFullPath, absPath);

            if (!fileFullPath.endsWith(curNotebookSuffix)) {
                fileFullPath += curNotebookSuffix;
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
        const newFileFullPath = path.join(curNotebookFullPath, newPath) + curNotebookSuffix;
        const oldFileFullPath = path.join(curNotebookFullPath, oldPath) + curNotebookSuffix;
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
        const fileFullPath = path.join(curNotebookFullPath, absPath) + curNotebookSuffix;
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
        const fileFullPath = path.join(curNotebookFullPath, absPath);
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
        //检查路径
        if (!fs.existsSync(fromPath)) {
            return null;
        }

        //创建父目录
        if (!fs.existsSync(toDirectoryPath)) {
            fs.mkdirSync(toDirectoryPath);
        }

        //附件后缀
        let attachmentSuffix = "";
        if (fromPath.lastIndexOf('.') !== -1) {
            attachmentSuffix = fromPath.substring(fromPath.lastIndexOf('.'));
        }

        //移动指定文件
        const srcUrl = path.join(toDirectoryPath, uuidv4()) + attachmentSuffix;
        fs.cpSync(fromPath, srcUrl);
        return srcUrl;
    });
    ipcMain.handle('copyAttachmentByBase64', (event, base64, toDirectoryPath) => {
        //检查路径
        if (!base64) {
            return null;
        }

        //创建父目录
        if (!fs.existsSync(toDirectoryPath)) {
            fs.mkdirSync(toDirectoryPath);
        }

        let arr = base64.split(',');
        let mime = arr[0].match(/:(.*?);/)[1];
        let byteStr = atob(arr[1]);
        let n = byteStr.length
        let u8arr = new Uint8Array(n);
        while (n--) {
            u8arr[n] = byteStr.charCodeAt(n);
        }

        //移动指定文件
        const srcUrl = path.join(toDirectoryPath, uuidv4()) + '.' + mime.substring(mime.lastIndexOf('/') + 1);
        fs.writeFileSync(srcUrl, u8arr)
        return srcUrl;
    });
};