import React, { useState, useEffect } from 'react';
import { EditorView } from '@milkdown/prose/view';
import { filterSlashActions, SlashAction, SlashActionContext } from '../commands/slashCommands';
import {
  Heading1,
  Heading2,
  Heading3,
  Pilcrow,
  Sparkles,
  FileText,
  Quote,
  List,
  ListOrdered,
  CheckSquare,
  Table,
  Link,
  Image,
  Minus,
  StickyNote,
  MessageSquare,
  Bookmark,
  Feather,
  BookOpen,
  BarChart2,
  Search,
  Eye,
  Book,
  Bold,
  Italic,
  Underline,
  Strikethrough,
  Code,
} from 'lucide-react';

export interface SlashDropdownProps {
  view: EditorView;
  query: string;
  position: { top: number; left: number };
  context?: SlashActionContext;
  onClose: () => void;
}

const ICON_MAP: Record<string, React.FC<{ size: number }>> = {
  Heading1,
  Heading2,
  Heading3,
  Pilcrow,
  Bold,
  Italic,
  Underline,
  Strikethrough,
  Code,
  Sparkles,
  FileText,
  Quote,
  List,
  ListOrdered,
  CheckSquare,
  Table,
  Link,
  Image,
  Minus,
  StickyNote,
  MessageSquare,
  Bookmark,
  Feather,
  BookOpen,
  BarChart2,
  Search,
  Eye,
  Book,
};

export const SlashDropdown: React.FC<SlashDropdownProps> = ({
  view,
  query,
  position,
  context,
  onClose,
}) => {
  const [selectedIndex, setSelectedIndex] = useState(0);

  const filtered = filterSlashActions(query);

  useEffect(() => {
    setSelectedIndex(0);
  }, [query]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setSelectedIndex((prev) => (prev + 1) % (filtered.length || 1));
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setSelectedIndex((prev) => (prev - 1 + filtered.length) % (filtered.length || 1));
      } else if (e.key === 'Enter') {
        e.preventDefault();
        if (filtered[selectedIndex]) {
          executeAction(filtered[selectedIndex]);
        }
      } else if (e.key === 'Escape') {
        e.preventDefault();
        onClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown, true);
    return () => window.removeEventListener('keydown', handleKeyDown, true);
  }, [filtered, selectedIndex]);

  const executeAction = (action: SlashAction) => {
    // Delete the slash characters typed before running command
    const { state, dispatch } = view;
    const { $from } = state.selection;
    const slashStart = Math.max(0, $from.pos - (query.length + 1));
    const tr = state.tr.delete(slashStart, $from.pos);
    dispatch(tr);

    action.run(view, context);
    onClose();
  };

  if (filtered.length === 0) return null;

  return (
    <div
      className="swrite-slash-dropdown"
      style={{ top: `${position.top + 24}px`, left: `${position.left}px` }}
    >
      <div className="slash-header">
        <span>Insert Block or Command</span>
      </div>
      <div className="slash-items">
        {filtered.map((action, idx) => {
          const IconComp = ICON_MAP[action.icon] || Pilcrow;
          const isSelected = idx === selectedIndex;
          return (
            <div
              key={action.id}
              className={`slash-item ${isSelected ? 'selected' : ''}`}
              onClick={() => executeAction(action)}
              onMouseEnter={() => setSelectedIndex(idx)}
            >
              <div className="slash-item-icon">
                <IconComp size={16} />
              </div>
              <div className="slash-item-content">
                <div className="slash-item-title">{action.title}</div>
                <div className="slash-item-subtitle">{action.subtitle}</div>
              </div>
              {action.shortcut && (
                <div className="slash-item-shortcut">{action.shortcut}</div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
