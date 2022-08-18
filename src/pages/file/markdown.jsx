import './markdown.less'
import {BubbleMenu, EditorContent, ReactNodeViewRenderer, useEditor} from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import React from 'react';
import MenuBar from "./menuBar";
import {Divider} from "antd";
import {CharacterCount} from "@tiptap/extension-character-count";
import {FloatingMenu} from "@tiptap/extension-floating-menu";
import {Image} from "@tiptap/extension-image";
import Table from '@tiptap/extension-table';
import TableCell from '@tiptap/extension-table-cell';
import TableHeader from '@tiptap/extension-table-header';
import TextAlign from '@tiptap/extension-text-align';
import TableRow from '@tiptap/extension-table-row';
import CodeBlockLowlight from '@tiptap/extension-code-block-lowlight';
import {lowlight} from 'lowlight';
import CodeBlockComponent from '../../common/CodeBlockComponent';
import Dropcursor from '@tiptap/extension-dropcursor';
import Highlight from '@tiptap/extension-highlight';
import Typography from '@tiptap/extension-typography';
import BiliBiliNode from "../../common/Node/BiliBiliNode";
import {NodeSelection} from "prosemirror-state";

const CustomTableCell = TableCell.extend({
    addAttributes() {
        return {
            // extend the existing attributes …
            ...this.parent?.(),

            // and add a new one …
            backgroundColor: {
                default: null,
                parseHTML: element => element.getAttribute('data-background-color'),
                renderHTML: attributes => {
                    return {
                        'data-background-color': attributes.backgroundColor,
                        style: `background-color: ${attributes.backgroundColor}`,
                    }
                },
            },
        }
    },
});

const Markdown = ({cwjson}) => {
    const persist = (editor) => {
        window.electronAPI.writeNotebookFile(cwjson.filename, JSON.stringify(editor.getJSON()));
    }

    const editor = useEditor({
        onUpdate: ({editor}) => {
            // console.log(editor.view.state.doc);
            persist(editor);
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
                                // message.error('暂不支持截图');
                                console.log(file.path);
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
        extensions: [
            StarterKit,
            CharacterCount,
            FloatingMenu.configure({
                shouldShow: () => false,
            }),
            Image.configure({
                inline: true,
                // allowBase64: true,
            }),
            Highlight.configure({
                multicolor: true
            }),
            Dropcursor,
            CodeBlockLowlight
                .extend({
                    addNodeView() {
                        return ReactNodeViewRenderer(CodeBlockComponent)
                    },
                })
                .configure({lowlight}),
            Table.configure({
                resizable: true,
            }),
            Typography,
            TableRow,
            TableHeader,
            CustomTableCell,
            TextAlign.configure({
                types: ['heading', 'paragraph'],
            }),
            BiliBiliNode,
        ],
        autofocus: 'start',
        onBeforeCreate: ({editor}) => {
            window.electronAPI.readNotebookFile(cwjson.filename).then(content => {
                editor.commands.setContent(content ? JSON.parse(content) : null);
            })
        },
    }, [cwjson]);

    return (
        <>
            {editor && <BubbleMenu className="bubble-menu" tippyOptions={{ duration: 100 }} editor={editor}>
                <button onClick={() => editor.chain().focus().toggleHighlight().run()} className={editor.isActive('highlight') ? 'is-active' : ''}>
                    高亮
                </button>
                <button onClick={() => {
                    const tr = editor.state.tr;
                    const selection = editor.state.selection
                    if (!(selection instanceof NodeSelection)) {
                        return
                    }
                    console.log(selection);
                    editor.state.selection.replace(tr);
                    const newState = editor.view.state.apply(tr);
                    editor.view.updateState(newState);
                    editor.commands.setContent(' ');
                    persist(editor);
                    // editor.get
                }}>
                    删除
                </button>
                {/*<button onClick={() => editor.chain().focus().setTextAlign('left').run()} className={editor.isActive({ textAlign: 'left' }) ? 'is-active' : ''}>*/}
                {/*    left*/}
                {/*</button>*/}
                {/*<button onClick={() => editor.chain().focus().setTextAlign('center').run()} className={editor.isActive({ textAlign: 'center' }) ? 'is-active' : ''}>*/}
                {/*    center*/}
                {/*</button>*/}
                {/*<button onClick={() => editor.chain().focus().setTextAlign('right').run()} className={editor.isActive({ textAlign: 'right' }) ? 'is-active' : ''}>*/}
                {/*    right*/}
                {/*</button>*/}
                {/*<button onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()} className={editor.isActive('heading', { level: 1 }) ? 'is-active' : ''}>*/}
                {/*    h1*/}
                {/*</button>*/}
                {/*<button onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()} className={editor.isActive('heading', { level: 2 }) ? 'is-active' : ''}>*/}
                {/*    h2*/}
                {/*</button>*/}
                {/*<button onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()} className={editor.isActive('heading', { level: 3 }) ? 'is-active' : ''}>*/}
                {/*    h3*/}
                {/*</button>*/}
            </BubbleMenu>}
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