import { Node } from '@tiptap/core';
import { ReactNodeViewRenderer } from '@tiptap/react';
import { Plugin, PluginKey } from 'prosemirror-state';
import { Fragment, Slice } from 'prosemirror-model';
import DatabaseNodeComponent from './DatabaseNodeComponent';
import { electronAPI } from 'utils/electronAPI';

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

  addProseMirrorPlugins() {
    const nodeName = this.name;

    return [
      new Plugin({
        key: new PluginKey('databasePaste'),
        props: {
          handlePaste(view, event, slice) {
            // 检查粘贴内容中是否有数据库节点
            const databaseNodes = [];
            slice.content.descendants((node) => {
              if (node.type.name === nodeName && node.attrs.databaseId) {
                databaseNodes.push(node.attrs.databaseId);
              }
            });

            if (databaseNodes.length === 0) {
              // 没有数据库节点，使用默认处理
              return false;
            }

            // 有数据库节点，需要复制数据库
            const duplicateDatabases = async () => {
              const idMapping = new Map();

              // 复制所有数据库
              for (const dbId of databaseNodes) {
                try {
                  const newDb = await electronAPI.duplicateDatabaseView(dbId);
                  if (newDb) {
                    idMapping.set(dbId, newDb.id);
                  }
                } catch (err) {
                  console.error('复制数据库失败:', dbId, err);
                }
              }

              // 修改粘贴内容中的 databaseId
              const { tr } = view.state;

              // 创建新的文档片段，替换 databaseId
              const newContent = [];
              slice.content.forEach((node) => {
                if (node.type.name === nodeName && node.attrs.databaseId) {
                  const newDbId = idMapping.get(node.attrs.databaseId);
                  if (newDbId) {
                    // 创建新节点，更新 databaseId
                    newContent.push(
                      node.type.create(
                        { ...node.attrs, databaseId: newDbId },
                        node.content,
                        node.marks
                      )
                    );
                  } else {
                    // 复制失败，创建无 ID 的节点（会触发创建新数据库）
                    newContent.push(
                      node.type.create(
                        { ...node.attrs, databaseId: null },
                        node.content,
                        node.marks
                      )
                    );
                  }
                } else {
                  newContent.push(node);
                }
              });

              // 插入修改后的内容
              const fragment = Fragment.from(newContent);
              const newSlice = new Slice(fragment, slice.openStart, slice.openEnd);
              tr.replaceSelection(newSlice);
              view.dispatch(tr);
            };

            // 异步执行复制操作
            duplicateDatabases();

            // 阻止默认粘贴行为
            return true;
          },
        },
      }),
    ];
  },
});

export default DatabaseNode;
