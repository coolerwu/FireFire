import {Button, Tooltip, Dropdown, message, Spin} from "antd";
import {
    AlignCenterOutlined,
    AlignLeftOutlined,
    AlignRightOutlined,
    DeleteOutlined,
    HighlightOutlined,
    StrikethroughOutlined,
    UnderlineOutlined,
    RobotOutlined,
    EditOutlined,
    TranslationOutlined,
    FormOutlined,
    FileTextOutlined,
    QuestionCircleOutlined,
} from "@ant-design/icons";
import {NodeSelection, TextSelection} from "prosemirror-state";
import {BubbleMenu} from "@tiptap/react";
import React, {useEffect, useState, useContext} from "react";
import {executeAI, AI_ACTIONS} from "../../utils/aiService";
import {Context} from "../../index";

/**
 * @param editor 编辑器
 * @param persist 持久化操作
 */
const Bubble = ({editor, persist}) => {
    const {setting} = useContext(Context);

    //展示选项
    const [showText, setShowText] = useState(false);
    const [showDelete, setShowDelete] = useState(false);
    const [aiLoading, setAiLoading] = useState(false);
    const [aiEnabled, setAiEnabled] = useState(false);

    // 检查 AI 是否启用
    useEffect(() => {
        setAiEnabled(setting?.ai?.enabled && setting?.ai?.apiKey);
    }, [setting?.ai]);

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

    // 执行 AI 操作
    const handleAIAction = async (action) => {
        if (!editor) return;

        const selection = editor.state.selection;
        if (!(selection instanceof TextSelection) || selection.empty) {
            message.warning('请先选中文本');
            return;
        }

        // 获取选中的文本
        const {from, to} = selection;
        const selectedText = editor.state.doc.textBetween(from, to, '\n');

        if (!selectedText.trim()) {
            message.warning('选中的文本为空');
            return;
        }

        setAiLoading(true);

        try {
            const result = await executeAI(action, selectedText);

            // 替换选中的文本
            editor.chain()
                .focus()
                .deleteRange({from, to})
                .insertContent(result)
                .run();

            persist(editor);
            message.success('AI 处理完成');
        } catch (err) {
            message.error(`AI 处理失败: ${err.message}`);
        } finally {
            setAiLoading(false);
        }
    };

    // AI 菜单项
    const aiMenuItems = [
        {
            key: AI_ACTIONS.POLISH,
            icon: <EditOutlined />,
            label: '润色',
            onClick: () => handleAIAction(AI_ACTIONS.POLISH),
        },
        {
            key: AI_ACTIONS.TRANSLATE,
            icon: <TranslationOutlined />,
            label: '翻译',
            onClick: () => handleAIAction(AI_ACTIONS.TRANSLATE),
        },
        {
            key: AI_ACTIONS.CONTINUE,
            icon: <FormOutlined />,
            label: '续写',
            onClick: () => handleAIAction(AI_ACTIONS.CONTINUE),
        },
        {
            key: AI_ACTIONS.SUMMARIZE,
            icon: <FileTextOutlined />,
            label: '总结',
            onClick: () => handleAIAction(AI_ACTIONS.SUMMARIZE),
        },
        {
            key: AI_ACTIONS.EXPLAIN,
            icon: <QuestionCircleOutlined />,
            label: '解释',
            onClick: () => handleAIAction(AI_ACTIONS.EXPLAIN),
        },
    ];

    //初始化
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

    return (
        <div>
            <BubbleMenu className="bubble-menu" tippyOptions={{duration: 100}} editor={editor}>
                {showText && (
                    <>
                        {/* AI 助手按钮 */}
                        {aiEnabled && (
                            <Dropdown
                                menu={{items: aiMenuItems}}
                                trigger={['click']}
                                placement="bottom"
                                disabled={aiLoading}
                            >
                                <Tooltip title={'AI 助手 (Cmd+J)'}>
                                    <Button
                                        type={'link'}
                                        icon={aiLoading ? <Spin size="small" /> : <RobotOutlined />}
                                        className="ai-button"
                                        style={{color: '#0f7b6c'}}
                                    />
                                </Tooltip>
                            </Dropdown>
                        )}
                        <div className="bubble-divider" />
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
                )}
                {showDelete && (
                    <>
                        <Tooltip title={'删除'}>
                            <Button type={'link'} icon={<DeleteOutlined/>} onClick={deleteFunc}/>
                        </Tooltip>
                    </>
                )}
            </BubbleMenu>
        </div>
    );
};

export default Bubble;
