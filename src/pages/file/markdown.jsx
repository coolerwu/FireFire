import './markdown.less'
import {EditorContent, useEditor} from '@tiptap/react';
import React from 'react';
import MenuBar from "./menuBar";
import {Divider, message} from "antd";
import Bubble from "./bubble";
import {persist} from "../../utils/cwjsonFileOp";
import plugins from "../../common/extensions";

const Markdown = ({cwjson}) => {
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
                            // console.log(item.getAsFile());
                            // const reader = new FileReader();
                            // reader.readAsBinaryString(item.getAsFile());
                            // reader.onload = function (e) {
                            //     window.electronAPI.writePicInNotebookDir(cwjson.id, `${uuid()}.png`, e.target.result).then(srcUrl => {
                            //         console.log(srcUrl);
                            //         const node = view.state.schema.nodes.image.create({src: `file://${srcUrl}`});
                            //         const transaction = view.state.tr.replaceSelectionWith(node);
                            //         view.dispatch(transaction);
                            //     })
                            // }

                            const file = item.getAsFile();
                            if (!file.path) {
                                message.error('暂不支持截图');
                                return false;
                            }

                            window.electronAPI.copyToNotebookDir(cwjson.id, file.path).then(srcUrl => {
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
            window.electronAPI.readNotebookFile(cwjson.filename).then(content => {
                editor.commands.setContent(content ? JSON.parse(content) : null);
            })
        },
    }, [cwjson]);

    return (
        <>
            {editor && <Bubble editor={editor} persist={persist}/>}
            <div className={'markdown'}>
                <MenuBar editor={editor}/>
                <Divider/>
                <EditorContent editor={editor}/>
                <Divider/>
                <div className={'footer'}>
                    总字数：{editor?.storage?.characterCount?.words?.() || '-'}
                </div>
            </div>
        </>
    );
}

export default Markdown;