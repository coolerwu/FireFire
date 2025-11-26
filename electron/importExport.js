/**
 * 导入/导出模块
 * 支持 Markdown 和 HTML 格式的导入导出
 */

const fs = require('fs');
const path = require('path');
const { ipcMain, dialog } = require('electron');
const { getCurSettingConfig } = require('./settingFile');
const dbManager = require('./dbManager');

/**
 * 解析 Markdown frontmatter
 */
function parseFrontmatter(content) {
    const frontmatterRegex = /^---\n([\s\S]*?)\n---\n/;
    const match = content.match(frontmatterRegex);

    if (!match) {
        return { frontmatter: {}, content };
    }

    const frontmatterStr = match[1];
    const frontmatter = {};

    frontmatterStr.split('\n').forEach(line => {
        const colonIndex = line.indexOf(':');
        if (colonIndex > 0) {
            const key = line.slice(0, colonIndex).trim();
            const value = line.slice(colonIndex + 1).trim().replace(/^["']|["']$/g, '');
            frontmatter[key] = value;
        }
    });

    return {
        frontmatter,
        content: content.slice(match[0].length)
    };
}

/**
 * 将 Markdown 转换为 Tiptap JSON
 */
function markdownToTiptap(markdown) {
    const lines = markdown.split('\n');
    const content = [];
    let i = 0;

    while (i < lines.length) {
        const line = lines[i];

        // 空行 -> 空段落
        if (line.trim() === '') {
            i++;
            continue;
        }

        // 标题
        const headingMatch = line.match(/^(#{1,6})\s+(.+)$/);
        if (headingMatch) {
            const level = headingMatch[1].length;
            content.push({
                type: 'heading',
                attrs: { level },
                content: [{ type: 'text', text: headingMatch[2] }]
            });
            i++;
            continue;
        }

        // 代码块
        if (line.startsWith('```')) {
            const language = line.slice(3).trim() || 'plaintext';
            const codeLines = [];
            i++;
            while (i < lines.length && !lines[i].startsWith('```')) {
                codeLines.push(lines[i]);
                i++;
            }
            content.push({
                type: 'codeBlock',
                attrs: { language },
                content: [{ type: 'text', text: codeLines.join('\n') }]
            });
            i++; // 跳过结束的 ```
            continue;
        }

        // 引用
        if (line.startsWith('> ')) {
            const quoteLines = [];
            while (i < lines.length && lines[i].startsWith('> ')) {
                quoteLines.push(lines[i].slice(2));
                i++;
            }
            content.push({
                type: 'blockquote',
                content: [{
                    type: 'paragraph',
                    content: [{ type: 'text', text: quoteLines.join('\n') }]
                }]
            });
            continue;
        }

        // 无序列表
        if (line.match(/^[-*+]\s+/)) {
            const listItems = [];
            while (i < lines.length && lines[i].match(/^[-*+]\s+/)) {
                const itemText = lines[i].replace(/^[-*+]\s+/, '');
                listItems.push({
                    type: 'listItem',
                    content: [{
                        type: 'paragraph',
                        content: parseInlineMarkdown(itemText)
                    }]
                });
                i++;
            }
            content.push({
                type: 'bulletList',
                content: listItems
            });
            continue;
        }

        // 有序列表
        if (line.match(/^\d+\.\s+/)) {
            const listItems = [];
            while (i < lines.length && lines[i].match(/^\d+\.\s+/)) {
                const itemText = lines[i].replace(/^\d+\.\s+/, '');
                listItems.push({
                    type: 'listItem',
                    content: [{
                        type: 'paragraph',
                        content: parseInlineMarkdown(itemText)
                    }]
                });
                i++;
            }
            content.push({
                type: 'orderedList',
                content: listItems
            });
            continue;
        }

        // 分割线
        if (line.match(/^[-*_]{3,}$/)) {
            content.push({ type: 'horizontalRule' });
            i++;
            continue;
        }

        // 普通段落
        content.push({
            type: 'paragraph',
            content: parseInlineMarkdown(line)
        });
        i++;
    }

    return {
        type: 'doc',
        content: content.length > 0 ? content : [{ type: 'paragraph' }]
    };
}

/**
 * 解析行内 Markdown 语法
 */
function parseInlineMarkdown(text) {
    if (!text || text.trim() === '') {
        return [];
    }

    const result = [];
    let remaining = text;

    // 简单实现：处理粗体、斜体、代码、链接
    const patterns = [
        { regex: /\*\*(.+?)\*\*/g, mark: 'bold' },
        { regex: /\*(.+?)\*/g, mark: 'italic' },
        { regex: /`(.+?)`/g, mark: 'code' },
        { regex: /~~(.+?)~~/g, mark: 'strike' },
    ];

    // 简化处理：直接返回纯文本
    // TODO: 实现完整的行内解析
    result.push({ type: 'text', text: text });

    return result;
}

/**
 * 将 Tiptap JSON 转换为 Markdown
 */
function tiptapToMarkdown(doc) {
    if (!doc || !doc.content) {
        return '';
    }

    return doc.content.map(node => nodeToMarkdown(node)).join('\n\n');
}

/**
 * 将单个节点转换为 Markdown
 */
function nodeToMarkdown(node) {
    switch (node.type) {
        case 'paragraph':
            return contentToText(node.content);

        case 'heading':
            const level = node.attrs?.level || 1;
            const hashes = '#'.repeat(level);
            return `${hashes} ${contentToText(node.content)}`;

        case 'bulletList':
            return node.content.map(item => {
                const itemContent = item.content?.[0];
                return `- ${contentToText(itemContent?.content)}`;
            }).join('\n');

        case 'orderedList':
            return node.content.map((item, index) => {
                const itemContent = item.content?.[0];
                return `${index + 1}. ${contentToText(itemContent?.content)}`;
            }).join('\n');

        case 'codeBlock':
            const lang = node.attrs?.language || '';
            const code = contentToText(node.content);
            return `\`\`\`${lang}\n${code}\n\`\`\``;

        case 'blockquote':
            const quoteContent = node.content?.map(n => nodeToMarkdown(n)).join('\n');
            return quoteContent.split('\n').map(line => `> ${line}`).join('\n');

        case 'horizontalRule':
            return '---';

        case 'image':
            const src = node.attrs?.src || '';
            const alt = node.attrs?.alt || '';
            return `![${alt}](${src})`;

        default:
            return contentToText(node.content);
    }
}

/**
 * 将内容数组转换为纯文本
 */
function contentToText(content) {
    if (!content) return '';

    return content.map(node => {
        if (node.type === 'text') {
            let text = node.text || '';

            // 应用标记
            if (node.marks) {
                node.marks.forEach(mark => {
                    switch (mark.type) {
                        case 'bold':
                            text = `**${text}**`;
                            break;
                        case 'italic':
                            text = `*${text}*`;
                            break;
                        case 'code':
                            text = `\`${text}\``;
                            break;
                        case 'strike':
                            text = `~~${text}~~`;
                            break;
                        case 'link':
                            text = `[${text}](${mark.attrs?.href || ''})`;
                            break;
                    }
                });
            }
            return text;
        }
        return '';
    }).join('');
}

/**
 * 将 Tiptap JSON 转换为 HTML
 */
function tiptapToHtml(doc) {
    if (!doc || !doc.content) {
        return '';
    }

    const bodyHtml = doc.content.map(node => nodeToHtml(node)).join('\n');

    return `<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Exported Note</title>
    <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 800px; margin: 0 auto; padding: 20px; line-height: 1.6; }
        pre { background: #f5f5f5; padding: 16px; border-radius: 4px; overflow-x: auto; }
        code { background: #f5f5f5; padding: 2px 6px; border-radius: 3px; }
        blockquote { border-left: 4px solid #ddd; margin: 0; padding-left: 16px; color: #666; }
        img { max-width: 100%; }
    </style>
</head>
<body>
${bodyHtml}
</body>
</html>`;
}

/**
 * 将单个节点转换为 HTML
 */
function nodeToHtml(node) {
    switch (node.type) {
        case 'paragraph':
            return `<p>${contentToHtml(node.content)}</p>`;

        case 'heading':
            const level = node.attrs?.level || 1;
            return `<h${level}>${contentToHtml(node.content)}</h${level}>`;

        case 'bulletList':
            const ulItems = node.content.map(item => {
                const itemContent = item.content?.[0];
                return `<li>${contentToHtml(itemContent?.content)}</li>`;
            }).join('\n');
            return `<ul>\n${ulItems}\n</ul>`;

        case 'orderedList':
            const olItems = node.content.map(item => {
                const itemContent = item.content?.[0];
                return `<li>${contentToHtml(itemContent?.content)}</li>`;
            }).join('\n');
            return `<ol>\n${olItems}\n</ol>`;

        case 'codeBlock':
            const lang = node.attrs?.language || '';
            const code = escapeHtml(contentToText(node.content));
            return `<pre><code class="language-${lang}">${code}</code></pre>`;

        case 'blockquote':
            const quoteHtml = node.content?.map(n => nodeToHtml(n)).join('\n');
            return `<blockquote>\n${quoteHtml}\n</blockquote>`;

        case 'horizontalRule':
            return '<hr>';

        case 'image':
            const src = node.attrs?.src || '';
            const alt = escapeHtml(node.attrs?.alt || '');
            return `<img src="${src}" alt="${alt}">`;

        default:
            return `<p>${contentToHtml(node.content)}</p>`;
    }
}

/**
 * 将内容数组转换为 HTML
 */
function contentToHtml(content) {
    if (!content) return '';

    return content.map(node => {
        if (node.type === 'text') {
            let text = escapeHtml(node.text || '');

            if (node.marks) {
                node.marks.forEach(mark => {
                    switch (mark.type) {
                        case 'bold':
                            text = `<strong>${text}</strong>`;
                            break;
                        case 'italic':
                            text = `<em>${text}</em>`;
                            break;
                        case 'code':
                            text = `<code>${text}</code>`;
                            break;
                        case 'strike':
                            text = `<del>${text}</del>`;
                            break;
                        case 'link':
                            text = `<a href="${escapeHtml(mark.attrs?.href || '')}">${text}</a>`;
                            break;
                        case 'highlight':
                            text = `<mark>${text}</mark>`;
                            break;
                    }
                });
            }
            return text;
        }
        return '';
    }).join('');
}

/**
 * HTML 转义
 */
function escapeHtml(text) {
    return text
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;');
}

/**
 * 从 HTML 提取文本内容并转换为 Tiptap
 */
function htmlToTiptap(html) {
    // 简单实现：提取 body 内容，转为纯文本后处理
    const bodyMatch = html.match(/<body[^>]*>([\s\S]*?)<\/body>/i);
    const bodyContent = bodyMatch ? bodyMatch[1] : html;

    // 移除 HTML 标签，保留基本结构
    let text = bodyContent
        .replace(/<h([1-6])[^>]*>(.*?)<\/h[1-6]>/gi, (_, level, content) => `${'#'.repeat(parseInt(level))} ${stripTags(content)}\n\n`)
        .replace(/<p[^>]*>(.*?)<\/p>/gi, (_, content) => `${stripTags(content)}\n\n`)
        .replace(/<li[^>]*>(.*?)<\/li>/gi, (_, content) => `- ${stripTags(content)}\n`)
        .replace(/<br\s*\/?>/gi, '\n')
        .replace(/<[^>]+>/g, '')
        .replace(/&nbsp;/g, ' ')
        .replace(/&lt;/g, '<')
        .replace(/&gt;/g, '>')
        .replace(/&amp;/g, '&')
        .replace(/&quot;/g, '"')
        .trim();

    return markdownToTiptap(text);
}

/**
 * 移除 HTML 标签
 */
function stripTags(html) {
    return html.replace(/<[^>]+>/g, '');
}

/**
 * 清理文件名中的非法字符
 */
function sanitizeFilename(name) {
    return name
        .replace(/[\/\\:*?"<>|]/g, '_')  // 替换非法字符
        .replace(/\s+/g, ' ')             // 多个空格合并为一个
        .trim()
        .slice(0, 100);                   // 限制长度
}

/**
 * 初始化 IPC 处理器
 */
function init() {
    // 导入 Markdown 文件
    ipcMain.handle('import-markdown', async (event, options = {}) => {
        try {
            const result = await dialog.showOpenDialog({
                title: '选择 Markdown 文件',
                filters: [{ name: 'Markdown', extensions: ['md', 'markdown'] }],
                properties: options.multiple ? ['openFile', 'multiSelections'] : ['openFile']
            });

            if (result.canceled || result.filePaths.length === 0) {
                return { success: false, canceled: true };
            }

            const setting = getCurSettingConfig();
            const notebookPath = setting.notebookPath;
            const suffix = setting.notebookSuffix || '.md';

            const imported = [];

            for (const filePath of result.filePaths) {
                const content = fs.readFileSync(filePath, 'utf-8');
                const { frontmatter, content: mdContent } = parseFrontmatter(content);

                const title = frontmatter.title || path.basename(filePath, path.extname(filePath));
                const noteId = String(Date.now() + imported.length);
                const tiptapDoc = markdownToTiptap(mdContent);

                // 保存文件
                const notePath = path.join(notebookPath, noteId + suffix);
                fs.writeFileSync(notePath, JSON.stringify(tiptapDoc));

                // 保存到数据库
                dbManager.saveNote({
                    id: noteId,
                    title,
                    path: notePath,
                    contentText: mdContent.slice(0, 1000),
                    isJournal: false
                });

                imported.push({ id: noteId, title, path: notePath });
            }

            return { success: true, imported };
        } catch (error) {
            console.error('[ImportExport] Import markdown failed:', error);
            return { success: false, error: error.message };
        }
    });

    // 导入文件夹
    ipcMain.handle('import-folder', async (event) => {
        try {
            const result = await dialog.showOpenDialog({
                title: '选择包含 Markdown 文件的文件夹',
                properties: ['openDirectory']
            });

            if (result.canceled || result.filePaths.length === 0) {
                return { success: false, canceled: true };
            }

            const folderPath = result.filePaths[0];
            const setting = getCurSettingConfig();
            const notebookPath = setting.notebookPath;
            const suffix = setting.notebookSuffix || '.md';

            const imported = [];

            // 递归查找所有 md 文件
            function findMdFiles(dir) {
                const files = [];
                const entries = fs.readdirSync(dir, { withFileTypes: true });

                for (const entry of entries) {
                    const fullPath = path.join(dir, entry.name);
                    if (entry.isDirectory()) {
                        files.push(...findMdFiles(fullPath));
                    } else if (entry.isFile() && /\.(md|markdown)$/i.test(entry.name)) {
                        files.push(fullPath);
                    }
                }
                return files;
            }

            const mdFiles = findMdFiles(folderPath);

            for (const filePath of mdFiles) {
                const content = fs.readFileSync(filePath, 'utf-8');
                const { frontmatter, content: mdContent } = parseFrontmatter(content);

                const title = frontmatter.title || path.basename(filePath, path.extname(filePath));
                const noteId = String(Date.now() + imported.length);
                const tiptapDoc = markdownToTiptap(mdContent);

                const notePath = path.join(notebookPath, noteId + suffix);
                fs.writeFileSync(notePath, JSON.stringify(tiptapDoc));

                dbManager.saveNote({
                    id: noteId,
                    title,
                    path: notePath,
                    contentText: mdContent.slice(0, 1000),
                    isJournal: false
                });

                imported.push({ id: noteId, title, path: notePath });
            }

            return { success: true, imported, total: mdFiles.length };
        } catch (error) {
            console.error('[ImportExport] Import folder failed:', error);
            return { success: false, error: error.message };
        }
    });

    // 导出为 Markdown
    ipcMain.handle('export-markdown', async (event, noteId) => {
        try {
            const result = await dialog.showSaveDialog({
                title: '导出为 Markdown',
                defaultPath: `${noteId}.md`,
                filters: [{ name: 'Markdown', extensions: ['md'] }]
            });

            if (result.canceled) {
                return { success: false, canceled: true };
            }

            const setting = getCurSettingConfig();
            const notebookPath = setting.notebookPath;
            const suffix = setting.notebookSuffix || '.md';

            const notePath = path.join(notebookPath, noteId + suffix);
            const content = fs.readFileSync(notePath, 'utf-8');
            const doc = JSON.parse(content);

            const markdown = tiptapToMarkdown(doc);
            fs.writeFileSync(result.filePath, markdown);

            return { success: true, path: result.filePath };
        } catch (error) {
            console.error('[ImportExport] Export markdown failed:', error);
            return { success: false, error: error.message };
        }
    });

    // 导出为 HTML
    ipcMain.handle('export-html', async (event, noteId) => {
        try {
            const result = await dialog.showSaveDialog({
                title: '导出为 HTML',
                defaultPath: `${noteId}.html`,
                filters: [{ name: 'HTML', extensions: ['html'] }]
            });

            if (result.canceled) {
                return { success: false, canceled: true };
            }

            const setting = getCurSettingConfig();
            const notebookPath = setting.notebookPath;
            const suffix = setting.notebookSuffix || '.md';

            const notePath = path.join(notebookPath, noteId + suffix);
            const content = fs.readFileSync(notePath, 'utf-8');
            const doc = JSON.parse(content);

            const html = tiptapToHtml(doc);
            fs.writeFileSync(result.filePath, html);

            return { success: true, path: result.filePath };
        } catch (error) {
            console.error('[ImportExport] Export html failed:', error);
            return { success: false, error: error.message };
        }
    });

    // 批量导出所有笔记
    ipcMain.handle('export-all', async (event, format = 'markdown') => {
        try {
            const result = await dialog.showOpenDialog({
                title: '选择导出目录',
                properties: ['openDirectory', 'createDirectory']
            });

            if (result.canceled || result.filePaths.length === 0) {
                return { success: false, canceled: true };
            }

            const exportDir = result.filePaths[0];
            const setting = getCurSettingConfig();
            const notebookPath = setting.notebookPath;
            const suffix = setting.notebookSuffix || '.md';

            // 创建子目录
            const notesDir = path.join(exportDir, 'notes');
            const journalsDir = path.join(exportDir, 'journals');
            fs.mkdirSync(notesDir, { recursive: true });
            fs.mkdirSync(journalsDir, { recursive: true });

            const notes = dbManager.getAllNotes();
            const journals = dbManager.getJournals(1000, 0);

            const exported = [];
            const ext = format === 'html' ? '.html' : '.md';

            // 导出普通笔记（跳过日记，日记会单独导出）
            for (const note of notes) {
                try {
                    // 跳过日记（日记路径包含 journals/）
                    if (note.path && note.path.includes('journals')) continue;

                    const notePath = path.join(notebookPath, note.id + suffix);
                    if (!fs.existsSync(notePath)) continue;

                    const content = fs.readFileSync(notePath, 'utf-8');
                    const doc = JSON.parse(content);

                    const output = format === 'html' ? tiptapToHtml(doc) : tiptapToMarkdown(doc);
                    const filename = sanitizeFilename(note.title || note.id);
                    const exportPath = path.join(notesDir, filename + ext);
                    fs.writeFileSync(exportPath, output);
                    exported.push(exportPath);
                } catch (e) {
                    console.error(`[ImportExport] Failed to export note ${note.id}:`, e);
                }
            }

            // 导出日记
            for (const journal of journals) {
                try {
                    const journalPath = path.join(notebookPath, 'journals', journal.id + suffix);
                    if (!fs.existsSync(journalPath)) continue;

                    const content = fs.readFileSync(journalPath, 'utf-8');
                    const doc = JSON.parse(content);

                    const output = format === 'html' ? tiptapToHtml(doc) : tiptapToMarkdown(doc);
                    const exportPath = path.join(journalsDir, journal.journalDate + ext);
                    fs.writeFileSync(exportPath, output);
                    exported.push(exportPath);
                } catch (e) {
                    console.error(`[ImportExport] Failed to export journal ${journal.id}:`, e);
                }
            }

            return { success: true, exported, total: exported.length, directory: exportDir };
        } catch (error) {
            console.error('[ImportExport] Export all failed:', error);
            return { success: false, error: error.message };
        }
    });

    console.log('[ImportExport] IPC handlers initialized');
}

module.exports = {
    init,
    markdownToTiptap,
    tiptapToMarkdown,
    tiptapToHtml,
    htmlToTiptap,
    parseFrontmatter
};
