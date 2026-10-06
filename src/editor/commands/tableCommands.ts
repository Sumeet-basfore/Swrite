import { EditorView } from '@milkdown/prose/view';
import { Fragment } from '@milkdown/prose/model';

/**
 * Creates Markdown representation of a standard table
 */
export function generateMarkdownTable(rows: number = 3, cols: number = 3): string {
  const safeRows = Math.max(1, Math.min(20, rows));
  const safeCols = Math.max(1, Math.min(10, cols));

  const headerRow = '| ' + Array.from({ length: safeCols }, (_, i) => `Header ${i + 1}`).join(' | ') + ' |';
  const separatorRow = '| ' + Array.from({ length: safeCols }, () => '---').join(' | ') + ' |';
  const dataRows = Array.from({ length: safeRows - 1 }, (_, r) => {
    return '| ' + Array.from({ length: safeCols }, (_, c) => `Cell ${r + 1},${c + 1}`).join(' | ') + ' |';
  });

  return [headerRow, separatorRow, ...dataRows].join('\n') + '\n\n';
}

/**
 * Table manipulation commands in ProseMirror
 */
export const TableCommands = {
  /**
   * Inserts a table at current cursor
   */
  insertTable: (view: EditorView, rows: number = 3, cols: number = 3): boolean => {
    const { state, dispatch } = view;
    const { schema, tr } = state;

    // Check if table nodes exist in schema
    const tableType = schema.nodes.table;
    const tableRowType = schema.nodes.table_row;
    const tableCellType = schema.nodes.table_cell;
    const tableHeaderType = schema.nodes.table_header || schema.nodes.table_cell;
    const paragraphType = schema.nodes.paragraph;

    if (tableType && tableRowType && tableCellType && paragraphType) {
      const rowNodes = [];

      // Create Header Row
      const headerCells = [];
      for (let c = 0; c < cols; c++) {
        const p = paragraphType.create(null, schema.text(`Header ${c + 1}`));
        headerCells.push((tableHeaderType || tableCellType).create(null, Fragment.from(p)));
      }
      rowNodes.push(tableRowType.create(null, Fragment.from(headerCells)));

      // Create Body Rows
      for (let r = 0; r < Math.max(1, rows - 1); r++) {
        const cells = [];
        for (let c = 0; c < cols; c++) {
          const p = paragraphType.create(null, schema.text(`Cell ${r + 1},${c + 1}`));
          cells.push(tableCellType.create(null, Fragment.from(p)));
        }
        rowNodes.push(tableRowType.create(null, Fragment.from(cells)));
      }

      const tableNode = tableType.create(null, Fragment.from(rowNodes));
      const newTr = tr.replaceSelectionWith(tableNode).scrollIntoView();
      dispatch(newTr);
      return true;
    }

    // Fallback if schema doesn't have table node: insert as standard Markdown text
    const mdTable = generateMarkdownTable(rows, cols);
    const textNode = schema.text(mdTable);
    const fallbackTr = tr.replaceSelectionWith(textNode).scrollIntoView();
    dispatch(fallbackTr);
    return true;
  },

  /**
   * Adds a row below the currently selected cell
   */
  addRow: (view: EditorView): boolean => {
    const { state, dispatch } = view;
    const { schema, selection } = state;
    const { $from } = selection;

    const rowType = schema.nodes.table_row;
    const cellType = schema.nodes.table_cell;
    const pType = schema.nodes.paragraph;

    if (!rowType || !cellType || !pType) return false;

    // Find row depth
    for (let d = $from.depth; d > 0; d--) {
      const node = $from.node(d);
      if (node.type === rowType) {
        const colCount = node.childCount;
        const cells = [];
        for (let i = 0; i < colCount; i++) {
          cells.push(cellType.create(null, Fragment.from(pType.create())));
        }
        const newRow = rowType.create(null, Fragment.from(cells));
        const insertPos = $from.after(d);
        const tr = state.tr.insert(insertPos, newRow);
        dispatch(tr.scrollIntoView());
        return true;
      }
    }
    return false;
  },

  /**
   * Deletes the currently focused row
   */
  deleteRow: (view: EditorView): boolean => {
    const { state, dispatch } = view;
    const { schema, selection } = state;
    const { $from } = selection;
    const rowType = schema.nodes.table_row;

    if (!rowType) return false;

    for (let d = $from.depth; d > 0; d--) {
      const node = $from.node(d);
      if (node.type === rowType) {
        const start = $from.before(d);
        const end = $from.after(d);
        const tr = state.tr.delete(start, end);
        dispatch(tr.scrollIntoView());
        return true;
      }
    }
    return false;
  },

  /**
   * Deletes the entire enclosing table
   */
  deleteTable: (view: EditorView): boolean => {
    const { state, dispatch } = view;
    const { schema, selection } = state;
    const { $from } = selection;
    const tableType = schema.nodes.table;

    if (!tableType) return false;

    for (let d = $from.depth; d > 0; d--) {
      const node = $from.node(d);
      if (node.type === tableType) {
        const start = $from.before(d);
        const end = $from.after(d);
        const tr = state.tr.delete(start, end);
        dispatch(tr.scrollIntoView());
        return true;
      }
    }
    return false;
  },
};
