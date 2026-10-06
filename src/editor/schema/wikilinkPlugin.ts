import { $prose } from '@milkdown/utils';
import { Plugin, PluginKey } from '@milkdown/prose/state';
import { Decoration, DecorationSet } from '@milkdown/prose/view';
import { findWikilinksInText } from '../links/wikilinkResolver';

export const wikilinkPluginKey = new PluginKey('swrite-wikilinks');

export interface WikilinkPluginOptions {
  onNavigateWikilink?: (target: string) => void;
}

export function createWikilinkPlugin(options: WikilinkPluginOptions = {}) {
  return new Plugin({
    key: wikilinkPluginKey,
    state: {
      init(_, state) {
        return buildWikilinkDecorations(state.doc);
      },
      apply(tr, oldDecos, oldState, newState) {
        if (tr.docChanged || oldState.doc !== newState.doc) {
          return buildWikilinkDecorations(newState.doc);
        }
        return oldDecos.map(tr.mapping, tr.doc);
      },
    },
    props: {
      decorations(state) {
        return this.getState(state) || DecorationSet.empty;
      },
      handleClick(_view, _pos, event) {
        const targetElement = event.target as HTMLElement | null;
        if (!targetElement) return false;

        const wikilinkEl = targetElement.closest('.swrite-wikilink') as HTMLElement | null;
        if (wikilinkEl) {
          const target = wikilinkEl.getAttribute('data-target');
          if (target && options.onNavigateWikilink) {
            event.preventDefault();
            event.stopPropagation();
            options.onNavigateWikilink(target);
            return true;
          }
        }
        return false;
      },
    },
  });
}

function buildWikilinkDecorations(doc: any): DecorationSet {
  const decorations: Decoration[] = [];

  doc.descendants((node: any, pos: number) => {
    if (node.isText && node.text) {
      const text = node.text;
      const matches = findWikilinksInText(text);

      for (const m of matches) {
        const from = pos + m.startIndex;
        const to = pos + m.endIndex;

        decorations.push(
          Decoration.inline(from, to, {
            class: 'swrite-wikilink',
            'data-target': m.target,
            'data-alias': m.alias || '',
            title: `Open [[${m.target}]]`,
          })
        );
      }
    }
  });

  return DecorationSet.create(doc, decorations);
}

export const wikilinkProsePlugin = (options?: WikilinkPluginOptions) =>
  $prose(() => createWikilinkPlugin(options));
