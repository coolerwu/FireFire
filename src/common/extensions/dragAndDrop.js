import { Extension } from '@tiptap/core';
import { Plugin, PluginKey } from 'prosemirror-state';
import { Decoration, DecorationSet } from 'prosemirror-view';
import { ReactRenderer } from '@tiptap/react';
import DragHandleComponent from './DragHandleComponent';

const DragAndDropKey = new PluginKey('dragAndDrop');

export const DragAndDrop = Extension.create({
  name: 'dragAndDrop',

  addProseMirrorPlugins() {
    const editor = this.editor;
    let dragHandleRenderers = new Map();

    return [
      new Plugin({
        key: DragAndDropKey,

        state: {
          init() {
            return {
              dropPos: null,
            };
          },
          apply(tr, state) {
            const meta = tr.getMeta(DragAndDropKey);
            if (meta) {
              return meta;
            }
            return state;
          },
        },

        props: {
          decorations(state) {
            const { dropPos } = DragAndDropKey.getState(state);
            if (dropPos === null) return DecorationSet.empty;

            // Create drop indicator decoration
            return DecorationSet.create(state.doc, [
              Decoration.widget(dropPos, () => {
                const indicator = document.createElement('div');
                indicator.className = 'drop-indicator';
                return indicator;
              }),
            ]);
          },

          handleDOMEvents: {
            dragover: (view, event) => {
              event.preventDefault();

              const pos = view.posAtCoords({
                left: event.clientX,
                top: event.clientY,
              });

              if (pos) {
                // Find the nearest block position
                const $pos = view.state.doc.resolve(pos.pos);
                let dropPos = pos.pos;

                // If we're inside a block, decide whether to insert before or after
                if ($pos.parent.type.name !== 'doc') {
                  const parentStart = $pos.before();
                  const parentEnd = $pos.after();
                  const parentMiddle = parentStart + ($pos.parent.nodeSize / 2);

                  // If cursor is in the top half, insert before; otherwise after
                  dropPos = pos.pos < parentMiddle ? parentStart : parentEnd;
                }

                // Update drop position
                view.dispatch(
                  view.state.tr.setMeta(DragAndDropKey, { dropPos })
                );
              }

              return true;
            },

            dragleave: (view, event) => {
              // Clear drop indicator when leaving the editor
              const editorEl = view.dom;
              if (!editorEl.contains(event.relatedTarget)) {
                view.dispatch(
                  view.state.tr.setMeta(DragAndDropKey, { dropPos: null })
                );
              }
              return false;
            },

            drop: (view, event) => {
              event.preventDefault();

              const data = event.dataTransfer.getData('application/x-tiptap-drag');
              if (!data) {
                // Clear drop indicator
                view.dispatch(
                  view.state.tr.setMeta(DragAndDropKey, { dropPos: null })
                );
                return false;
              }

              const { pos: fromPos } = JSON.parse(data);
              const node = view.state.doc.nodeAt(fromPos);

              if (!node) {
                view.dispatch(
                  view.state.tr.setMeta(DragAndDropKey, { dropPos: null })
                );
                return false;
              }

              const dropCoords = view.posAtCoords({
                left: event.clientX,
                top: event.clientY,
              });

              if (!dropCoords) {
                view.dispatch(
                  view.state.tr.setMeta(DragAndDropKey, { dropPos: null })
                );
                return false;
              }

              let toPos = dropCoords.pos;

              // Find the nearest block position
              const $pos = view.state.doc.resolve(toPos);
              if ($pos.parent.type.name !== 'doc') {
                const parentStart = $pos.before();
                const parentEnd = $pos.after();
                const parentMiddle = parentStart + ($pos.parent.nodeSize / 2);
                toPos = dropCoords.pos < parentMiddle ? parentStart : parentEnd;
              }

              // Don't do anything if dropping in the same position
              if (fromPos === toPos || fromPos + node.nodeSize === toPos) {
                view.dispatch(
                  view.state.tr.setMeta(DragAndDropKey, { dropPos: null })
                );
                return true;
              }

              // Perform the move
              const tr = view.state.tr;

              // Adjust toPos if we're moving from before the drop position
              if (fromPos < toPos) {
                toPos -= node.nodeSize;
              }

              // Delete from original position
              tr.delete(fromPos, fromPos + node.nodeSize);

              // Insert at new position
              tr.insert(toPos, node);

              // Clear drop indicator
              tr.setMeta(DragAndDropKey, { dropPos: null });

              view.dispatch(tr);

              return true;
            },

            dragend: (view) => {
              // Clear drop indicator when drag ends
              view.dispatch(
                view.state.tr.setMeta(DragAndDropKey, { dropPos: null })
              );
              return false;
            },
          },
        },

        view(editorView) {
          return {
            update(view, prevState) {
              // Clean up old renderers
              dragHandleRenderers.forEach((renderer, pos) => {
                const node = view.state.doc.nodeAt(pos);
                if (!node) {
                  renderer.destroy();
                  dragHandleRenderers.delete(pos);
                }
              });

              // Add drag handles to block-level nodes
              view.state.doc.descendants((node, pos) => {
                // Only add handles to block nodes at the top level
                if (node.isBlock && view.state.doc.resolve(pos).depth === 1) {
                  const domNode = view.nodeDOM(pos);

                  if (domNode && !dragHandleRenderers.has(pos)) {
                    const getPos = () => pos;

                    const renderer = new ReactRenderer(DragHandleComponent, {
                      props: {
                        editor,
                        getPos,
                      },
                      editor,
                    });

                    // Insert handle before the node
                    if (domNode.parentElement && !domNode.querySelector('.drag-handle-wrapper')) {
                      domNode.style.position = 'relative';
                      domNode.insertBefore(renderer.element, domNode.firstChild);
                    }

                    dragHandleRenderers.set(pos, renderer);
                  }
                }
              });
            },

            destroy() {
              // Clean up all renderers
              dragHandleRenderers.forEach((renderer) => {
                renderer.destroy();
              });
              dragHandleRenderers.clear();
            },
          };
        },
      }),
    ];
  },
});
