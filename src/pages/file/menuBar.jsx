import {Button, Tooltip} from "antd";
import {
    AlignCenterOutlined,
    AlignLeftOutlined,
    AlignRightOutlined,
    BlockOutlined,
    BoldOutlined,
    CodeOutlined,
    DashOutlined,
    EnterOutlined,
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
        <div className={'menuBar'}>
            <Tooltip title={'加粗'}>
                <Button
                    onClick={() => editor.chain().focus().toggleBold().run()}
                    className={editor.isActive('bold') ? 'is-active' : ''}
                    type={'link'}
                    icon={<BoldOutlined/>}/>
            </Tooltip>
            <Tooltip title={'斜体'}>
                <Button
                    onClick={() => editor.chain().focus().toggleItalic().run()}
                    className={editor.isActive('italic') ? 'is-active' : ''}
                    type={'link'}
                    icon={<ItalicOutlined/>}/>
            </Tooltip>
            <Tooltip title={'删除线'}>
                <Button
                    onClick={() => editor.chain().focus().toggleStrike().run()}
                    className={editor.isActive('strike') ? 'is-active' : ''}
                    type={'link'}
                    icon={<StrikethroughOutlined/>}/>
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
            <Tooltip title={'h1'}>
                <Button
                    type={'link'} onClick={() => editor.chain().focus().toggleHeading({level: 1}).run()}
                    style={{paddingBottom: 0, paddingTop: 0}}
                    className={editor.isActive('heading', {level: 1}) ? 'is-active' : ''}>H1</Button>
            </Tooltip>
            <Tooltip title={'h2'}>
                <Button
                    type={'link'} onClick={() => editor.chain().focus().toggleHeading({level: 2}).run()}
                    style={{paddingBottom: 0, paddingTop: 0}}
                    className={editor.isActive('heading', {level: 2}) ? 'is-active' : ''}>H2</Button>
            </Tooltip>
            <Tooltip title={'h3'}>
                <Button
                    type={'link'} onClick={() => editor.chain().focus().toggleHeading({level: 3}).run()}
                    style={{paddingBottom: 0, paddingTop: 0}}
                    className={editor.isActive('heading', {level: 3}) ? 'is-active' : ''}>H3</Button>
            </Tooltip>
            <Tooltip title={'无序列表'}>
                <Button
                    type={'link'} onClick={() => editor.chain().focus().toggleBulletList().run()}
                    className={editor.isActive('bulletList') ? 'is-active' : ''}
                    icon={<UnorderedListOutlined/>}/>
            </Tooltip>
            <Tooltip title={'有序列表'}>
                <Button
                    type={'link'} onClick={() => editor.chain().focus().toggleBulletList().run()}
                    className={editor.isActive('orderedList') ? 'is-active' : ''}
                    icon={<OrderedListOutlined/>}/>
            </Tooltip>
            <Tooltip title={'代码块'}>
                <Button
                    type={'link'} onClick={() => editor.chain().focus().toggleCodeBlock().run()}
                    className={editor.isActive('codeBlock') ? 'is-active' : ''}
                    icon={<CodeOutlined/>}/>
            </Tooltip>
            <Tooltip title={'引述'}>
                <Button
                    type={'link'} onClick={() => editor.chain().focus().toggleBlockquote().run()}
                    className={editor.isActive('blockquote') ? 'is-active' : ''}
                    icon={<BlockOutlined/>}/>
            </Tooltip>
            <Tooltip title={'分割线'}>
                <Button type={'link'} icon={<DashOutlined/>}
                        onClick={() => editor.chain().focus().setHorizontalRule().run()}/>
            </Tooltip>
            <Tooltip title={'换行'}>
                <Button type={'link'} onClick={() => editor.chain().focus().setHardBreak().run()}
                        icon={<EnterOutlined/>}/>
            </Tooltip>
            <Tooltip title={'撤销'}>
                <Button type={'link'} onClick={() => editor.chain().focus().undo().run()} icon={<UndoOutlined/>}/>
            </Tooltip>
            <Tooltip title={'重做'}>
                <Button type={'link'} onClick={() => editor.chain().focus().redo().run()} icon={<RedoOutlined/>}/>
            </Tooltip>
        </div>
    );
};

export default MenuBar;