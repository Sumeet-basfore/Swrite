import { describe, it, expect } from 'vitest';
import { Schema } from '@milkdown/prose/model';
import { EditorState, TextSelection } from '@milkdown/prose/state';
import { createActiveBlockPlugin, activeBlockPluginKey } from '../activeBlockPlugin';

const schema = new Schema({
  nodes: {
    doc: { content: 'block+' },
    paragraph: { group: 'block', content: 'inline*' },
    text: { group: 'inline' },
  },
  marks: {},
});

const TEXTS = ['First paragraph here.', 'Second paragraph here.', 'Third.'];

function paraStart(index: number): number {
  let pos = 0;
  for (let i = 0; i < index; i++) pos += TEXTS[i].length + 2;
  return pos;
}

function stateWithCursor(block: number, offset = 1) {
  const doc = schema.nodes.doc.create(
    null,
    TEXTS.map((t) => schema.nodes.paragraph.create(null, schema.text(t)))
  );
  let state = EditorState.create({ schema, doc, plugins: [createActiveBlockPlugin()] });
  const tr = state.tr.setSelection(
    TextSelection.create(state.doc, paraStart(block) + 1 + offset)
  );
  return state.apply(tr);
}

function activeRanges(state: EditorState) {
  const set = activeBlockPluginKey.getState(state);
  return set.find().map((d: { from: number; to: number }) => [d.from, d.to]);
}

describe('activeBlockPlugin', () => {
  it('marks exactly the block holding the cursor', () => {
    const state = stateWithCursor(1);
    const len = TEXTS[1].length;
    expect(activeRanges(state)).toEqual([[paraStart(1), paraStart(1) + len + 2]]);
  });

  it('moves the mark when the cursor moves blocks', () => {
    let state = stateWithCursor(0);
    expect(activeRanges(state)[0][0]).toBe(paraStart(0));
    const tr = state.tr.setSelection(
      TextSelection.create(state.doc, paraStart(2) + 2)
    );
    state = state.apply(tr);
    const len = TEXTS[2].length;
    expect(activeRanges(state)).toEqual([[paraStart(2), paraStart(2) + len + 2]]);
  });

  it('marks the sole empty paragraph as the active block', () => {
    const doc = schema.nodes.doc.create(null, [
      schema.nodes.paragraph.create(null, null),
    ]);
    const state = EditorState.create({ schema, doc, plugins: [createActiveBlockPlugin()] });
    expect(activeRanges(state)).toEqual([[0, 2]]);
  });
});
