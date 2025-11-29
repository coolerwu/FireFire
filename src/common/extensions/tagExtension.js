import { Node } from '@tiptap/core';
import { mergeAttributes } from '@tiptap/react';

/**
 * Tag Extension - 支持 #标签 语法
 *
 * 用法:
 * - 输入 #标签名 自动转换为标签节点
 * - 支持中文、英文、数字
 * - 点击标签可以筛选相关笔记
 */
export const TagExtension = Node.create({
  name: 'tag',

  group: 'inline',

  inline: true,

  atom: true,

  addAttributes() {
    return {
      tag: {
        default: null,
        parseHTML: element => element.getAttribute('data-tag'),
        renderHTML: attributes => {
          if (!attributes.tag) {
            return {};
          }
          return {
            'data-tag': attributes.tag,
          };
        },
      },
    };
  },

  parseHTML() {
    return [
      {
        tag: 'span[data-tag]',
      },
    ];
  },

  renderHTML({ HTMLAttributes }) {
    return [
      'span',
      mergeAttributes(
        {
          class: 'tag-node',
        },
        HTMLAttributes
      ),
      `#${HTMLAttributes['data-tag']}`,
    ];
  },

  addInputRules() {
    return [
      {
        find: /#([a-zA-Z0-9\u4e00-\u9fa5_-]+)(?=\s|$)/,
        handler: ({ state, range, match }) => {
          const { tr } = state;
          const start = range.from;
          const end = range.to;
          const tagName = match[1];

          if (!tagName) {
            return null;
          }

          // 删除匹配的文本
          tr.delete(start, end);

          // 插入标签节点
          tr.insert(start, this.type.create({ tag: tagName }));

          // 在标签后插入空格
          tr.insertText(' ', start + 1);

          return tr;
        },
      },
    ];
  },

  addCommands() {
    return {
      setTag: (tag) => ({ commands }) => {
        return commands.insertContent({
          type: this.name,
          attrs: { tag },
        });
      },
    };
  },

  addKeyboardShortcuts() {
    return {
      // 空格键触发标签转换
      Space: ({ editor }) => {
        const { state } = editor;
        const { selection } = state;
        const { $from } = selection;

        // 只处理光标在文本中的情况
        if ($from.textOffset === 0) {
          return false;
        }

        // 获取当前位置所在的文本节点
        const node = $from.nodeBefore;
        if (!node || !node.isText) {
          return false;
        }

        // 获取文本内容
        const text = node.text || '';

        // 检查是否以 #标签 结尾
        const match = text.match(/#([a-zA-Z0-9\u4e00-\u9fa5_-]+)$/);

        if (match) {
          const tagName = match[1];
          const start = $from.pos - match[0].length;
          const end = $from.pos;

          editor
            .chain()
            .deleteRange({ from: start, to: end })
            .setTag(tagName)
            .insertContent(' ')
            .run();

          return true;
        }

        return false;
      },
    };
  },
});
