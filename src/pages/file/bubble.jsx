import {Button, Tooltip} from "antd";
import {
    AlignCenterOutlined,
    AlignLeftOutlined,
    AlignRightOutlined,
    DeleteOutlined,
    HighlightOutlined,
    StrikethroughOutlined, UnderlineOutlined
} from "@ant-design/icons";
import {NodeSelection, TextSelection} from "prosemirror-state";
import {BubbleMenu} from "@tiptap/react";
import React, {useEffect, useState} from "react";

/**
 * @param editor 编辑器
 * @param persist 持久化操作
 */
const Bubble = ({editor, persist}) => {
    //是否展示文本
    const [showText, setShowText] = useState(false);
    //是否展示BiliBili
    const [showDelete, setShowDelete] = useState(false);

    useEffect(() => {
        if (!editor?.state?.selection) {
            setShowText(false);
            setShowDelete(false);
            return;
        }

        let showDelete = false;
        let showText = false;
        if (editor.state.selection instanceof TextSelection && editor.state.selection?.content()?.content?.size) {
            showDelete = true;
            const node = editor.state.selection.content().content.firstChild;
            const nodeType = node.type;
            if (nodeType?.name !== "codeBlock") {
                showText = true;
            }
        }
        setShowText(showText);

        if (editor.state.selection instanceof NodeSelection) {
            showDelete = true;
        }
        setShowDelete(showDelete);


    }, [editor?.state?.selection])

    //删除按钮
    const deleteFunc = () => {
        const tr = editor.state.tr;
        const selection = editor.state.selection;
        if (selection instanceof NodeSelection) {
            selection.replace(tr);
            const newState = editor.view.state.apply(tr);
            editor.view.updateState(newState);
            persist(editor);
        } else if (selection instanceof TextSelection) {
            tr.delete(selection.from, selection.to);
            const newState = editor.view.state.apply(tr);
            editor.view.updateState(newState);
            persist(editor);
        }
    }


    return (
        <>
            <BubbleMenu className="bubble-menu" tippyOptions={{duration: 100}} editor={editor}>
                {
                    showText && (
                        <>
                            <Tooltip title={'下划线'}>
                                <Button type={'link'} icon={<UnderlineOutlined/>}
                                        onClick={() => editor.chain().focus().toggleUnderline().run()}
                                        className={editor.isActive('underline') ? 'is-active' : ''}/>
                            </Tooltip>
                            <Tooltip title={'高亮'}>
                                <Button type={'link'} icon={<HighlightOutlined/>}
                                        onClick={() => editor.chain().focus().toggleHighlight().run()}
                                        className={editor.isActive('highlight') ? 'is-active' : ''}/>
                            </Tooltip>
                            <Tooltip title={'居左'}>
                                <Button type={'link'} icon={<AlignLeftOutlined/>}
                                        onClick={() => editor.chain().focus().setTextAlign('left').run()}
                                        className={editor.isActive({textAlign: 'left'}) ? 'is-active' : ''}/>
                            </Tooltip>
                            <Tooltip title={'居中'}>
                                <Button type={'link'} icon={<AlignCenterOutlined/>}
                                        onClick={() => editor.chain().focus().setTextAlign('center').run()}
                                        className={editor.isActive({textAlign: 'center'}) ? 'is-active' : ''}/>
                            </Tooltip>
                            <Tooltip title={'居右'}>
                                <Button type={'link'} icon={<AlignRightOutlined/>}
                                        onClick={() => editor.chain().focus().setTextAlign('right').run()}
                                        className={editor.isActive({textAlign: 'right'}) ? 'is-active' : ''}/>
                            </Tooltip>
                            <Tooltip title={'删除线'}>
                                <Button
                                    onClick={() => editor.chain().focus().toggleStrike().run()}
                                    className={editor.isActive('strike') ? 'is-active' : ''}
                                    type={'link'}
                                    icon={<StrikethroughOutlined/>}/>
                            </Tooltip>
                            <Tooltip title={'Red'}>
                                <Button
                                    onClick={() => editor.isActive('textStyle') ? editor.chain().focus().unsetColor().run() : editor.chain().focus().setColor('#F98181').run()}
                                    className={editor.isActive('textStyle', {color: '#F98181'}) ? 'is-active' : ''}
                                    type={'link'}>Red</Button>
                            </Tooltip>
                            <Tooltip title={'Yellow'}>
                                <Button
                                    onClick={() => editor.isActive('textStyle') ? editor.chain().focus().unsetColor().run() : editor.chain().focus().setColor('#ffe700').run()}
                                    className={editor.isActive('textStyle', {color: '#ffe700'}) ? 'is-active' : ''}
                                    type={'link'}>Yellow</Button>
                            </Tooltip>
                        </>
                    )
                }
                {
                    showDelete && (
                        <>
                            <Tooltip title={'删除'}>
                                <Button type={'link'} icon={<DeleteOutlined/>} onClick={deleteFunc}/>
                            </Tooltip>
                        </>
                    )
                }
            </BubbleMenu>
        </>
    );
};

export default Bubble;