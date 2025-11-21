import { Node } from '@tiptap/core';
import { ReactNodeViewRenderer } from '@tiptap/react';
import PDFComponent from './PDFComponent';

export const PDFEmbed = Node.create({
  name: 'pdf',

  group: 'block',

  atom: true,

  addAttributes() {
    return {
      src: {
        default: null,
      },
    };
  },

  parseHTML() {
    return [
      {
        tag: 'div[data-pdf-file]',
      },
    ];
  },

  renderHTML({ HTMLAttributes }) {
    return [
      'div',
      {
        'data-pdf-file': HTMLAttributes.src,
      },
    ];
  },

  addNodeView() {
    return ReactNodeViewRenderer(PDFComponent);
  },

  addCommands() {
    return {
      setPDFEmbed:
        (options) =>
        ({ commands }) => {
          return commands.insertContent({
            type: this.name,
            attrs: options,
          });
        },
    };
  },
});
