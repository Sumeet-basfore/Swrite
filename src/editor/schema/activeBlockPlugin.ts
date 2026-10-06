import { $prose } from '@milkdown/utils';
import { Plugin, PluginKey } from '@milkdown/prose/state';
import { Decoration, DecorationSet } from '@milkdown/prose/view';

export const activeBlockPluginKey = new PluginKey('swrite-active-block');

/**
 * Marks the top-level block containing the cursor with
 * `swrite-active-block` so typewriter-lock CSS can dim everything else.
 * Recomputes on doc change AND selection change (cursor moves don't
 * touch the doc, so selectionSet must be watched explicitly).
 */
export function createActiveBlockPlugin() {
  return new Plugin({
    key: activeBlockPluginKey,
    state: {
      init(_, state) {
        return buildActiveBlockDecorations(state);
      },
      apply(tr, oldDecos, _oldState, newState) {
        if (tr.docChanged || tr.selectionSet) {
          return buildActiveBlockDecorations(newState);
        }
        return oldDecos.map(tr.mapping, tr.doc);
      },
    },
    props: {
      decorations(state) {
        return this.getState(state) || DecorationSet.empty;
      },
    },
  });
}

function buildActiveBlockDecorations(state: any): DecorationSet {
  const { $from } = state.selection;
  // Depth 0 means an empty doc with no parent block to mark.
  if ($from.depth === 0) return DecorationSet.empty;
  // Node decorations must span the whole node: use before/after
  // (start/end give content edges, which is an invalid node range).
  const from = $from.before($from.depth);
  const to = $from.after($from.depth);
  return DecorationSet.create(state.doc, [Decoration.node(from, to, { class: 'swrite-active-block' })]);
}

export const activeBlockProsePlugin = () => $prose(() => createActiveBlockPlugin());
