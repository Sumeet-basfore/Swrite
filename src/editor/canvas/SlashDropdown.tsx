import React, { useState, useEffect, useLayoutEffect, useRef } from 'react';
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
  /**
   * Viewport-relative cursor rect (ProseMirror coordsAtPos client coords).
   * The menu uses position:fixed so these map 1:1 — never feed them to an
   * absolutely-positioned element inside the (relative, overflow:hidden)
   * editor container or the menu lands far from the cursor and clips.
   */
  position: { top: number; bottom: number; left: number };
  context?: SlashActionContext;
  onClose: () => void;
}

const MENU_WIDTH = 300;
const EDGE_MARGIN = 8;
const BELOW_GAP = 6;
const MIN_ITEMS_HEIGHT = 120;

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
  const menuRef = useRef<HTMLDivElement>(null);
  const [placed, setPlaced] = useState<{ top: number; left: number; itemsMaxHeight: number } | null>(null);

  const filtered = filterSlashActions(query);

  // Clamp to the viewport and flip above the cursor when there is no
  // room below (e.g. cursor near the status bar). Re-runs as the query
  // narrows and the menu shrinks.
  useLayoutEffect(() => {
    const el = menuRef.current;
    if (!el) return;
    const height = el.offsetHeight || 320;
    const width = el.offsetWidth || MENU_WIDTH;

    const spaceBelow = window.innerHeight - position.bottom - EDGE_MARGIN;
    const spaceAbove = position.top - EDGE_MARGIN;
    const openBelow = spaceBelow >= Math.min(height, 200) || spaceBelow >= spaceAbove;

    const avail = openBelow ? spaceBelow : spaceAbove;
    const top = openBelow
      ? Math.min(position.bottom + BELOW_GAP, window.innerHeight - Math.min(height, avail) - EDGE_MARGIN)
      : Math.max(EDGE_MARGIN, position.top - BELOW_GAP - height);
    const left = Math.max(
      EDGE_MARGIN,
      Math.min(position.left, window.innerWidth - width - EDGE_MARGIN)
    );
    setPlaced({
      top: Math.max(EDGE_MARGIN, top),
      left,
      itemsMaxHeight: Math.max(MIN_ITEMS_HEIGHT, avail - 80),
    });
  }, [position, query, filtered.length]);

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
      ref={menuRef}
      className="swrite-slash-dropdown"
      style={{
        top: `${(placed?.top ?? position.bottom + BELOW_GAP)}px`,
        left: `${(placed?.left ?? position.left)}px`,
        visibility: placed ? 'visible' : 'hidden',
      }}
    >
      <div className="slash-header">
        <span>Insert Block or Command</span>
      </div>
      <div
        className="slash-items"
        style={placed ? { maxHeight: `${placed.itemsMaxHeight}px` } : undefined}
      >
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
