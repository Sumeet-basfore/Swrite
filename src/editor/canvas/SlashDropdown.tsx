import React, { useState, useEffect } from 'react';
import { EditorView } from '@milkdown/prose/view';
import { SLASH_ACTIONS, SlashAction } from '../commands/slashCommands';
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
} from 'lucide-react';

export interface SlashDropdownProps {
  view: EditorView;
  query: string;
  position: { top: number; left: number };
  onClose: () => void;
}

const ICON_MAP: Record<string, React.FC<{ size: number }>> = {
  Heading1,
  Heading2,
  Heading3,
  Pilcrow,
  Sparkles,
  FileText,
  Quote,
  List,
  ListOrdered,
};

export const SlashDropdown: React.FC<SlashDropdownProps> = ({
  view,
  query,
  position,
  onClose,
}) => {
  const [selectedIndex, setSelectedIndex] = useState(0);

  const filtered = SLASH_ACTIONS.filter(
    (action) =>
      action.title.toLowerCase().includes(query.toLowerCase()) ||
      action.subtitle.toLowerCase().includes(query.toLowerCase()) ||
      action.keywords.some((k) => k.includes(query.toLowerCase()))
  );

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
    // Delete the slash character typed before running command
    const { state, dispatch } = view;
    const { $from } = state.selection;
    const slashStart = Math.max(0, $from.pos - (query.length + 1));
    const tr = state.tr.delete(slashStart, $from.pos);
    dispatch(tr);

    action.run(view);
    onClose();
  };

  if (filtered.length === 0) return null;

  return (
    <div
      className="swrite-slash-dropdown"
      style={{ top: `${position.top + 24}px`, left: `${position.left}px` }}
    >
      <div className="slash-header">
        <span>Insert Block</span>
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
