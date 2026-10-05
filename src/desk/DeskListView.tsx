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

export interface DeskListViewProps {
  items: DeskItemEntry[];
  onOpenItem: (item: DeskItemEntry) => void;
  onOpenSplit: (item: DeskItemEntry) => void;
  onInspectBacklinks: (item: DeskItemEntry) => void;
  onDeleteItem: (item: DeskItemEntry) => void;
}

export const DeskListView: React.FC<DeskListViewProps> = ({
  items,
  onOpenItem,
  onOpenSplit,
  onInspectBacklinks,
  onDeleteItem,
}) => {
  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'characters':
        return <User size={15} className="cat-icon char" />;
      case 'locations':
        return <MapPin size={15} className="cat-icon loc" />;
      case 'world':
        return <Globe size={15} className="cat-icon world" />;
      case 'research':
        return <BookOpen size={15} className="cat-icon res" />;
      case 'moodboards':
        return <LayoutGrid size={15} className="cat-icon mb" />;
      case 'assets':
        return <ImageIcon size={15} className="cat-icon asset" />;
      default:
        return <FileText size={15} className="cat-icon note" />;
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
    <div className="desk-list-container">
      <table className="desk-table">
        <thead>
          <tr>
            <th>Name</th>
            <th>Category</th>
            <th>Location</th>
            <th>Size</th>
            <th className="actions-col">Actions</th>
          </tr>
        </thead>
        <tbody>
          {items.map((item) => (
            <tr
              key={item.file.relative_path}
              className="desk-table-row"
              onClick={() => onOpenItem(item)}
            >
              <td className="row-title">
                <div className="title-cell">
                  {getCategoryIcon(item.category)}
                  <span className="name-text">{item.title}</span>
                </div>
              </td>
              <td className="row-category">
                <span className={`table-badge badge-${item.category}`}>
                  {item.category}
                </span>
              </td>
              <td className="row-path">
                <code>{item.file.relative_path}</code>
              </td>
              <td className="row-size">
                {item.file.size_bytes > 0
                  ? `${Math.round((item.file.size_bytes / 1024) * 10) / 10} KB`
                  : '—'}
              </td>
              <td className="row-actions" onClick={(e) => e.stopPropagation()}>
                <button
                  className="table-action-btn"
                  onClick={() => onOpenSplit(item)}
                  title="Open in Split View"
                >
                  <Columns size={13} />
                </button>
                <button
                  className="table-action-btn"
                  onClick={() => onInspectBacklinks(item)}
                  title="Inspect Backlinks"
                >
                  <Link2 size={13} />
                </button>
                <button
                  className="table-action-btn danger"
                  onClick={() => onDeleteItem(item)}
                  title="Delete File"
                >
                  <Trash2 size={13} />
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};
