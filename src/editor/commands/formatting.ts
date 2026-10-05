import { EditorView } from '@milkdown/prose/view';
import { toggleMark, setBlockType, wrapIn } from '@milkdown/prose/commands';

export const FormattingCommands = {
  // Inline Marks
  toggleBold: (view: EditorView) => {
    const mark = view.state.schema.marks.strong;
    if (mark) {
      return toggleMark(mark)(view.state, view.dispatch);
    }
    return false;
  },

  toggleItalic: (view: EditorView) => {
    const mark = view.state.schema.marks.em;
    if (mark) {
      return toggleMark(mark)(view.state, view.dispatch);
    }
    return false;
  },

  toggleStrikethrough: (view: EditorView) => {
    const mark = view.state.schema.marks.strike_through;
    if (mark) {
      return toggleMark(mark)(view.state, view.dispatch);
    }
    return false;
  },

  toggleCode: (view: EditorView) => {
    const mark = view.state.schema.marks.code_inline;
    if (mark) {
      return toggleMark(mark)(view.state, view.dispatch);
    }
    return false;
  },

  // Block Level
  setHeading: (view: EditorView, level: 1 | 2 | 3 | 4 | 5 | 6) => {
    const nodeType = view.state.schema.nodes.heading;
    if (nodeType) {
      return setBlockType(nodeType, { level })(view.state, view.dispatch);
    }
    return false;
  },

  setParagraph: (view: EditorView) => {
    const nodeType = view.state.schema.nodes.paragraph;
    if (nodeType) {
      return setBlockType(nodeType)(view.state, view.dispatch);
    }
    return false;
  },

  wrapInBlockquote: (view: EditorView) => {
    const nodeType = view.state.schema.nodes.blockquote;
    if (nodeType) {
      return wrapIn(nodeType)(view.state, view.dispatch);
    }
    return false;
  },

  wrapInBulletList: (view: EditorView) => {
    const nodeType = view.state.schema.nodes.bullet_list;
    if (nodeType) {
      return wrapIn(nodeType)(view.state, view.dispatch);
    }
    return false;
  },

  wrapInOrderedList: (view: EditorView) => {
    const nodeType = view.state.schema.nodes.ordered_list;
    if (nodeType) {
      return wrapIn(nodeType)(view.state, view.dispatch);
    }
    return false;
  },

  insertSceneBreak: (view: EditorView) => {
    const nodeType = view.state.schema.nodes.scene_break || view.state.schema.nodes.hr;
    if (!nodeType) return false;

    const { state, dispatch } = view;
    const { $from } = state.selection;
    const node = nodeType.create();
    const tr = state.tr.replaceWith($from.pos, $from.pos, node);
    dispatch(tr.scrollIntoView());
    return true;
  },

  insertPageBreak: (view: EditorView) => {
    const nodeType = view.state.schema.nodes.page_break;
    if (!nodeType) return false;

    const { state, dispatch } = view;
    const { $from } = state.selection;
    const node = nodeType.create();
    const tr = state.tr.replaceWith($from.pos, $from.pos, node);
    dispatch(tr.scrollIntoView());
    return true;
  },

  insertLink: (view: EditorView, href: string, title?: string) => {
    const markType = view.state.schema.marks.link;
    if (!markType) return false;

    const { state, dispatch } = view;
    const { selection } = state;
    if (selection.empty) {
      const node = state.schema.text(title || href, [markType.create({ href, title })]);
      const tr = state.tr.replaceSelectionWith(node, false);
      dispatch(tr.scrollIntoView());
    } else {
      toggleMark(markType, { href, title })(state, dispatch);
    }
    return true;
  },

  // Active mark / node queries
  isMarkActive: (view: EditorView, markName: string): boolean => {
    const { state } = view;
    const { from, $from, to, empty } = state.selection;
    const markType = state.schema.marks[markName];
    if (!markType) return false;

    if (empty) {
      return Boolean(markType.isInSet(state.storedMarks || $from.marks()));
    }
    return state.doc.rangeHasMark(from, to, markType);
  },

  isNodeActive: (view: EditorView, nodeName: string, attrs: Record<string, unknown> = {}): boolean => {
    const { state } = view;
    const { $from, to } = state.selection;
    const nodeType = state.schema.nodes[nodeName];
    if (!nodeType) return false;

    let match = false;
    state.doc.nodesBetween($from.pos, to, (node) => {
      if (node.type === nodeType) {
        const matchesAttrs = Object.entries(attrs).every(([key, value]) => node.attrs[key] === value);
        if (matchesAttrs) match = true;
      }
    });
    return match;
  },
};
