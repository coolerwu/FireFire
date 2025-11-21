import StarterKit from "@tiptap/starter-kit";
import {CharacterCount} from "@tiptap/extension-character-count";
import {Image} from "@tiptap/extension-image";
import Highlight from "@tiptap/extension-highlight";
import CodeBlockLowlight from "@tiptap/extension-code-block-lowlight";
import {ReactNodeViewRenderer} from "@tiptap/react";
import CodeBlockComponent from "../../common/extensions/codeBlockComponent";
import {lowlight} from "lowlight";
import Typography from "@tiptap/extension-typography";
import TextAlign from "@tiptap/extension-text-align";
import {Link} from "@tiptap/extension-link";
import {Color} from "@tiptap/extension-color";
import TextStyle from "@tiptap/extension-text-style";
import Underline from '@tiptap/extension-underline';
import TaskItem from '@tiptap/extension-task-item';
import TaskList from '@tiptap/extension-task-list';
import Placeholder from '@tiptap/extension-placeholder';

/**
 * Simplified extensions for journal entries
 * StarterKit is configured to exclude codeBlock and dropCursor since we use custom versions
 */
const journalExtensions = [
    StarterKit.configure({
        codeBlock: false,  // 禁用 StarterKit 的 codeBlock，使用自定义的 CodeBlockLowlight
        dropcursor: false, // 禁用 StarterKit 的 dropcursor，使用自定义配置
    }),
    CharacterCount,
    Image.configure({
        inline: true,
        HTMLAttributes: {
            class: 'image-class',
        },
    }),
    Highlight.configure({multicolor: true}),
    CodeBlockLowlight.extend({
        addNodeView() {
            return ReactNodeViewRenderer(CodeBlockComponent)
        },
    }).configure({lowlight}),
    Typography,
    TextAlign.configure({ types: ['heading', 'paragraph'] }),
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
        placeholder: '记录今天的想法...',
        emptyEditorClass: 'is-editor-empty',
    }),
];

export default journalExtensions;
