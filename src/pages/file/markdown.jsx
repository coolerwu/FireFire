import './markdown.less'
import {EditorContent, useEditor} from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import React from 'react';
import MenuBar from "./menuBar";
import {Divider} from "antd";

const Markdown = ({cwjson}) => {
    const editor = useEditor({
        onUpdate: ({editor}) => {
            window.electronAPI.writeNotebookFile(cwjson.filename, JSON.stringify(editor.getJSON()));
        },
        extensions: [
            StarterKit,
            // Paragraph.configure({
            //     // HTMLAttributes: {
            //     //     style: 'margin: 100px',
            //     // }
            // })
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
            <div className={'markdown'}>
                <MenuBar editor={editor}/>
                <Divider/>
                <EditorContent editor={editor}/>
            </div>
        </>
    );
}

export default Markdown;