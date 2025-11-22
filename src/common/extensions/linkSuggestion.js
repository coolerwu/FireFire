import { ReactRenderer } from '@tiptap/react';
import tippy from 'tippy.js';
import LinkSuggestionList from './LinkSuggestionList';
import { logger } from '../../utils/logger';

/**
 * Link Suggestion - 内部链接自动补全配置
 *
 * 当用户输入 [[ 时触发自动补全
 */
export const linkSuggestion = {
  // 触发字符
  char: '[[',

  // 允许的前置字符（空格或行首）
  allowSpaces: true,

  // 获取建议列表
  items: async ({ query, editor }) => {
    if (typeof window === 'undefined' || !window.electronAPI) {
      return [];
    }

    try {
      // 如果有查询，搜索笔记
      if (query) {
        const results = await window.electronAPI.searchNotes(query);
        return results.slice(0, 10);
      }

      // 否则返回最近更新的笔记
      const allTags = await window.electronAPI.getAllTags();
      const recentNotes = [];

      // 从每个标签中获取笔记（去重）
      for (const tag of allTags.slice(0, 5)) {
        const notes = await window.electronAPI.getNotesByTag(tag.name);
        notes.forEach(note => {
          if (!recentNotes.find(n => n.id === note.id)) {
            recentNotes.push({
              id: note.path ? note.path.split('/').pop().replace('.cwjson', '') : note.title,
              title: note.title,
              tags: note.tags || [],
            });
          }
        });
      }

      return recentNotes.slice(0, 10);
    } catch (error) {
      logger.error('[LinkSuggestion] 获取建议失败:', error);
      return [];
    }
  },

  // 渲染建议列表
  render: () => {
    let component;
    let popup;

    return {
      onStart: (props) => {
        component = new ReactRenderer(LinkSuggestionList, {
          props,
          editor: props.editor,
        });

        if (!props.clientRect) {
          return;
        }

        popup = tippy('body', {
          getReferenceClientRect: props.clientRect,
          appendTo: () => document.body,
          content: component.element,
          showOnCreate: true,
          interactive: true,
          trigger: 'manual',
          placement: 'bottom-start',
          maxWidth: 'none',
          theme: 'light-border',
        });
      },

      onUpdate(props) {
        component.updateProps(props);

        if (!props.clientRect) {
          return;
        }

        popup[0].setProps({
          getReferenceClientRect: props.clientRect,
        });
      },

      onKeyDown(props) {
        if (props.event.key === 'Escape') {
          popup[0].hide();
          return true;
        }

        return component.ref?.onKeyDown(props);
      },

      onExit() {
        popup[0].destroy();
        component.destroy();
      },
    };
  },

  // 命令：插入链接
  command: ({ editor, range, props }) => {
    // 删除触发字符和查询文本
    editor
      .chain()
      .focus()
      .deleteRange(range)
      .setInternalLink(props)
      .insertContent(']] ')
      .run();
  },
};
