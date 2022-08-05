import './index.less'
import {EditorContent, useEditor} from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import React, {useRef} from 'react';
import MenuBar from "./menuBar";
import {Divider, Input, message} from "antd";
import {SUCCESS} from "../../common/global";
import AddTag from "../tagList/addTag";

const Markdown = ({file, fileContent, needLoad}) => {
    const titleRef = useRef(null);
    
    const updateFileContentFunc = (editor) => {
        const json = editor.getJSON();
        window.electronAPI.opFile(3, file.value, JSON.stringify(json));
    }

    const editor = useEditor({
        onUpdate: ({editor}) => {
            updateFileContentFunc(editor);
        },
        extensions: [
            StarterKit,
            // Paragraph.configure({
            //     // HTMLAttributes: {
            //     //     style: 'margin: 100px',
            //     // }
            // })
        ],
        content: fileContent ? JSON.parse(fileContent) : null,
        autofocus: 'start',
    });

    const modifyFileNameFunc = (event) => {
        if (event && (!event.keyCode || event.keyCode === 13)) {
            window.electronAPI.opFile(4, file.value, event.target.value).then(res => {
                if (SUCCESS === res) {
                    message.success('保存成功');
                    needLoad && needLoad(event.target.value);
                }
            });
        }
    }

    return (
        <>
            <div className={'markdown'}>
                <Input ref={titleRef} bordered={false} className={'title'} defaultValue={file.name}
                       onBlur={modifyFileNameFunc} onKeyDown={modifyFileNameFunc}/>
                <Divider/>
                <MenuBar editor={editor}/>
                <Divider/>
                <EditorContent editor={editor}/>
                <Divider/>
                <AddTag/>
            </div>
        </>
    );
}

export default Markdown;