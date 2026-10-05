import React from 'react';
import { EditorView } from '@milkdown/prose/view';
import { FormattingCommands } from '../commands/formatting';
import {
  Bold,
  Italic,
  Strikethrough,
  Code,
  Heading1,
  Heading2,
  Heading3,
  Quote,
  List,
  ListOrdered,
  Sparkles,
  FileText,
} from 'lucide-react';

export interface FormattingBarProps {
  getView: () => EditorView | null;
}

export const FormattingBar: React.FC<FormattingBarProps> = ({ getView }) => {
  const runCommand = (action: (view: EditorView) => void) => {
    const view = getView();
    if (view) {
      action(view);
      view.focus();
    }
  };

  return (
    <div className="swrite-formatting-bar">
      <div className="btn-group">
        <button
          type="button"
          className="format-btn"
          title="Heading 1 (Ctrl+Alt+1)"
          onClick={() => runCommand((v) => FormattingCommands.setHeading(v, 1))}
        >
          <Heading1 size={15} />
        </button>
        <button
          type="button"
          className="format-btn"
          title="Heading 2 (Ctrl+Alt+2)"
          onClick={() => runCommand((v) => FormattingCommands.setHeading(v, 2))}
        >
          <Heading2 size={15} />
        </button>
        <button
          type="button"
          className="format-btn"
          title="Heading 3 (Ctrl+Alt+3)"
          onClick={() => runCommand((v) => FormattingCommands.setHeading(v, 3))}
        >
          <Heading3 size={15} />
        </button>
      </div>

      <div className="toolbar-separator" />

      <div className="btn-group">
        <button
          type="button"
          className="format-btn"
          title="Bold (Ctrl+B)"
          onClick={() => runCommand(FormattingCommands.toggleBold)}
        >
          <Bold size={15} />
        </button>
        <button
          type="button"
          className="format-btn"
          title="Italic (Ctrl+I)"
          onClick={() => runCommand(FormattingCommands.toggleItalic)}
        >
          <Italic size={15} />
        </button>
        <button
          type="button"
          className="format-btn"
          title="Strikethrough (Ctrl+Shift+S)"
          onClick={() => runCommand(FormattingCommands.toggleStrikethrough)}
        >
          <Strikethrough size={15} />
        </button>
        <button
          type="button"
          className="format-btn"
          title="Inline Code (Ctrl+`)"
          onClick={() => runCommand(FormattingCommands.toggleCode)}
        >
          <Code size={15} />
        </button>
      </div>

      <div className="toolbar-separator" />

      <div className="btn-group">
        <button
          type="button"
          className="format-btn"
          title="Blockquote (Ctrl+Shift+Q)"
          onClick={() => runCommand(FormattingCommands.wrapInBlockquote)}
        >
          <Quote size={15} />
        </button>
        <button
          type="button"
          className="format-btn"
          title="Bullet List (Ctrl+Shift+8)"
          onClick={() => runCommand(FormattingCommands.wrapInBulletList)}
        >
          <List size={15} />
        </button>
        <button
          type="button"
          className="format-btn"
          title="Numbered List (Ctrl+Shift+7)"
          onClick={() => runCommand(FormattingCommands.wrapInOrderedList)}
        >
          <ListOrdered size={15} />
        </button>
      </div>

      <div className="toolbar-separator" />

      <div className="btn-group">
        <button
          type="button"
          className="format-btn"
          title="Scene Break (Ctrl+Shift+D)"
          onClick={() => runCommand(FormattingCommands.insertSceneBreak)}
        >
          <Sparkles size={15} />
        </button>
        <button
          type="button"
          className="format-btn"
          title="Page Break (Ctrl+Shift+Enter)"
          onClick={() => runCommand(FormattingCommands.insertPageBreak)}
        >
          <FileText size={15} />
        </button>
      </div>
    </div>
  );
};
