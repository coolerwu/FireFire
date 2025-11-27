import { Node } from '@tiptap/core';
import { ReactNodeViewRenderer } from '@tiptap/react';
import DatabaseNodeComponent from './DatabaseNodeComponent';

/**
 * DatabaseNode - 数据库节点扩展
 * 在编辑器中嵌入 Notion 风格的数据库视图
 */
export const DatabaseNode = Node.create({
  name: 'database',

  group: 'block',

  atom: true,

  draggable: true,

  addAttributes() {
    return {
      databaseId: {
        default: null,
      },
      title: {
        default: '无标题数据库',
      },
    };
  },

  parseHTML() {
    return [
      {
        tag: 'div[data-database]',
      },
    ];
  },

  renderHTML({ HTMLAttributes }) {
    return [
      'div',
      {
        'data-database': HTMLAttributes.databaseId,
        'data-title': HTMLAttributes.title,
      },
    ];
  },

  addNodeView() {
    return ReactNodeViewRenderer(DatabaseNodeComponent);
  },

  addCommands() {
    return {
      setDatabaseNode:
        (options = {}) =>
        ({ commands }) => {
          return commands.insertContent({
            type: this.name,
            attrs: options,
          });
        },
    };
  },
});

export default DatabaseNode;
