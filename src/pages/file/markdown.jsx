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

const Markdown = ({cwjson}) => {
    //上下文
    const {curDir, theme, setting} = useContext(Context);

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
                                copyAttachmentByBase64(cwjson, base64).then(srcUrl => {
                                    if (!srcUrl) {
                                        message.error("附件复制异常")
                                        return;
                                    }

                                    const node = view.state.schema.nodes.image.create({src: `file://${srcUrl}`});
                                    const transaction = view.state.tr.replaceSelectionWith(node);
                                    view.dispatch(transaction);
                                });
                            }

                            if (!file.path) {
                                return false;
                            }

                            copyAttachment(cwjson, file.path).then(srcUrl => {
                                if (!srcUrl) {
                                    message.error("附件复制异常")
                                    return;
                                }

                                const node = view.state.schema.nodes.image.create({src: `file://${srcUrl}`});
                                const transaction = view.state.tr.replaceSelectionWith(node);
                                view.dispatch(transaction);
                            });
                        }
                    }
                }
            }
        },
        extensions: plugins,
        autofocus: 'start',
        onBeforeCreate: ({editor}) => {
            electronAPI.readNotebookFile(`${curDir}/${cwjson.filename}`).then(content => {
                editor.commands.setContent(content ? JSON.parse(content) : null);
            })
        },
    }, [cwjson]);

    return (
        <>
            {editor && <Bubble editor={editor} persist={persist}/>}
            <div className={'markdown'} style={{
                '--fg': theme?.fontColor || '#222',
                '--bg': theme?.backgroundColor || '#fff',
                '--muted': theme?.fontColor === 'white' ? '#aaa' : '#666',
                '--border': theme?.fontColor === 'white' ? '#3a3a3a' : '#e5e5e5',
                '--accent': (theme?.token?.colorPrimary || theme?.fontLinkColor || '#4a8cff'),
                '--radius': '8px',
                '--doc-width': '800px',
                '--bubble-bg': (setting?.themeSource === 'dark' ? 'rgba(255,255,255,0.12)' : 'rgba(0,0,0,0.85)'),
                '--bubble-fg': '#fff',
            }}>
                <MenuBar editor={editor}/>
                <EditorContent editor={editor}/>
            </div>
        </>
    );
}

export default Markdown;