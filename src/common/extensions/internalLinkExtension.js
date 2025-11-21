import { Node, mergeAttributes } from '@tiptap/core';
import { Plugin, PluginKey } from '@tiptap/pm/state';
import Suggestion from '@tiptap/suggestion';
import { linkSuggestion } from './linkSuggestion';

/**
 * Internal Link Extension - 支持 [[链接]] 语法
 *
 * 用法:
 * - 输入 [[笔记名称]] 创建内部链接
 * - 点击链接跳转到目标笔记
 * - 链接不存在时显示为红色虚线
 */
export const InternalLinkExtension = Node.create({
  name: 'internalLink',

  group: 'inline',

  inline: true,

  atom: true,

  addAttributes() {
    return {
      target: {
        default: null,
        parseHTML: element => element.getAttribute('data-target'),
        renderHTML: attributes => {
          if (!attributes.target) {
            return {};
          }
          return {
            'data-target': attributes.target,
          };
        },
      },
      label: {
        default: null,
        parseHTML: element => element.getAttribute('data-label'),
        renderHTML: attributes => {
          if (!attributes.label) {
            return {};
          }
          return {
            'data-label': attributes.label,
          };
        },
      },
      exists: {
        default: true,
        parseHTML: element => element.getAttribute('data-exists') === 'true',
        renderHTML: attributes => {
          return {
            'data-exists': attributes.exists ? 'true' : 'false',
          };
        },
      },
    };
  },

  parseHTML() {
    return [
      {
        tag: 'a[data-internal-link]',
      },
    ];
  },

  renderHTML({ HTMLAttributes }) {
    const { target, label, exists } = HTMLAttributes;
    const displayText = label || target || '';

    return [
      'a',
      mergeAttributes(
        {
          'data-internal-link': 'true',
          class: `internal-link ${exists ? 'exists' : 'not-exists'}`,
          href: '#',
        },
        HTMLAttributes
      ),
      `[[${displayText}]]`,
    ];
  },

  addKeyboardShortcuts() {
    return {
      // 右中括号触发链接转换
      ']': ({ editor }) => {
        const { state } = editor;
        const { selection } = state;
        const { $from } = selection;

        // 获取当前位置前的文本
        const textBefore = $from.parent.textBetween(
          Math.max(0, $from.parentOffset - 50),
          $from.parentOffset,
          null,
          '\ufffc'
        );

        // 检查是否匹配 [[链接]] 模式（即将完成）
        const match = textBefore.match(/\[\[([^\]]+)$/);

        if (match) {
          const linkText = match[1];
          const start = $from.pos - match[0].length;
          const end = $from.pos;

          // 插入 ] 完成匹配
          const fullText = `[[${linkText}]]`;
          const matchComplete = fullText.match(/\[\[([^\]]+)\]\]/);

          if (matchComplete) {
            const target = matchComplete[1];

            // 删除原文本并插入链接节点
            editor
              .chain()
              .deleteRange({ from: start, to: end })
              .insertContent({
                type: this.name,
                attrs: {
                  target,
                  label: target,
                  exists: false, // 稍后通过 API 检查
                },
              })
              .insertContent(']') // 插入最后一个 ]
              .run();

            // 检查链接是否存在
            this.checkLinkExists(editor, target);

            return true;
          }
        }

        return false;
      },
    };
  },

  addCommands() {
    return {
      setInternalLink: (options) => ({ commands }) => {
        return commands.insertContent({
          type: this.name,
          attrs: options,
        });
      },
    };
  },

  addProseMirrorPlugins() {
    const extension = this;

    return [
      // Suggestion 插件（自动补全）
      Suggestion({
        editor: this.editor,
        ...linkSuggestion,
      }),

      // 点击链接处理
      new Plugin({
        key: new PluginKey('internalLinkClick'),
        props: {
          handleClick(view, pos, event) {
            const { nodeName } = event.target;

            // 检查是否点击了内部链接
            if (nodeName === 'A' && event.target.dataset.internalLink) {
              event.preventDefault();

              const target = event.target.dataset.target;

              // 触发打开笔记事件
              extension.options.onLinkClick?.(target);

              return true;
            }

            return false;
          },
        },
      }),
    ];
  },

  /**
   * 检查链接目标是否存在
   */
  checkLinkExists(editor, target) {
    if (typeof window !== 'undefined' && window.electronAPI) {
      window.electronAPI.noteExists(target).then(exists => {
        // 更新链接节点的 exists 属性
        const { state } = editor;
        const { doc } = state;

        doc.descendants((node, pos) => {
          if (node.type.name === this.name && node.attrs.target === target) {
            editor
              .chain()
              .setNodeSelection(pos)
              .updateAttributes(this.name, { exists })
              .run();
          }
        });
      });
    }
  },

  addOptions() {
    return {
      onLinkClick: null,
    };
  },
});
