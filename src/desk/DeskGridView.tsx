import React from 'react';
import { DeskItemEntry } from './types';
import {
  FileText,
  User,
  MapPin,
  Globe,
  BookOpen,
  LayoutGrid,
  Image as ImageIcon,
  Columns,
  Link2,
  Trash2,
} from 'lucide-react';

export interface DeskGridViewProps {
  items: DeskItemEntry[];
  onOpenItem: (item: DeskItemEntry) => void;
  onOpenSplit: (item: DeskItemEntry) => void;
  onInspectBacklinks: (item: DeskItemEntry) => void;
  onDeleteItem: (item: DeskItemEntry) => void;
}

export const DeskGridView: React.FC<DeskGridViewProps> = ({
  items,
  onOpenItem,
  onOpenSplit,
  onInspectBacklinks,
  onDeleteItem,
}) => {
  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'characters':
        return <User size={18} className="cat-icon char" />;
      case 'locations':
        return <MapPin size={18} className="cat-icon loc" />;
      case 'world':
        return <Globe size={18} className="cat-icon world" />;
      case 'research':
        return <BookOpen size={18} className="cat-icon res" />;
      case 'moodboards':
        return <LayoutGrid size={18} className="cat-icon mb" />;
      case 'assets':
        return <ImageIcon size={18} className="cat-icon asset" />;
      default:
        return <FileText size={18} className="cat-icon note" />;
    }
  };

  if (items.length === 0) {
    return (
      <div className="desk-empty-state">
        <div className="empty-inner">
          <BookOpen size={36} />
          <h3>No Desk Items in this View</h3>
          <p>Create a new note, character profile, research document, or moodboard using the <strong>+ New</strong> button above.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="desk-grid-container">
      {items.map((item) => (
        <div
          key={item.file.relative_path}
          className={`desk-card card-${item.category}`}
          onClick={() => onOpenItem(item)}
        >
          <div className="card-header">
            <div className="card-header-left">
              {getCategoryIcon(item.category)}
              <span className="card-badge">{item.category}</span>
            </div>
            <div className="card-actions" onClick={(e) => e.stopPropagation()}>
              <button
                className="card-action-btn"
                onClick={() => onOpenSplit(item)}
                title="Open in Split View with Manuscript"
              >
                <Columns size={13} />
              </button>
              <button
                className="card-action-btn"
                onClick={() => onInspectBacklinks(item)}
                title="Inspect References & Backlinks"
              >
                <Link2 size={13} />
              </button>
              <button
                className="card-action-btn danger"
                onClick={() => onDeleteItem(item)}
                title="Delete File"
              >
                <Trash2 size={13} />
              </button>
            </div>
          </div>

          <div className="card-body">
            <h4 className="card-title">{item.title}</h4>
            <span className="card-path">{item.file.relative_path}</span>
          </div>

          <div className="card-footer">
            <span className="card-size">
              {item.file.size_bytes > 0 ? `${Math.round(item.file.size_bytes / 1024 * 10) / 10} KB` : 'Document'}
            </span>
            <button className="card-open-btn">Open →</button>
          </div>
        </div>
      ))}
    </div>
  );
};
