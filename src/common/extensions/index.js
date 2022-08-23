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

const plugins = [
    StarterKit, CharacterCount, Image.configure({inline: true, allowBase64: true}),
    Highlight.configure({multicolor: true}), Dropcursor,
    CodeBlockLowlight.extend({
        addNodeView() {
            return ReactNodeViewRenderer(CodeBlockComponent)
        },
    }).configure({lowlight}),
    Typography, TextAlign.configure({types: ['heading', 'paragraph']}),
    BiliBiliNode, Link, Color, TextStyle, Underline, TaskList,
    TaskItem.configure({
        nested: true,
    }),
];

export default plugins;