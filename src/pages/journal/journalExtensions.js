import StarterKit from "@tiptap/starter-kit";
import {CharacterCount} from "@tiptap/extension-character-count";
import {Image} from "@tiptap/extension-image";
import Highlight from "@tiptap/extension-highlight";
import Dropcursor from "@tiptap/extension-dropcursor";
import CodeBlockLowlight from "@tiptap/extension-code-block-lowlight";
import {ReactNodeViewRenderer} from "@tiptap/react";
import CodeBlockComponent from "../../common/extensions/codeBlockComponent";
import {lowlight} from "lowlight";
import Typography from "@tiptap/extension-typography";
import TextAlign from "@tiptap/extension-text-align";
import BiliBiliNode from "../../common/extensions/biliBiliNode";
import {Link} from "@tiptap/extension-link";
import {Color} from "@tiptap/extension-color";
import TextStyle from "@tiptap/extension-text-style";
import Underline from '@tiptap/extension-underline';
import TaskItem from '@tiptap/extension-task-item';
import TaskList from '@tiptap/extension-task-list';
import Placeholder from '@tiptap/extension-placeholder';
import {SlashCommand} from '../../common/extensions/slashCommand';
import {DragAndDrop} from '../../common/extensions/dragAndDrop';
import {YouTubeEmbed} from '../../common/extensions/youtubeEmbed';
import {PDFEmbed} from '../../common/extensions/pdfEmbed';
import {WebEmbed} from '../../common/extensions/webEmbed';
import {TagExtension} from '../../common/extensions/tagExtension';
import {InternalLinkExtension} from '../../common/extensions/internalLinkExtension';

/**
 * Journal extensions - 与主编辑器使用相同的功能
 * 包含: SlashCommand, DragAndDrop, Tags, InternalLinks, Embeds 等
 */
const journalExtensions = [
    StarterKit.configure({
        codeBlock: false,  // 使用 CodeBlockLowlight 替代
        dropcursor: false, // 使用单独的 Dropcursor 扩展
    }),
    CharacterCount,
    Image.configure({
        inline: true,
        HTMLAttributes: {
            class: 'image-class',
        },
    }),
    Highlight.configure({multicolor: true}),
    Dropcursor.configure({
        color: '#4a8cff',
        width: 2,
    }),
    CodeBlockLowlight.extend({
        addNodeView() {
            return ReactNodeViewRenderer(CodeBlockComponent)
        },
    }).configure({lowlight}),
    Typography,
    TextAlign.configure({ types: ['heading', 'paragraph'] }),
    BiliBiliNode,
    Link.configure({
        autolink: true,
        linkOnPaste: true,
        openOnClick: true,
        HTMLAttributes: { rel: 'noopener noreferrer' },
    }),
    Color,
    TextStyle,
    Underline,
    TaskList,
    TaskItem.configure({
        nested: true,
    }),
    Placeholder.configure({
        placeholder: '输入 / 查看所有命令...',
        emptyEditorClass: 'is-editor-empty',
    }),
    SlashCommand,
    DragAndDrop,
    YouTubeEmbed,
    PDFEmbed,
    WebEmbed,
    TagExtension,
    InternalLinkExtension,
];

export default journalExtensions;
