import React from 'react';
import { EditorView } from '@milkdown/prose/view';
import { FormattingCommands } from '../commands/formatting';
import {
  Bold,
  Italic,
  Underline,
  Strikethrough,
  Code,
  Heading1,
  Heading2,
  Heading3,
  Quote,
  List,
  ListOrdered,
  CheckSquare,
  Sparkles,
  FileText,
  Link as LinkIcon,
  Image as ImageIcon,
  Table as TableIcon,
  MessageSquare,
  Bookmark,
} from 'lucide-react';

export interface FormattingBarProps {
  getView: () => EditorView | null;
  onOpenLinkModal?: () => void;
  onOpenImageModal?: () => void;
  onOpenTableModal?: () => void;
  onOpenCommentModal?: () => void;
  onAddBookmark?: () => void;
}

export const FormattingBar: React.FC<FormattingBarProps> = ({
  getView,
  onOpenLinkModal,
  onOpenImageModal,
  onOpenTableModal,
  onOpenCommentModal,
  onAddBookmark,
}) => {
  const runCommand = (action: (view: EditorView) => void) => {
    const view = getView();
    if (view) {
      action(view);
      view.focus();
    }
  };

  return (
    <div className="swrite-formatting-bar">
      {/* Headings */}
      <div className="btn-group">
        <button
          type="button"
          className="format-btn"
          title="Heading 1 (Mod+Alt+1)"
          onClick={() => runCommand((v) => FormattingCommands.setHeading(v, 1))}
        >
          <Heading1 size={15} />
        </button>
        <button
          type="button"
          className="format-btn"
          title="Heading 2 (Mod+Alt+2)"
          onClick={() => runCommand((v) => FormattingCommands.setHeading(v, 2))}
        >
          <Heading2 size={15} />
        </button>
        <button
          type="button"
          className="format-btn"
          title="Heading 3 (Mod+Alt+3)"
          onClick={() => runCommand((v) => FormattingCommands.setHeading(v, 3))}
        >
          <Heading3 size={15} />
        </button>
      </div>

      <div className="toolbar-separator" />

      {/* Inlines */}
      <div className="btn-group">
        <button
          type="button"
          className="format-btn"
          title="Bold (Mod+B)"
          onClick={() => runCommand(FormattingCommands.toggleBold)}
        >
          <Bold size={15} />
        </button>
        <button
          type="button"
          className="format-btn"
          title="Italic (Mod+I)"
          onClick={() => runCommand(FormattingCommands.toggleItalic)}
        >
          <Italic size={15} />
        </button>
        <button
          type="button"
          className="format-btn"
          title="Underline (Mod+U)"
          onClick={() => runCommand(FormattingCommands.toggleUnderline)}
        >
          <Underline size={15} />
        </button>
        <button
          type="button"
          className="format-btn"
          title="Strikethrough (Mod+Shift+X)"
          onClick={() => runCommand(FormattingCommands.toggleStrikethrough)}
        >
          <Strikethrough size={15} />
        </button>
        <button
          type="button"
          className="format-btn"
          title="Inline Code (Mod+`)"
          onClick={() => runCommand(FormattingCommands.toggleCode)}
        >
          <Code size={15} />
        </button>
      </div>

      <div className="toolbar-separator" />

      {/* Blocks & Lists */}
      <div className="btn-group">
        <button
          type="button"
          className="format-btn"
          title="Blockquote (Mod+Shift+Q)"
          onClick={() => runCommand(FormattingCommands.wrapInBlockquote)}
        >
          <Quote size={15} />
        </button>
        <button
          type="button"
          className="format-btn"
          title="Bullet List (Mod+Shift+8)"
          onClick={() => runCommand(FormattingCommands.wrapInBulletList)}
        >
          <List size={15} />
        </button>
        <button
          type="button"
          className="format-btn"
          title="Numbered List (Mod+Shift+7)"
          onClick={() => runCommand(FormattingCommands.wrapInOrderedList)}
        >
          <ListOrdered size={15} />
        </button>
        <button
          type="button"
          className="format-btn"
          title="Task List / Checklist"
          onClick={() =>
            runCommand((v) => {
              const textNode = v.state.schema.text('- [ ] ');
              v.dispatch(v.state.tr.replaceSelectionWith(textNode));
            })
          }
        >
          <CheckSquare size={15} />
        </button>
      </div>

      <div className="toolbar-separator" />

      {/* Media, Tables, Links */}
      <div className="btn-group">
        <button
          type="button"
          className="format-btn"
          title="Insert Link (Mod+K)"
          onClick={onOpenLinkModal || (() => runCommand((v) => FormattingCommands.insertLink(v, 'https://')))}
        >
          <LinkIcon size={15} />
        </button>
        <button
          type="button"
          className="format-btn"
          title="Insert Table"
          onClick={onOpenTableModal || (() => runCommand((v) => FormattingCommands.insertTable(v, 3, 3)))}
        >
          <TableIcon size={15} />
        </button>
        <button
          type="button"
          className="format-btn"
          title="Insert Image"
          onClick={onOpenImageModal || (() => runCommand((v) => FormattingCommands.insertImage(v, 'image.png')))}
        >
          <ImageIcon size={15} />
        </button>
      </div>

      <div className="toolbar-separator" />

      {/* Breaks & Annotations */}
      <div className="btn-group">
        <button
          type="button"
          className="format-btn"
          title="Scene Break (Mod+Shift+D)"
          onClick={() => runCommand(FormattingCommands.insertSceneBreak)}
        >
          <Sparkles size={15} />
        </button>
        <button
          type="button"
          className="format-btn"
          title="Page Break (Mod+Shift+Enter)"
          onClick={() => runCommand(FormattingCommands.insertPageBreak)}
        >
          <FileText size={15} />
        </button>
        <button
          type="button"
          className="format-btn"
          title="Add Bookmark (Mod+Shift+B)"
          onClick={onAddBookmark || (() => runCommand((v) => FormattingCommands.insertBookmark(v, 'Revisit later')))}
        >
          <Bookmark size={15} />
        </button>
        {onOpenCommentModal && (
          <button
            type="button"
            className="format-btn"
            title="Add Comment (Mod+Shift+C)"
            onClick={onOpenCommentModal}
          >
            <MessageSquare size={15} />
          </button>
        )}
      </div>
    </div>
  );
};
