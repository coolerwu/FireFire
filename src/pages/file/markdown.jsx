import './markdown.less'
import {EditorContent, useEditor} from '@tiptap/react';
import React, {useContext, useState, useRef, useEffect, useCallback} from 'react';
import MenuBar from "./menuBar";
import {message} from "antd";
import Bubble from "./bubble";
import {copyAttachment, copyAttachmentByBase64, persist} from "../../utils/cwjsonFileOp";
import plugins from "../../common/extensions";
import {Context} from "../../index";
import {electronAPI} from "../../utils/electronAPI";
import {handleAPIError} from "../../utils/errorHandler";
import {logger} from "../../utils/logger";
import VersionHistory from "../../components/VersionHistory";

const Markdown = ({cwjson}) => {
    // 标题状态 - 从文件名中提取（去掉后缀）
    const [title, setTitle] = useState('');
    const [isEditingTitle, setIsEditingTitle] = useState(false);
    const titleInputRef = useRef(null);
    const originalTitleRef = useRef('');

    // 版本历史状态
    const [versionHistoryVisible, setVersionHistoryVisible] = useState(false);

    // 初始化标题
    useEffect(() => {
        if (cwjson?.id) {
            setTitle(cwjson.id);
            originalTitleRef.current = cwjson.id;
        }
    }, [cwjson?.id]);

    // 聚焦到标题输入框
    useEffect(() => {
        if (isEditingTitle && titleInputRef.current) {
            titleInputRef.current.focus();
            titleInputRef.current.select();
        }
    }, [isEditingTitle]);

    // 保存标题（重命名文件）
    const handleTitleSave = async () => {
        setIsEditingTitle(false);
        const newTitle = title.trim();

        if (!newTitle || newTitle === originalTitleRef.current) {
            setTitle(originalTitleRef.current);
            return;
        }

        try {
            // 构建旧路径和新路径
            const oldPath = cwjson.id;
            const newPath = newTitle;

            const success = await electronAPI.renameNotebookFile(oldPath, newPath);

            if (success) {
                message.success('重命名成功');
                originalTitleRef.current = newTitle;
                // 更新 cwjson 对象
                cwjson.id = newTitle;
                cwjson.filename = newTitle + (cwjson.filename.substring(cwjson.filename.lastIndexOf('.')));
            } else {
                message.error('重命名失败，文件可能已存在');
                setTitle(originalTitleRef.current);
            }
        } catch (error) {
            logger.error('[Markdown] 重命名失败:', error);
            message.error('重命名失败');
            setTitle(originalTitleRef.current);
        }
    };

    // 处理标题输入框按键
    const handleTitleKeyDown = (e) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            handleTitleSave();
        } else if (e.key === 'Escape') {
            setTitle(originalTitleRef.current);
            setIsEditingTitle(false);
        }
    };
    //上下文
    const {curDir, setting} = useContext(Context);

    //初始化编辑器
    const editor = useEditor({
        onUpdate: ({editor}) => {
            persist(editor, cwjson);
        },
        editorProps: {
            handlePaste: (view, event, slice) => {
                //支持拷贝图片
                if (event?.clipboardData?.items) {
                    const items = event.clipboardData.items;
                    for (let i = 0; i < items.length; i++) {
                        const item = items[i];
                        if (item.kind === 'file' && item.type.startsWith('image')) {
                            const file = item.getAsFile();
                            const fileReader = new FileReader();
                            fileReader.readAsDataURL(file);
                            fileReader.onload = (e) => {
                                const base64 = e.target.result;
                                copyAttachmentByBase64(cwjson, base64)
                                    .then(srcUrl => {
                                        if (!srcUrl) {
                                            message.error("附件复制异常");
                                            return;
                                        }

                                        const node = view.state.schema.nodes.image.create({src: `file://${srcUrl}`});
                                        const transaction = view.state.tr.replaceSelectionWith(node);
                                        view.dispatch(transaction);
                                    })
                                    .catch(err => handleAPIError(err, 'copyAttachmentByBase64'));
                            }

                            if (!file.path) {
                                return false;
                            }

                            copyAttachment(cwjson, file.path)
                                .then(srcUrl => {
                                    if (!srcUrl) {
                                        message.error("附件复制异常");
                                        return;
                                    }

                                    const node = view.state.schema.nodes.image.create({src: `file://${srcUrl}`});
                                    const transaction = view.state.tr.replaceSelectionWith(node);
                                    view.dispatch(transaction);
                                })
                                .catch(err => handleAPIError(err, 'copyAttachment'));
                        }
                    }
                }
            }
        },
        extensions: plugins,
        autofocus: 'start',
        onBeforeCreate: ({editor}) => {
            electronAPI.readNotebookFile(`${curDir}/${cwjson.filename}`)
                .then(content => {
                    try {
                        editor.commands.setContent(content ? JSON.parse(content) : null);
                    } catch (parseError) {
                        logger.error('[Markdown] 解析内容失败:', parseError);
                        editor.commands.setContent(null);
                    }
                })
                .catch(err => {
                    handleAPIError(err, 'readNotebookFile');
                    editor.commands.setContent(null);
                });
        },
    }, [cwjson]);

    const isDark = setting?.themeSource === 'dark';

    // 恢复版本
    const handleVersionRestore = useCallback((content) => {
        if (editor && content) {
            try {
                const parsed = JSON.parse(content);
                editor.commands.setContent(parsed);
            } catch (err) {
                logger.error('[Markdown] 恢复版本失败:', err);
                message.error('恢复版本失败');
            }
        }
    }, [editor]);

    return (
        <div className="h-full flex flex-col bg-notion-bg-primary dark:bg-notion-dark-bg-primary">
            {editor && <Bubble editor={editor} persist={persist}/>}
            <div
                className="markdown flex-1 overflow-y-auto"
                style={{
                    '--fg': isDark ? '#e3e2e0' : '#37352f',
                    '--bg': isDark ? '#191919' : '#ffffff',
                    '--muted': isDark ? '#9b9a97' : '#787774',
                    '--border': isDark ? 'rgba(255,255,255,0.094)' : 'rgba(55,53,47,0.09)',
                    '--accent': '#0f7b6c',
                    '--radius': '6px',
                    '--doc-width': '700px',
                    '--bubble-bg': isDark ? 'rgba(255,255,255,0.12)' : 'rgba(55,53,47,0.9)',
                    '--bubble-fg': '#fff',
                }}
            >
                <MenuBar
                    editor={editor}
                    onShowVersionHistory={() => setVersionHistoryVisible(true)}
                />
                {/* 可编辑标题 */}
                <div className="max-w-[var(--doc-width)] mx-auto px-4 pt-8 pb-2">
                    {isEditingTitle ? (
                        <input
                            ref={titleInputRef}
                            type="text"
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            onBlur={handleTitleSave}
                            onKeyDown={handleTitleKeyDown}
                            className="
                                w-full text-3xl font-bold
                                bg-transparent border-none outline-none
                                text-notion-text-primary dark:text-notion-dark-text-primary
                                placeholder-notion-text-tertiary dark:placeholder-notion-dark-text-tertiary
                            "
                            placeholder="输入标题..."
                        />
                    ) : (
                        <h1
                            onClick={() => setIsEditingTitle(true)}
                            className="
                                text-3xl font-bold cursor-text
                                text-notion-text-primary dark:text-notion-dark-text-primary
                                hover:bg-notion-bg-hover dark:hover:bg-notion-dark-bg-hover
                                px-1 -mx-1 py-0.5 rounded
                                transition-colors duration-fast
                            "
                            title="点击编辑标题（会重命名文件）"
                        >
                            {title || '未命名'}
                        </h1>
                    )}
                </div>
                <EditorContent editor={editor}/>
            </div>

            {/* 版本历史面板 */}
            <VersionHistory
                noteId={cwjson?.id}
                visible={versionHistoryVisible}
                onClose={() => setVersionHistoryVisible(false)}
                onRestore={handleVersionRestore}
                editor={editor}
            />
        </div>
    );
}

export default Markdown;
