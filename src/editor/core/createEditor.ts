import { Editor, rootCtx, defaultValueCtx, editorViewOptionsCtx, editorViewCtx } from '@milkdown/core';
import { commonmark } from '@milkdown/preset-commonmark';
import { gfm } from '@milkdown/preset-gfm';
import { history } from '@milkdown/plugin-history';
import { cursor } from '@milkdown/plugin-cursor';
import { listener, listenerCtx } from '@milkdown/plugin-listener';
import { EditorView } from '@milkdown/prose/view';
import { sceneBreakNode, pageBreakNode } from '../schema/nodes';
import { handleEditorKeydown, ShortcutCallbacks } from '../commands/shortcuts';
import { calculateEditorStats } from './stats';
import { EditorCallbacks } from './types';

export interface CreateEditorOptions {
  root: HTMLElement;
  initialMarkdown: string;
  callbacks?: EditorCallbacks;
  shortcutCallbacks?: ShortcutCallbacks;
  editable?: boolean;
}

export interface SwriteEditorInstance {
  editor: Editor;
  getMarkdown: () => string;
  setMarkdown: (markdown: string) => void;
  getView: () => EditorView | null;
  destroy: () => Promise<void>;
  focus: () => void;
}

export async function createSwriteEditor(options: CreateEditorOptions): Promise<SwriteEditorInstance> {
  let currentView: EditorView | null = null;
  let latestMarkdown = options.initialMarkdown || '';

  const editor = await Editor.make()
    .config((ctx) => {
      ctx.set(rootCtx, options.root);
      ctx.set(defaultValueCtx, options.initialMarkdown);
      ctx.set(editorViewOptionsCtx, {
        editable: () => options.editable ?? true,
        handleKeyDown: (view, event) => {
          return handleEditorKeydown(view, event, options.shortcutCallbacks);
        },
      });

      // Listener plugin configuration
      ctx.get(listenerCtx).markdownUpdated((_ctx, markdown, prevMarkdown) => {
        if (markdown !== prevMarkdown) {
          latestMarkdown = markdown;
          const stats = calculateEditorStats(markdown);
          options.callbacks?.onChange?.(markdown, stats);
        }
      });
    })
    .use(commonmark)
    .use(gfm)
    .use(history)
    .use(cursor)
    .use(listener)
    .use(sceneBreakNode)
    .use(pageBreakNode)
    .create();

  currentView = editor.ctx.get(editorViewCtx);

  return {
    editor,
    getMarkdown: () => latestMarkdown,
    setMarkdown: (markdown: string) => {
      latestMarkdown = markdown;
      editor.action((ctx) => {
        const view = ctx.get(editorViewCtx);
        if (view) {
          // Re-parse markdown into current view
          editor.ctx.set(defaultValueCtx, markdown);
        }
      });
    },
    getView: () => currentView,
    destroy: async () => {
      await editor.destroy();
      currentView = null;
    },
    focus: () => {
      if (currentView) {
        currentView.focus();
      }
    },
  };
}
