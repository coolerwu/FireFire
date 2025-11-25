import './markdown.less'
import {EditorContent, useEditor} from '@tiptap/react';
import React, {useContext} from 'react';
import MenuBar from "./menuBar";
import {message} from "antd";
import Bubble from "./bubble";
import {copyAttachment, copyAttachmentByBase64, persist} from "../../utils/cwjsonFileOp";
import plugins from "../../common/extensions";
import {Context} from "../../index";
import {electronAPI} from "../../utils/electronAPI";
import {handleAPIError} from "../../utils/errorHandler";
import {logger} from "../../utils/logger";

const Markdown = ({cwjson}) => {
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
                <MenuBar editor={editor}/>
                <EditorContent editor={editor}/>
            </div>
        </div>
    );
}

export default Markdown;
