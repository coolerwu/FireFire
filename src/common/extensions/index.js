import StarterKit from "@tiptap/starter-kit";
import {CharacterCount} from "@tiptap/extension-character-count";
import {Image} from "@tiptap/extension-image";
import Highlight from "@tiptap/extension-highlight";
import Dropcursor from "@tiptap/extension-dropcursor";
import CodeBlockLowlight from "@tiptap/extension-code-block-lowlight";
import {ReactNodeViewRenderer} from "@tiptap/react";
import CodeBlockComponent from "./codeBlockComponent";
import {lowlight} from "lowlight";
import Typography from "@tiptap/extension-typography";
import TextAlign from "@tiptap/extension-text-align";
import BiliBiliNode from "./biliBiliNode";
import {Link} from "@tiptap/extension-link";
import {Color} from "@tiptap/extension-color";
import TextStyle from "@tiptap/extension-text-style";
import Underline from '@tiptap/extension-underline';
import TaskItem from '@tiptap/extension-task-item';
import TaskList from '@tiptap/extension-task-list';
import Placeholder from '@tiptap/extension-placeholder';

const plugins = [
    StarterKit, CharacterCount,
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
        placeholder: '开始书写...',
        emptyEditorClass: 'is-editor-empty',
    }),
];

export default plugins;