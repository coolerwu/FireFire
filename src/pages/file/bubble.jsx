import {Button, Tooltip} from "antd";
import {
    AlignCenterOutlined,
    AlignLeftOutlined,
    AlignRightOutlined,
    DeleteOutlined,
    HighlightOutlined
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
    const [showBiliBili, setShowBiliBili] = useState(false);

    useEffect(() => {
        if (!editor?.state?.selection) {
            setShowText(false);
            setShowBiliBili(false);
            return;
        }

        let showText = false;
        if (editor.state.selection instanceof TextSelection && editor.state.selection?.content()?.content?.size) {
            const node = editor.state.selection.content().content.firstChild;
            const nodeType = node.type;
            if (nodeType?.name !== "codeBlock") {
                showText = true;
            }
        }
        setShowText(showText);

        let showBiliBili = false;
        if (editor.state.selection instanceof NodeSelection) {
            showBiliBili = true;
        }
        setShowBiliBili(showBiliBili);


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
                            <Tooltip title={'高亮'}>
                                <Button type={'link'} icon={<HighlightOutlined/>}
                                        onClick={() => editor.chain().focus().toggleHighlight().run()}
                                        className={editor.isActive('highlight') ? 'is-active' : ''}/>
                            </Tooltip>
                            <Tooltip>
                                <Button type={'link'} icon={<AlignLeftOutlined/>}
                                        onClick={() => editor.chain().focus().setTextAlign('left').run()}
                                        className={editor.isActive({textAlign: 'left'}) ? 'is-active' : ''}/>
                            </Tooltip>
                            <Tooltip title={'局中'}>
                                <Button icon={<AlignCenterOutlined/>}
                                        onClick={() => editor.chain().focus().setTextAlign('center').run()}
                                        className={editor.isActive({textAlign: 'center'}) ? 'is-active' : ''}/>
                            </Tooltip>
                            <Tooltip title={'局右'}>
                                <Button icon={<AlignRightOutlined/>}
                                        onClick={() => editor.chain().focus().setTextAlign('right').run()}
                                        className={editor.isActive({textAlign: 'right'}) ? 'is-active' : ''}/>
                            </Tooltip>
                        </>
                    )
                }
                {
                    showBiliBili && (
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