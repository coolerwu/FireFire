import {Button} from "antd";
import TurndownService from 'turndown';
import {
    BlockOutlined,
    BoldOutlined,
    ClearOutlined,
    CodeOutlined,
    DashOutlined,
    EnterOutlined,
    FileMarkdownOutlined,
    HighlightOutlined,
    ItalicOutlined,
    OrderedListOutlined,
    RedoOutlined,
    StrikethroughOutlined,
    UndoOutlined,
    UnorderedListOutlined
} from "@ant-design/icons";
import './menuBar.less';

const MenuBar = ({editor}) => {
    if (!editor) {
        return null
    }

    return (
        <>
            <div className={'menuBar'}>
                <Button
                    onClick={() => editor.chain().focus().toggleBold().run()}
                    className={editor.isActive('bold') ? 'is-active' : ''}
                    type="text"
                >
                    <BoldOutlined/>
                </Button>
                <Button
                    onClick={() => editor.chain().focus().toggleItalic().run()}
                    className={editor.isActive('italic') ? 'is-active' : ''}
                    type="text"
                >
                    <ItalicOutlined/>
                </Button>
                <Button
                    onClick={() => editor.chain().focus().toggleStrike().run()}
                    className={editor.isActive('strike') ? 'is-active' : ''}
                    type="text"
                >
                    <StrikethroughOutlined/>
                </Button>
                <Button
                    type="text" onClick={() => editor.chain().focus().toggleCode().run()}
                    className={editor.isActive('code') ? 'is-active' : ''}
                >
                    <CodeOutlined/>
                </Button>
                {/*<Button type="text" onClick={() => editor.chain().focus().unsetAllMarks().run()}>*/}
                {/*    clear marks*/}
                {/*</Button>*/}
                {/*<Button type="text" onClick={() => editor.chain().focus().clearNodes().run()}>*/}
                {/*    clear nodes*/}
                {/*</Button>*/}
                <Button
                    type="text" onClick={() => editor.chain().focus().setParagraph().run()}
                    className={editor.isActive('paragraph') ? 'is-active' : ''}
                >
                    <ClearOutlined/>
                </Button>
                <Button
                    type="text" onClick={() => editor.chain().focus().toggleHeading({level: 1}).run()}
                    className={editor.isActive('heading', {level: 1}) ? 'is-active' : ''}
                >
                    h1
                </Button>
                <Button
                    type="text" onClick={() => editor.chain().focus().toggleHeading({level: 1}).run()}
                    className={editor.isActive('heading', {level: 2}) ? 'is-active' : ''}
                >
                    h2
                </Button>
                <Button
                    type="text" onClick={() => editor.chain().focus().toggleHeading({level: 3}).run()}
                    className={editor.isActive('heading', {level: 3}) ? 'is-active' : ''}
                >
                    h3
                </Button>
                <Button
                    type="text" onClick={() => editor.chain().focus().toggleHeading({level: 1}).run()}
                    className={editor.isActive('heading', {level: 4}) ? 'is-active' : ''}
                >
                    h4
                </Button>
                <Button
                    type="text" onClick={() => editor.chain().focus().toggleHeading({level: 5}).run()}
                    className={editor.isActive('heading', {level: 5}) ? 'is-active' : ''}
                >
                    h5
                </Button>
                <Button
                    type="text" onClick={() => editor.chain().focus().toggleHeading({level: 1}).run()}
                    className={editor.isActive('heading', {level: 6}) ? 'is-active' : ''}
                >
                    h6
                </Button>
                <Button
                    type="text" onClick={() => editor.chain().focus().toggleBulletList().run()}
                    className={editor.isActive('bulletList') ? 'is-active' : ''}
                >
                    <UnorderedListOutlined/>
                </Button>
                <Button
                    type="text" onClick={() => editor.chain().focus().toggleOrderedList().run()}
                    className={editor.isActive('orderedList') ? 'is-active' : ''}
                >
                    <OrderedListOutlined/>
                </Button>
                <Button
                    type="text" onClick={() => editor.chain().focus().toggleCodeBlock().run()}
                    className={editor.isActive('codeBlock') ? 'is-active' : ''}
                >
                    <HighlightOutlined/>
                </Button>
                <Button
                    type="text" onClick={() => editor.chain().focus().toggleBlockquote().run()}
                    className={editor.isActive('blockquote') ? 'is-active' : ''}
                >
                    <BlockOutlined/>
                </Button>
                <Button type="text" onClick={() => editor.chain().focus().setHorizontalRule().run()}>
                    <DashOutlined/>
                </Button>
                <Button type="text" onClick={() => editor.chain().focus().setHardBreak().run()}>
                    <EnterOutlined/>
                </Button>
                <Button type="text" onClick={() => editor.chain().focus().undo().run()}>
                    <UndoOutlined/>
                </Button>
                <Button type="text" onClick={() => editor.chain().focus().redo().run()}>
                    <RedoOutlined/>
                </Button>
                <Button type="text" onClick={() => {
                    const turndownService = new TurndownService();
                    const markdown = turndownService.turndown(editor.getHTML())
                    console.log(markdown)
                }}>
                    <FileMarkdownOutlined/>
                </Button>
            </div>
        </>
    );
};

export default MenuBar;