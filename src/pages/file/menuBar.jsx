import {Tooltip} from "antd";
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
    HistoryOutlined,
    ItalicOutlined,
    OrderedListOutlined,
    RedoOutlined,
    StrikethroughOutlined,
    UndoOutlined,
    UnorderedListOutlined
} from "@ant-design/icons";
import SaveStatusIndicator from "../../components/SaveStatusIndicator";

const ToolButton = ({ icon, title, onClick, isActive, children }) => (
    <Tooltip title={title}>
        <button
            onClick={onClick}
            className={`
                p-1.5 rounded-sm
                text-notion-text-secondary dark:text-notion-dark-text-secondary
                hover:bg-notion-bg-hover dark:hover:bg-notion-dark-bg-hover
                hover:text-notion-text-primary dark:hover:text-notion-dark-text-primary
                transition-colors duration-fast
                ${isActive ? 'bg-notion-bg-selected dark:bg-notion-dark-bg-selected text-notion-accent-blue' : ''}
            `}
        >
            {icon || <span className="text-sm font-medium px-0.5">{children}</span>}
        </button>
    </Tooltip>
);

const Divider = () => (
    <div className="w-px h-5 bg-notion-border dark:bg-notion-dark-border mx-1" />
);

const MenuBar = ({editor, onShowVersionHistory}) => {
    if (!editor) {
        return null;
    }

    return (
        <div className="
            sticky top-0 z-10
            flex items-center gap-0.5 px-3 py-2
            bg-notion-bg-primary/95 dark:bg-notion-dark-bg-primary/95
            backdrop-blur-sm
            border-b border-notion-border dark:border-notion-dark-border
            overflow-x-auto
        ">
            {/* 文本格式 */}
            <ToolButton
                title="加粗"
                onClick={() => editor.chain().focus().toggleBold().run()}
                isActive={editor.isActive('bold')}
                icon={<BoldOutlined />}
            />
            <ToolButton
                title="斜体"
                onClick={() => editor.chain().focus().toggleItalic().run()}
                isActive={editor.isActive('italic')}
                icon={<ItalicOutlined />}
            />
            <ToolButton
                title="删除线"
                onClick={() => editor.chain().focus().toggleStrike().run()}
                isActive={editor.isActive('strike')}
                icon={<StrikethroughOutlined />}
            />
            <ToolButton
                title="高亮"
                onClick={() => editor.chain().focus().toggleHighlight().run()}
                isActive={editor.isActive('highlight')}
                icon={<HighlightOutlined />}
            />

            <Divider />

            {/* 对齐 */}
            <ToolButton
                title="左对齐"
                onClick={() => editor.chain().focus().setTextAlign('left').run()}
                isActive={editor.isActive({textAlign: 'left'})}
                icon={<AlignLeftOutlined />}
            />
            <ToolButton
                title="居中"
                onClick={() => editor.chain().focus().setTextAlign('center').run()}
                isActive={editor.isActive({textAlign: 'center'})}
                icon={<AlignCenterOutlined />}
            />
            <ToolButton
                title="右对齐"
                onClick={() => editor.chain().focus().setTextAlign('right').run()}
                isActive={editor.isActive({textAlign: 'right'})}
                icon={<AlignRightOutlined />}
            />

            <Divider />

            {/* 标题 */}
            <ToolButton
                title="一级标题"
                onClick={() => editor.chain().focus().toggleHeading({level: 1}).run()}
                isActive={editor.isActive('heading', {level: 1})}
            >
                H1
            </ToolButton>
            <ToolButton
                title="二级标题"
                onClick={() => editor.chain().focus().toggleHeading({level: 2}).run()}
                isActive={editor.isActive('heading', {level: 2})}
            >
                H2
            </ToolButton>
            <ToolButton
                title="三级标题"
                onClick={() => editor.chain().focus().toggleHeading({level: 3}).run()}
                isActive={editor.isActive('heading', {level: 3})}
            >
                H3
            </ToolButton>

            <Divider />

            {/* 列表和块 */}
            <ToolButton
                title="无序列表"
                onClick={() => editor.chain().focus().toggleBulletList().run()}
                isActive={editor.isActive('bulletList')}
                icon={<UnorderedListOutlined />}
            />
            <ToolButton
                title="有序列表"
                onClick={() => editor.chain().focus().toggleOrderedList().run()}
                isActive={editor.isActive('orderedList')}
                icon={<OrderedListOutlined />}
            />
            <ToolButton
                title="代码块"
                onClick={() => editor.chain().focus().toggleCodeBlock().run()}
                isActive={editor.isActive('codeBlock')}
                icon={<CodeOutlined />}
            />
            <ToolButton
                title="引用"
                onClick={() => editor.chain().focus().toggleBlockquote().run()}
                isActive={editor.isActive('blockquote')}
                icon={<BlockOutlined />}
            />

            <Divider />

            {/* 插入和操作 */}
            <ToolButton
                title="分割线"
                onClick={() => editor.chain().focus().setHorizontalRule().run()}
                icon={<DashOutlined />}
            />
            <ToolButton
                title="换行"
                onClick={() => editor.chain().focus().setHardBreak().run()}
                icon={<EnterOutlined />}
            />

            <Divider />

            {/* 撤销重做 */}
            <ToolButton
                title="撤销"
                onClick={() => editor.chain().focus().undo().run()}
                icon={<UndoOutlined />}
            />
            <ToolButton
                title="重做"
                onClick={() => editor.chain().focus().redo().run()}
                icon={<RedoOutlined />}
            />

            <Divider />

            {/* 历史版本 */}
            <ToolButton
                title="历史版本"
                onClick={onShowVersionHistory}
                icon={<HistoryOutlined />}
            />

            {/* 保存状态 */}
            <div className="ml-auto">
                <SaveStatusIndicator />
            </div>
        </div>
    );
};

export default MenuBar;
