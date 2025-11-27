import React, { useContext, useState, useRef, useEffect } from 'react';
import { EditorContent, useEditor } from '@tiptap/react';
import { message, Button } from 'antd';
import { ArrowLeftOutlined } from '@ant-design/icons';
import MenuBar from '../file/menuBar';
import Bubble from '../file/bubble';
import { copyAttachment, copyAttachmentByBase64, persist } from '../../utils/cwjsonFileOp';
import plugins from '../../common/extensions';
import { Context } from '../../index';
import { electronAPI } from '../../utils/electronAPI';
import { logger } from '../../utils/logger';
import '../file/markdown.less';

/**
 * 独立笔记编辑器视图
 * 用于新建笔记时显示独立的编辑页面
 */
const NoteEditorView = ({ note, onBack }) => {
    useContext(Context);

    // 标题状态
    const [title, setTitle] = useState('');
    const [isEditingTitle, setIsEditingTitle] = useState(false);
    const titleInputRef = useRef(null);
    const originalTitleRef = useRef('');

    // 内容状态
    const [content, setContent] = useState('');
    const [isLoading, setIsLoading] = useState(true);

    // 加载笔记内容
    useEffect(() => {
        const loadContent = async () => {
            if (!note?.id) return;

            setIsLoading(true);
            try {
                const jsonContent = await electronAPI.readNotebookFile(note.id);
                setContent(jsonContent);
                setTitle(note.id);
                originalTitleRef.current = note.id;
            } catch (error) {
                logger.error('[NoteEditorView] 读取笔记失败:', error);
                // 新笔记，使用空内容
                setContent(JSON.stringify({ type: 'doc', content: [{ type: 'paragraph' }] }));
                setTitle(note.id);
                originalTitleRef.current = note.id;
            } finally {
                setIsLoading(false);
            }
        };

        loadContent();
    }, [note?.id]);

    // 聚焦标题输入框
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
            const success = await electronAPI.renameNotebookFile(originalTitleRef.current, newTitle);

            if (success) {
                message.success('重命名成功');
                originalTitleRef.current = newTitle;
                note.id = newTitle;
            } else {
                message.error('重命名失败，文件可能已存在');
                setTitle(originalTitleRef.current);
            }
        } catch (error) {
            logger.error('[NoteEditorView] 重命名失败:', error);
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

    // 初始化编辑器
    const editor = useEditor({
        extensions: plugins,
        content: '',
        onUpdate: ({ editor }) => {
            if (note) {
                persist(editor, note);
            }
        },
        editorProps: {
            handlePaste: (view, event, slice) => {
                if (event?.clipboardData?.items) {
                    const items = event.clipboardData.items;
                    for (let i = 0; i < items.length; i++) {
                        const item = items[i];
                        if (item.kind === 'file' && item.type.startsWith('image')) {
                            const file = item.getAsFile();
                            const fileReader = new FileReader();
                            fileReader.readAsDataURL(file);
                            fileReader.onload = (e) => {
                                copyAttachmentByBase64(e.target.result, note?.attachmentPath)
                                    .then(attachmentPath => {
                                        if (editor && attachmentPath) {
                                            editor.commands.setImage({ src: `file://${attachmentPath}` });
                                        }
                                    })
                                    .catch(err => logger.error('[NoteEditorView] 粘贴图片失败:', err));
                            };
                            return true;
                        }
                    }
                }
                return false;
            },
            handleDrop: (view, event, slice, moved) => {
                if (!moved && event.dataTransfer?.files?.length) {
                    const files = event.dataTransfer.files;
                    for (let i = 0; i < files.length; i++) {
                        const file = files[i];
                        if (file.type.startsWith('image')) {
                            copyAttachment(file.path, note?.attachmentPath)
                                .then(attachmentPath => {
                                    if (editor && attachmentPath) {
                                        editor.commands.setImage({ src: `file://${attachmentPath}` });
                                    }
                                })
                                .catch(err => logger.error('[NoteEditorView] 拖放图片失败:', err));
                            return true;
                        }
                    }
                }
                return false;
            },
        },
    }, []);

    // 更新编辑器内容
    useEffect(() => {
        if (editor && content && !isLoading) {
            try {
                const parsed = JSON.parse(content);
                editor.commands.setContent(parsed);
            } catch (error) {
                logger.error('[NoteEditorView] 解析内容失败:', error);
            }
        }
    }, [editor, content, isLoading]);

    if (isLoading) {
        return (
            <div className="h-full flex items-center justify-center">
                <div className="text-notion-text-tertiary">加载中...</div>
            </div>
        );
    }

    return (
        <div className="h-full flex flex-col bg-notion-bg-primary dark:bg-notion-dark-bg-primary">
            {/* 顶部工具栏 */}
            <div className="flex-shrink-0 border-b border-notion-border dark:border-notion-dark-border">
                <div className="flex items-center gap-4 px-6 py-3">
                    <Button
                        type="text"
                        icon={<ArrowLeftOutlined />}
                        onClick={onBack}
                        className="text-notion-text-secondary hover:text-notion-text-primary"
                    >
                        返回
                    </Button>

                    {/* 可编辑标题 */}
                    <div className="flex-1">
                        {isEditingTitle ? (
                            <input
                                ref={titleInputRef}
                                type="text"
                                value={title}
                                onChange={(e) => setTitle(e.target.value)}
                                onBlur={handleTitleSave}
                                onKeyDown={handleTitleKeyDown}
                                className="
                                    w-full px-2 py-1 text-xl font-semibold
                                    bg-transparent border-b-2 border-notion-accent-blue
                                    text-notion-text-primary dark:text-notion-dark-text-primary
                                    outline-none
                                "
                            />
                        ) : (
                            <h1
                                onClick={() => setIsEditingTitle(true)}
                                className="
                                    text-xl font-semibold cursor-pointer
                                    text-notion-text-primary dark:text-notion-dark-text-primary
                                    hover:text-notion-accent-blue
                                    transition-colors
                                "
                                title="点击编辑标题"
                            >
                                {title || '无标题'}
                            </h1>
                        )}
                    </div>
                </div>

                {/* 编辑器菜单栏 */}
                {editor && <MenuBar editor={editor} />}
            </div>

            {/* 编辑器内容区 */}
            <div className="flex-1 overflow-auto">
                <div className="max-w-4xl mx-auto px-6 py-8">
                    {editor && <Bubble editor={editor} />}
                    <EditorContent editor={editor} className="prose prose-notion dark:prose-invert max-w-none" />
                </div>
            </div>
        </div>
    );
};

export default NoteEditorView;
