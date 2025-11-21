import { Node } from '@tiptap/core';
import { ReactNodeViewRenderer } from '@tiptap/react';
import WebEmbedComponent from './WebEmbedComponent';

export const WebEmbed = Node.create({
  name: 'webEmbed',

  group: 'block',

  atom: true,

  addAttributes() {
    return {
      url: {
        default: null,
      },
    };
  },

  parseHTML() {
    return [
      {
        tag: 'div[data-web-embed]',
      },
    ];
  },

  renderHTML({ HTMLAttributes }) {
    return [
      'div',
      {
        'data-web-embed': HTMLAttributes.url,
      },
    ];
  },

  addNodeView() {
    return ReactNodeViewRenderer(WebEmbedComponent);
  },

  addCommands() {
    return {
      setWebEmbed:
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
